import { fetchPosts, fetchDistinctLocations } from "@/lib/queries";
import { PostGrid } from "@/components/PostGrid";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import type { PostFilters } from "@/lib/types";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: PostFilters = {
    postType: typeof params.postType === "string" ? params.postType : undefined,
    location: typeof params.location === "string" ? params.location : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
  };

  const [{ posts, total, page, totalPages }, locations] = await Promise.all([
    fetchPosts(filters),
    fetchDistinctLocations(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">인기 클라이밍 게시물</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          총 {total.toLocaleString()}개의 게시물
        </p>
      </div>

      <FilterBar
        locations={locations}
        currentFilters={filters}
      />

      <PostGrid posts={posts} page={page} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        filters={filters}
      />
    </div>
  );
}
