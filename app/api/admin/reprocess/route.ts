import { NextRequest, NextResponse } from "next/server";
import { getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { matchPostToGyms } from "@/lib/gym-matching";
import { matchPostStyles } from "@/lib/style-matching";
import type { Gym } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { datasetId } = await request.json();
  if (!datasetId || typeof datasetId !== "string") {
    return NextResponse.json({ error: "datasetId required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const MIN_LIKES = 5;

  const { data: gymsData } = await supabase
    .from("gyms")
    .select("id, name, hashtags, region, area");
  const gyms: Gym[] = (gymsData as Gym[]) || [];

  const items = await getApifyDatasetItems(datasetId);
  const posts = items.flatMap((item: Record<string, unknown>) => {
    try { return [transformApifyPost(item)]; } catch { return []; }
  }).filter((post: { like_count: number }) => post.like_count >= MIN_LIKES);

  // Batch upsert posts (50 at a time)
  const BATCH = 50;
  let upserted = 0;
  const allUpsertedRows: { id: string; hashtags: string[]; caption: string | null }[] = [];

  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH).map((post) => {
      const styles = matchPostStyles({ hashtags: post.hashtags || [], caption: post.caption });
      return { ...post, styles };
    });

    const { data: rows, error } = await supabase
      .from("posts")
      .upsert(batch, { onConflict: "instagram_id" })
      .select("id, hashtags, caption");

    if (!error && rows) {
      upserted += rows.length;
      allUpsertedRows.push(...rows);
    }
  }

  // Batch gym matching
  const gymLinks: { post_id: string; gym_id: number }[] = [];
  for (const row of allUpsertedRows) {
    const matchedGymIds = matchPostToGyms(
      { hashtags: row.hashtags || [], caption: row.caption },
      gyms
    );
    for (const gymId of matchedGymIds) {
      gymLinks.push({ post_id: row.id, gym_id: gymId });
    }
  }

  if (gymLinks.length > 0) {
    for (let i = 0; i < gymLinks.length; i += BATCH) {
      await supabase.from("post_gyms").upsert(
        gymLinks.slice(i, i + BATCH),
        { onConflict: "post_id,gym_id" }
      );
    }
  }

  return NextResponse.json({
    success: true,
    totalItems: items.length,
    transformed: posts.length,
    upserted,
    gymLinks: gymLinks.length,
  });
}
