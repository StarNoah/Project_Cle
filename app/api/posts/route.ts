import { NextRequest, NextResponse } from "next/server";
import { fetchPosts } from "@/lib/queries";
import type { PostFilters } from "@/lib/types";

const VALID_POST_TYPES = ["all", "post", "reel", "carousel"];
const VALID_SORT_OPTIONS = ["likes", "comments", "recent"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SEARCH_LENGTH = 200;
const MAX_PAGE = 10000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const postType = searchParams.get("postType") || undefined;
  const location = searchParams.get("location") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const pageRaw = searchParams.get("page");

  // Validate postType
  if (postType && !VALID_POST_TYPES.includes(postType)) {
    return NextResponse.json({ error: "Invalid postType" }, { status: 400 });
  }

  // Validate sort
  if (sort && !VALID_SORT_OPTIONS.includes(sort)) {
    return NextResponse.json({ error: "Invalid sort option" }, { status: 400 });
  }

  // Validate dates
  if (dateFrom && !DATE_REGEX.test(dateFrom)) {
    return NextResponse.json({ error: "Invalid dateFrom format (YYYY-MM-DD)" }, { status: 400 });
  }
  if (dateTo && !DATE_REGEX.test(dateTo)) {
    return NextResponse.json({ error: "Invalid dateTo format (YYYY-MM-DD)" }, { status: 400 });
  }

  // Validate search length
  if (search && search.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json({ error: `Search query too long (max ${MAX_SEARCH_LENGTH})` }, { status: 400 });
  }

  // Validate page
  let page = 1;
  if (pageRaw) {
    page = parseInt(pageRaw, 10);
    if (isNaN(page) || page < 1 || page > MAX_PAGE) {
      return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
    }
  }

  const filters: PostFilters = {
    postType,
    location,
    dateFrom,
    dateTo,
    search,
    sort,
    page,
  };

  const result = await fetchPosts(filters);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
