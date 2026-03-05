import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getApifyRunDetails, getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = getEnv("WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const startTime = Date.now();

  const rawBody = await request.text();

  // HMAC signature verification
  const signature = request.headers.get("x-apify-webhook-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

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
