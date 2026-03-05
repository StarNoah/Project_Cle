import { NextRequest, NextResponse } from "next/server";
import { startApifyRun, getApifyRunDetails, getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";

const HASHTAGS = [
  "클라이밍",
  "볼더링",
  "climbing",
  "bouldering",
  "rockclimbing",
  "클라이밍장",
];

const VALID_STATUSES = ["RUNNING", "READY", "SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];

export async function GET(request: NextRequest) {
  const cronSecret = getEnv("CRON_SECRET");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
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
      const posts = items.map(transformApifyPost);

      for (const post of posts) {
        await supabase
          .from("posts")
          .upsert(post, { onConflict: "instagram_id" });
      }

      const duration = Date.now() - startTime;
      if (logId) {
        await supabase
          .from("collection_logs")
          .update({
            status: "success",
            posts_collected: posts.length,
            duration_ms: duration,
          })
          .eq("id", logId);
      }

      return NextResponse.json({
        success: true,
        mode: "polling",
        postsCollected: posts.length,
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
