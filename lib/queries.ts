import { createServiceClient } from "@/lib/supabase/server";
import type { Post, PostFilters } from "@/lib/types";

const PAGE_SIZE = 12;

export async function fetchPosts(filters: PostFilters): Promise<{
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const supabase = createServiceClient();
  const page = filters.page || 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("is_hidden", false);

  if (filters.postType && filters.postType !== "all") {
    query = query.eq("post_type", filters.postType);
  }

  if (filters.location) {
    query = query.eq("location_name", filters.location);
  }

  if (filters.dateFrom) {
    query = query.gte("published_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("published_at", filters.dateTo);
  }

  if (filters.search) {
    query = query.textSearch("caption_search", filters.search, {
      type: "websearch",
    });
  }

  const sort = filters.sort || "likes";
  switch (sort) {
    case "likes":
      query = query.order("like_count", { ascending: false });
      break;
    case "comments":
      query = query.order("comment_count", { ascending: false });
      break;
    case "recent":
      query = query.order("published_at", { ascending: false });
      break;
    default:
      query = query.order("like_count", { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("fetchPosts error:", error);
    return { posts: [], total: 0, page, totalPages: 0 };
  }

  const total = count || 0;

  return {
    posts: (data as Post[]) || [],
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function fetchDistinctLocations(): Promise<string[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .select("location_name")
    .not("location_name", "is", null)
    .eq("is_hidden", false);

  if (error) {
    console.error("fetchDistinctLocations error:", error);
    return [];
  }

  const unique = [...new Set(data.map((d) => d.location_name as string))];
  return unique.sort();
}
