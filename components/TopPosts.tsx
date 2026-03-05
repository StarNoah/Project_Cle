import Image from "next/image";
import type { Post } from "@/lib/types";

interface TopPostsProps {
  posts: Post[];
}

const MEDAL = ["1st", "2nd", "3rd"];

export function TopPosts({ posts }: TopPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-1 scrollbar-none">
      {posts.slice(0, 3).map((post, i) => (
        <a
          key={post.instagram_id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-shadow hover:shadow-lg flex-shrink-0 w-[80vw] sm:w-auto"
        >
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--muted)]">
            {post.thumbnail_url ? (
              <Image
                src={post.thumbnail_url}
                alt={post.caption?.slice(0, 30) || ""}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[var(--muted-foreground)]">
                No Image
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--accent)]">
                {MEDAL[i]}
              </span>
              <span className="text-sm font-semibold truncate">
                @{post.author_username}
              </span>
            </div>

            {post.caption && (
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                {post.caption}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span>❤️ {post.like_count.toLocaleString()}</span>
              <span>💬 {post.comment_count.toLocaleString()}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
