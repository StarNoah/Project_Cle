export interface Post {
  id: number;
  instagram_id: string;
  post_type: "post" | "reel" | "carousel";
  caption: string | null;
  like_count: number;
  comment_count: number;
  view_count: number | null;
  location_name: string | null;
  author_username: string;
  author_profile_pic: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  permalink: string;
  hashtags: string[];
  published_at: string;
  is_hidden: boolean;
  collected_at: string;
  updated_at: string;
}

export interface CollectionLog {
  id: number;
  status: "started" | "success" | "error";
  posts_collected: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface PostFilters {
  postType?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: string;
  page?: number;
}
