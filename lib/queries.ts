import { createServiceClient } from "@/lib/supabase/server";
import type { Post, PostFilters, Gym } from "@/lib/types";

const PAGE_SIZE = 12;

class FetchError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "FetchError";
  }
}

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

  // If gymId or region filter, get matching post IDs via post_gyms
  let gymPostIds: string[] | null = null;
  if (filters.gymId || filters.region) {
    let gymIdQuery = supabase.from("post_gyms").select("post_id");
    if (filters.gymId) {
      gymIdQuery = gymIdQuery.eq("gym_id", filters.gymId);
    } else if (filters.region) {
      const { data: regionGyms } = await supabase
        .from("gyms")
        .select("id")
        .eq("region", filters.region);
      const regionGymIds = (regionGyms || []).map((g) => g.id);
      if (regionGymIds.length === 0) {
        return { posts: [], total: 0, page, totalPages: 0 };
      }
      gymIdQuery = gymIdQuery.in("gym_id", regionGymIds);
    }

    const { data: gymPosts, error: gymError } = await gymIdQuery;
    if (gymError) {
      throw new FetchError(`fetchPosts gym filter failed: ${gymError.message}`, gymError.code);
    }

    gymPostIds = [...new Set((gymPosts || []).map((gp) => gp.post_id as string))];
    if (gymPostIds.length === 0) {
      return { posts: [], total: 0, page, totalPages: 0 };
    }
  }

  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("is_hidden", false);

  if (gymPostIds) {
    query = query.in("id", gymPostIds);
  }

  if (filters.postType && filters.postType !== "all") {
    query = query.eq("post_type", filters.postType);
  }

  if (filters.period) {
    const now = new Date();
    let since: Date;
    switch (filters.period) {
      case "daily":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(0);
    }
    query = query.gte("published_at", since.toISOString());
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

  if (filters.style) {
    query = query.contains("styles", [filters.style]);
  }

  const sort = filters.sort || "likes";
  if (sort === "recent") {
    query = query.order("published_at", { ascending: false });
  } else {
    query = query.order("like_count", { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new FetchError(`fetchPosts failed: ${error.message}`, error.code);
  }

  const total = count || 0;

  return {
    posts: (data as Post[]) || [],
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function fetchTopPosts(filters: PostFilters, limit = 3): Promise<Post[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_hidden", false)
    .order("like_count", { ascending: false })
    .limit(limit);

  if (filters.gymId || filters.region) {
    let gymIdQuery = supabase.from("post_gyms").select("post_id");
    if (filters.gymId) {
      gymIdQuery = gymIdQuery.eq("gym_id", filters.gymId);
    } else if (filters.region) {
      const { data: regionGyms } = await supabase
        .from("gyms")
        .select("id")
        .eq("region", filters.region);
      const regionGymIds = (regionGyms || []).map((g) => g.id);
      if (regionGymIds.length === 0) return [];
      gymIdQuery = gymIdQuery.in("gym_id", regionGymIds);
    }
    const { data: gymPosts } = await gymIdQuery;
    const ids = [...new Set((gymPosts || []).map((gp) => gp.post_id as string))];
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  if (filters.period) {
    const now = new Date();
    let since: Date;
    switch (filters.period) {
      case "daily":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(0);
    }
    query = query.gte("published_at", since.toISOString());
  }

  if (filters.postType && filters.postType !== "all") {
    query = query.eq("post_type", filters.postType);
  }

  if (filters.style) {
    query = query.contains("styles", [filters.style]);
  }

  const { data, error } = await query;

  if (error) {
    throw new FetchError(`fetchTopPosts failed: ${error.message}`, error.code);
  }

  return (data as Post[]) || [];
}

export async function fetchGyms(): Promise<Gym[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("gyms")
    .select("id, name, hashtags, region, area")
    .order("name");

  if (error) {
    throw new FetchError(`fetchGyms failed: ${error.message}`, error.code);
  }

  return (data as Gym[]) || [];
}
