"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { RankBadge } from "./RankBadge";
import { PostModal } from "./PostModal";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  rank: number;
}

export function PostCard({ post, rank }: PostCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group w-full text-left rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-shadow hover:shadow-lg"
      >
        <div className="relative aspect-[3/4] bg-[var(--muted)]">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.caption?.slice(0, 50) || "클라이밍 게시물"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
              No Image
            </div>
          )}

          <div className="absolute top-2 left-2">
            <RankBadge rank={rank} />
          </div>

          {/* 재생 버튼 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <span className="text-xl ml-1">▶</span>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-1.5">
            {post.author_profile_pic && (
              <Image
                src={post.author_profile_pic}
                alt={post.author_username}
                width={20}
                height={20}
                className="rounded-full flex-shrink-0"
              />
            )}
            <span className="text-xs sm:text-sm font-semibold truncate">
              @{post.author_username}
            </span>
          </div>

          {post.caption && (
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 hidden sm:block">
              {post.caption}
            </p>
          )}

          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--muted-foreground)]">
            <span title="좋아요">❤️ {post.like_count.toLocaleString()}</span>
            <span title="댓글">💬 {post.comment_count.toLocaleString()}</span>
            {post.view_count != null && (
              <span title="조회수" className="hidden sm:inline">👁️ {post.view_count.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            {post.location_name && (
              <span className="truncate max-w-[60%] hidden sm:inline" title={post.location_name}>
                📍 {post.location_name}
              </span>
            )}
            <span>
              {format(new Date(post.published_at), "MM.dd", { locale: ko })}
            </span>
          </div>
        </div>
      </button>

      {showModal && <PostModal post={post} onClose={() => setShowModal(false)} />}
    </>
  );
}
