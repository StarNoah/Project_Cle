"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STYLES = ["전체", "다이나믹", "스태틱", "코디", "다이노", "핀치", "크림프", "슬로퍼"] as const;

export function StyleTabs({ currentStyle }: { currentStyle?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = useCallback(
    (style: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (style === "전체") {
        params.delete("style");
      } else {
        params.set("style", style);
      }
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const active = currentStyle || "전체";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {STYLES.map((style) => (
        <button
          key={style}
          onClick={() => handleClick(style)}
          className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            active === style
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
          }`}
        >
          {style}
        </button>
      ))}
    </div>
  );
}
