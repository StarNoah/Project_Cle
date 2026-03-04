import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

interface PostGridProps {
  posts: Post[];
  page: number;
}

const PAGE_SIZE = 12;

export function PostGrid({ posts, page }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted-foreground)]">
        <p className="text-lg font-medium">게시물이 없습니다</p>
        <p className="text-sm mt-1">필터를 변경해보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post, i) => (
        <PostCard
          key={post.instagram_id}
          post={post}
          rank={(page - 1) * PAGE_SIZE + i + 1}
        />
      ))}
    </div>
  );
}
