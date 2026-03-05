"use client";

import { useEffect } from "react";
import type { Post } from "@/lib/types";

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

function getShortcode(permalink: string): string | null {
  const match = permalink.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

export function PostModal({ post, onClose }: PostModalProps) {
  const shortcode = getShortcode(post.permalink);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:w-auto bg-[var(--card)] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-semibold">@{post.author_username}</span>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 미리보기 */}
        <div className="w-full sm:w-[400px]">
          {shortcode ? (
            <iframe
              src={`https://www.instagram.com/p/${shortcode}/embed/`}
              className="w-full"
              style={{ height: "560px", border: "none" }}
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-60 text-[var(--muted-foreground)] text-sm">
              미리보기를 불러올 수 없습니다
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-3 border-t border-[var(--border)]">
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold"
          >
            Instagram에서 보기
          </a>
        </div>
      </div>
    </div>
  );
}
