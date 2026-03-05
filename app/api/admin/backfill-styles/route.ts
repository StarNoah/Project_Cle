import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { matchPostStyles } from "@/lib/style-matching";

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, hashtags, caption")
    .eq("styles", "{}");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const post of posts || []) {
    const styles = matchPostStyles({ hashtags: post.hashtags || [], caption: post.caption });
    if (styles.length > 0) {
      await supabase.from("posts").update({ styles }).eq("id", post.id);
      updated++;
    }
  }

  return NextResponse.json({ total: posts?.length || 0, updated });
}
