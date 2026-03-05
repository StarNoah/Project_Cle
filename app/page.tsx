import { fetchPosts, fetchTopPosts, fetchGyms } from "@/lib/queries";
import { PostGrid } from "@/components/PostGrid";
import { FilterBar } from "@/components/FilterBar";
import { TopPosts } from "@/components/TopPosts";
import { Pagination } from "@/components/Pagination";
import { StyleTabs } from "@/components/StyleTabs";
import type { PostFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: PostFilters = {
    postType: typeof params.postType === "string" ? params.postType : undefined,
    region: typeof params.region === "string" ? params.region : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    period: typeof params.period === "string" ? params.period : undefined,
    style: typeof params.style === "string" ? params.style : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    gymId: typeof params.gymId === "string" ? parseInt(params.gymId, 10) || undefined : undefined,
  };

  const [{ posts, total, page, totalPages }, topPosts, gyms] = await Promise.all([
    fetchPosts(filters),
    fetchTopPosts(filters),
    fetchGyms(),
  ]);

  const regions = [...new Set(gyms.map((g) => g.region).filter(Boolean) as string[])].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">인기 클라이밍 릴스</h1>
        <p className="text-[var(--muted-foreground)] mt-1 text-sm">
          총 {total.toLocaleString()}개의 게시물
        </p>
      </div>

      <TopPosts posts={topPosts} />

      <FilterBar
        gyms={gyms}
        regions={regions}
        currentFilters={filters}
      />

      <StyleTabs currentStyle={filters.style} />

      <PostGrid posts={posts} page={page} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        filters={filters}
      />
    </div>
  );
}
