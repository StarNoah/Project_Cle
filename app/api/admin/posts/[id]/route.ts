import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { STYLE_LABELS } from "@/lib/style-matching";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { styles } = body;

  if (!Array.isArray(styles) || !styles.every((s: unknown) => typeof s === "string" && (STYLE_LABELS as readonly string[]).includes(s))) {
    return NextResponse.json(
      { error: `Invalid styles. Must be array of: ${STYLE_LABELS.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .update({ styles })
    .eq("id", id)
    .select("id, styles");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}
