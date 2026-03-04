import { NextRequest, NextResponse } from "next/server";
import { getApifyRunDetails, getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const runId = body.runId || body.resource?.id;

    if (!runId) {
      return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    const runDetails = await getApifyRunDetails(runId);
    const datasetId = runDetails.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error("No dataset ID found for run");
    }

    const items = await getApifyDatasetItems(datasetId);
    const posts = items.map(transformApifyPost);

    let upserted = 0;
    for (const post of posts) {
      const { error } = await supabase
        .from("posts")
        .upsert(post, { onConflict: "instagram_id" });
      if (!error) upserted++;
    }

    const duration = Date.now() - startTime;

    await supabase.from("collection_logs").insert({
      status: "success",
      posts_collected: upserted,
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
