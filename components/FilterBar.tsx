"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { PostFilters, Gym } from "@/lib/types";

interface FilterBarProps {
  gyms: Gym[];
  regions: string[];
  currentFilters: PostFilters;
}

export function FilterBar({ gyms, regions, currentFilters }: FilterBarProps) {
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
    <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg bg-[var(--card)] border border-[var(--border)]">
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
        <select
          value={currentFilters.period || ""}
          onChange={(e) => updateFilter("period", e.target.value)}
          className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">전체 기간</option>
          <option value="daily">일간</option>
          <option value="weekly">주간</option>
          <option value="monthly">월간</option>
        </select>

        <select
          value={currentFilters.region || ""}
          onChange={(e) => updateFilter("region", e.target.value)}
          className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">전체 지역</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={currentFilters.gymId?.toString() || ""}
          onChange={(e) => updateFilter("gymId", e.target.value)}
          className="col-span-2 sm:col-span-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm sm:max-w-[200px]"
        >
          <option value="">전체 클라이밍장</option>
          {gyms.map((gym) => (
            <option key={gym.id} value={gym.id.toString()}>
              {gym.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="검색어 입력..."
          defaultValue={currentFilters.search || ""}
          className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm min-w-0"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors whitespace-nowrap"
        >
          검색
        </button>
      </form>
    </div>
  );
}
