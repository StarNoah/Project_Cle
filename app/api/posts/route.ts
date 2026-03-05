import { NextRequest, NextResponse } from "next/server";
import { fetchPosts } from "@/lib/queries";
import type { PostFilters } from "@/lib/types";

const VALID_POST_TYPES = ["all", "post", "reel", "carousel"];
const VALID_SORT_OPTIONS = ["likes", "recent"];
const VALID_PERIODS = ["daily", "weekly", "monthly"];
const VALID_STYLES = ["다이나믹", "스태틱", "코디", "다이노", "핀치", "크림프", "슬로퍼"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SEARCH_LENGTH = 200;
const MAX_PAGE = 10000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const postType = searchParams.get("postType") || undefined;
  const region = searchParams.get("region") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const period = searchParams.get("period") || undefined;
  const style = searchParams.get("style") || undefined;
  const gymIdRaw = searchParams.get("gymId");
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

  // Validate period
  if (period && !VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  // Validate style
  if (style && !VALID_STYLES.includes(style)) {
    return NextResponse.json({ error: "Invalid style" }, { status: 400 });
  }

  // Validate gymId
  let gymId: number | undefined;
  if (gymIdRaw) {
    const parsed = parseInt(gymIdRaw, 10);
    if (isNaN(parsed) || parsed < 1) {
      return NextResponse.json({ error: "Invalid gymId" }, { status: 400 });
    }
    gymId = parsed;
  }

  // Validate page — fallback to 1 for invalid values
  let page = 1;
  if (pageRaw) {
    const parsed = parseInt(pageRaw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= MAX_PAGE) {
      page = parsed;
    }
  }

  const filters: PostFilters = {
    postType,
    region,
    dateFrom,
    dateTo,
    search,
    sort,
    period,
    style,
    page,
    gymId,
  };

  const result = await fetchPosts(filters);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
