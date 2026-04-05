import { NextRequest, NextResponse } from "next/server";
import { getApifyDatasetItems, transformApifyPost } from "@/lib/apify";
import { createServiceClient } from "@/lib/supabase/server";
import { matchPostToGyms } from "@/lib/gym-matching";
import { matchPostStyles } from "@/lib/style-matching";
import type { Gym } from "@/lib/types";

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

  let upserted = 0;
  for (const post of posts) {
    const styles = matchPostStyles({ hashtags: post.hashtags || [], caption: post.caption });
    const { data: rows, error } = await supabase
      .from("posts")
      .upsert({ ...post, styles }, { onConflict: "instagram_id" })
      .select("id, hashtags, caption");
    if (!error) upserted++;

    if (rows && rows.length > 0) {
      const row = rows[0];
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

  return NextResponse.json({
    success: true,
    totalItems: items.length,
    transformed: posts.length,
    upserted,
  });
}
