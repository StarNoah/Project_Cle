import { NextRequest, NextResponse } from "next/server";
import { fetchPosts } from "@/lib/queries";
import type { PostFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: PostFilters = {
    postType: searchParams.get("postType") || undefined,
    location: searchParams.get("location") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : 1,
  };

  const result = await fetchPosts(filters);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
