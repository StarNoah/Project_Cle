import { NextResponse } from "next/server";
import { fetchGyms } from "@/lib/queries";

export async function GET() {
  const gyms = await fetchGyms();

  return NextResponse.json(gyms, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
