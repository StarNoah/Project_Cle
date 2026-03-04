"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { PostFilters } from "@/lib/types";

interface FilterBarProps {
  locations: string[];
  currentFilters: PostFilters;
}

export function FilterBar({ locations, currentFilters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const search = formData.get("search") as string;
      updateFilter("search", search);
    },
    [updateFilter]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)]">
      <select
        value={currentFilters.sort || "likes"}
        onChange={(e) => updateFilter("sort", e.target.value)}
        className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm"
      >
        <option value="likes">좋아요순</option>
        <option value="comments">댓글순</option>
        <option value="recent">최신순</option>
      </select>

      <select
        value={currentFilters.postType || "all"}
        onChange={(e) => updateFilter("postType", e.target.value === "all" ? "" : e.target.value)}
        className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm"
      >
        <option value="all">전체 타입</option>
        <option value="post">사진</option>
        <option value="reel">릴스</option>
        <option value="carousel">캐러셀</option>
      </select>

      <select
        value={currentFilters.location || ""}
        onChange={(e) => updateFilter("location", e.target.value)}
        className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm max-w-[200px]"
      >
        <option value="">전체 위치</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      <form onSubmit={handleSearch} className="flex gap-2 flex-1">
        <input
          type="text"
          name="search"
          placeholder="검색어 입력..."
          defaultValue={currentFilters.search || ""}
          className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm min-w-0"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors"
        >
          검색
        </button>
      </form>
    </div>
  );
}
