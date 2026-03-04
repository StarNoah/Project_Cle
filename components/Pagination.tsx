import Link from "next/link";
import type { PostFilters } from "@/lib/types";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  filters: PostFilters;
}

function buildHref(filters: PostFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.postType) params.set("postType", filters.postType);
  if (filters.location) params.set("location", filters.location);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function Pagination({ currentPage, totalPages, filters }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(filters, currentPage - 1)}
          className="px-3 py-2 rounded-md text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          이전
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-[var(--muted-foreground)]">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(filters, p)}
            className={`px-3 py-2 rounded-md text-sm border transition-colors ${
              p === currentPage
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(filters, currentPage + 1)}
          className="px-3 py-2 rounded-md text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          다음
        </Link>
      )}
    </nav>
  );
}
