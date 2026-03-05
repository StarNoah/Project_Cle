import type { Gym } from "@/lib/types";

interface MatchablePost {
  hashtags: string[];
  caption: string | null;
}

export function matchPostToGyms(post: MatchablePost, gyms: Gym[]): number[] {
  const postHashtags = post.hashtags.map((h) => h.toLowerCase().replace(/^#/, ""));
  const captionLower = (post.caption || "").toLowerCase();

  const matched: number[] = [];

  for (const gym of gyms) {
    for (const tag of gym.hashtags) {
      const tagLower = tag.toLowerCase();
      if (postHashtags.includes(tagLower) || captionLower.includes(tagLower)) {
        matched.push(gym.id);
        break;
      }
    }
  }

  return matched;
}

const APIFY_HASHTAG_RE = /^[^!?.,:;\-+=*&%$#@/\\~^|<>()\[\]{}"'`\s]+$/;

export function getAllGymHashtags(gyms: Gym[]): string[] {
  const set = new Set<string>();
  for (const gym of gyms) {
    for (const tag of gym.hashtags) {
      const lower = tag.toLowerCase();
      if (APIFY_HASHTAG_RE.test(lower)) {
        set.add(lower);
      }
    }
  }
  return [...set];
}
