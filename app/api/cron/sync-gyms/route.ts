import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { readGymsFromCsv } from "@/lib/gym-sync";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const csvGyms = readGymsFromCsv();

    let added = 0;
    let updated = 0;

    for (const gym of csvGyms) {
      const { data: existing } = await supabase
        .from("gyms")
        .select("id, hashtags")
        .eq("name", gym.name)
        .single();

      if (existing) {
        // Merge hashtags (keep existing + add new)
        const mergedTags = [...new Set([...existing.hashtags, ...gym.hashtags])];
        if (mergedTags.length !== existing.hashtags.length) {
          await supabase
            .from("gyms")
            .update({
              hashtags: mergedTags,
              region: gym.region,
              area: gym.area,
            })
            .eq("id", existing.id);
          updated++;
        }
      } else {
        await supabase.from("gyms").insert({
          name: gym.name,
          hashtags: gym.hashtags,
          region: gym.region,
          area: gym.area,
        });
        added++;
      }
    }

    return NextResponse.json({
      success: true,
      total: csvGyms.length,
      added,
      updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
