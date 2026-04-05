import { NextRequest, NextResponse } from "next/server";
import { getApifyRunDetails, getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { matchPostToGyms } from "@/lib/gym-matching";
import { matchPostStyles } from "@/lib/style-matching";
import type { Gym } from "@/lib/types";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const supabase = createServiceClient();
  const startTime = Date.now();

  try {
    const body = JSON.parse(rawBody);
    const runId = body.runId || body.resource?.id;

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ error: "Missing or invalid runId" }, { status: 400 });
    }

    // Idempotency check: skip if this run was already processed
    const { data: existing } = await supabase
      .from("collection_logs")
      .select("id")
      .eq("status", "success")
      .like("error_message", `%runId:${runId}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, message: "Already processed", runId });
    }

    const runDetails = await getApifyRunDetails(runId);
    const datasetId = runDetails.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error("No dataset ID found for run");
    }

    // Fetch gyms for matching
    const { data: gymsData } = await supabase
      .from("gyms")
      .select("id, name, hashtags, region, area");
    const gyms: Gym[] = (gymsData as Gym[]) || [];

    const MIN_LIKES = 5;
    const items = await getApifyDatasetItems(datasetId);
    const posts = items.flatMap((item: Record<string, unknown>) => {
      try { return [transformApifyPost(item)]; } catch { return []; }
    }).filter((post: { like_count: number; post_type: string }) => post.like_count >= MIN_LIKES && post.post_type === "reel");

    let upserted = 0;
    for (const post of posts) {
      const styles = matchPostStyles({ hashtags: post.hashtags || [], caption: post.caption });
      const { data: upsertedRows, error } = await supabase
        .from("posts")
        .upsert({ ...post, styles }, { onConflict: "instagram_id" })
        .select("id, hashtags, caption");
      if (!error) upserted++;

      if (upsertedRows && upsertedRows.length > 0) {
        const row = upsertedRows[0];
        const matchedGymIds = matchPostToGyms(
          { hashtags: row.hashtags || [], caption: row.caption },
          gyms
        );
        if (matchedGymIds.length > 0) {
          await supabase.from("post_gyms").upsert(
            matchedGymIds.map((gymId) => ({ post_id: row.id, gym_id: gymId })),
            { onConflict: "post_id,gym_id" }
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    await supabase.from("collection_logs").insert({
      status: "success",
      posts_collected: upserted,
      error_message: `runId:${runId}`,
      duration_ms: duration,
    });

    return NextResponse.json({ success: true, upserted, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";

    await supabase.from("collection_logs").insert({
      status: "error",
      error_message: message,
      duration_ms: duration,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
