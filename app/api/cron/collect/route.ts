import { NextRequest, NextResponse } from "next/server";
import { startApifyRun, getApifyRunDetails, getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { matchPostToGyms, getAllGymHashtags } from "@/lib/gym-matching";
import { matchPostStyles } from "@/lib/style-matching";
import type { Gym } from "@/lib/types";

const BASE_HASHTAGS = [
  "클라이밍",
  "볼더링",
  "클라이밍장",
];

const PRIORITY_REGIONS = ["서울", "경기"];

const MIN_LIKES = 5;

const VALID_STATUSES = ["RUNNING", "READY", "SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const startTime = Date.now();

  const { data: log } = await supabase
    .from("collection_logs")
    .insert({ status: "started" })
    .select("id")
    .single();

  const logId = log?.id;

  try {
    // Fetch gyms and merge hashtags
    const { data: gymsData } = await supabase
      .from("gyms")
      .select("id, name, hashtags, region, area");
    const gyms: Gym[] = (gymsData as Gym[]) || [];

    // 서울/경기 암장 해시태그 추가 (센터/센타 제외는 DB 단에서 이미 필터됨)
    const priorityGyms = gyms.filter((g) => g.region && PRIORITY_REGIONS.includes(g.region));
    const gymHashtags = getAllGymHashtags(priorityGyms).slice(0, 50);
    const HASHTAGS = [...new Set([...BASE_HASHTAGS, ...gymHashtags])];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const webhookUrl = `${siteUrl}/api/webhooks/apify`;
    const isLocal = siteUrl.includes("localhost");

    const runResult = await startApifyRun({
      hashtags: HASHTAGS,
      resultsLimit: 100,
      webhookUrl: isLocal ? undefined : webhookUrl,
    });

    if (isLocal) {
      const runId = runResult.data?.id;
      if (!runId) throw new Error("No run ID returned");

      let status = "RUNNING";
      let iterations = 0;
      const maxIterations = 120; // 10 minutes max

      while ((status === "RUNNING" || status === "READY") && iterations < maxIterations) {
        await new Promise((r) => setTimeout(r, 5000));
        const details = await getApifyRunDetails(runId);
        status = details.data?.status;
        iterations++;

        if (!VALID_STATUSES.includes(status)) {
          throw new Error(`Unexpected Apify run status: ${status}`);
        }
      }

      if (status !== "SUCCEEDED") {
        throw new Error(`Apify run ended with status: ${status}`);
      }

      const details = await getApifyRunDetails(runId);
      const datasetId = details.data?.defaultDatasetId;
      if (!datasetId) throw new Error("No dataset ID");

      const items = await getApifyDatasetItems(datasetId);
      const posts = items.flatMap((item: Record<string, unknown>) => {
        try { return [transformApifyPost(item)]; } catch { return []; }
      });
      const filteredPosts = posts.filter((post: { like_count: number; post_type: string }) => post.like_count >= MIN_LIKES && post.post_type === "reel");

      for (const post of filteredPosts) {
        const styles = matchPostStyles({ hashtags: post.hashtags || [], caption: post.caption });
        const { data: upserted } = await supabase
          .from("posts")
          .upsert({ ...post, styles }, { onConflict: "instagram_id" })
          .select("id, hashtags, caption");

        if (upserted && upserted.length > 0) {
          const row = upserted[0];
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
      if (logId) {
        await supabase
          .from("collection_logs")
          .update({
            status: "success",
            posts_collected: filteredPosts.length,
            duration_ms: duration,
          })
          .eq("id", logId);
      }

      return NextResponse.json({
        success: true,
        mode: "polling",
        postsCollected: filteredPosts.length,
        rawItems: items.length,
        transformed: posts.length,
        duration,
      });
    }

    return NextResponse.json({
      success: true,
      mode: "webhook",
      runId: runResult.data?.id,
      logId,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";

    if (logId) {
      await supabase
        .from("collection_logs")
        .update({
          status: "error",
          error_message: message,
          duration_ms: duration,
        })
        .eq("id", logId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
