const STYLE_KEYWORDS: Record<string, string[]> = {
  다이나믹: ["다이나믹", "dynamic", "다이나믹무브", "다이나믹 무브"],
  스태틱: ["스태틱", "static", "정적", "정적무브", "스테틱"],
  코디: ["코디", "코디네이션", "coordination", "코디무브"],
  다이노: ["다이노", "dyno", "다이노무브"],
  핀치: ["핀치", "pinch"],
  크림프: ["크림프", "crimp"],
  슬로퍼: ["슬로퍼", "sloper"],
};

export const STYLE_LABELS = ["다이나믹", "스태틱", "코디", "다이노", "핀치", "크림프", "슬로퍼"] as const;
export type Style = (typeof STYLE_LABELS)[number];

export function matchPostStyles(post: { hashtags: string[]; caption: string | null }): string[] {
  const text = [
    ...(post.hashtags || []).map((h) => h.toLowerCase().replace(/^#/, "")),
    (post.caption || "").toLowerCase(),
  ].join(" ");

  const matched: string[] = [];

  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      matched.push(style);
    }
  }

  return matched;
}
