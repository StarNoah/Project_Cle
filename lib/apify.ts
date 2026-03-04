const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN!;
const APIFY_ACTOR_ID = "apify~instagram-hashtag-scraper";

interface ApifyRunOptions {
  hashtags: string[];
  resultsLimit: number;
  webhookUrl?: string;
}

export async function startApifyRun({ hashtags, resultsLimit, webhookUrl }: ApifyRunOptions) {
  const input = {
    hashtags,
    resultsLimit,
    resultsType: "posts",
    searchType: "hashtag",
  };

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`;

  const body: Record<string, unknown> = { ...input };

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const params = new URLSearchParams({ token: APIFY_API_TOKEN });
  if (webhookUrl) {
    params.set("webhooks", JSON.stringify([
      {
        eventTypes: ["ACTOR.RUN.SUCCEEDED"],
        requestUrl: webhookUrl,
        payloadTemplate: '{"runId": {{resource.id}}, "status": {{resource.status}}}',
      },
    ]));
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?${params}`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    throw new Error(`Apify run failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function getApifyDatasetItems(datasetId: string) {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&format=json`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status}`);
  }

  return res.json();
}

export async function getApifyRunDetails(runId: string) {
  const res = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch run details: ${res.status}`);
  }

  return res.json();
}

interface ApifyPost {
  id?: string;
  shortCode?: string;
  type?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  locationName?: string;
  ownerUsername?: string;
  ownerProfilePicUrl?: string;
  displayUrl?: string;
  url?: string;
  hashtags?: string[];
  timestamp?: string;
  [key: string]: unknown;
}

export function transformApifyPost(raw: ApifyPost) {
  const postType =
    raw.type === "Video" ? "reel" :
    raw.type === "Sidecar" ? "carousel" : "post";

  return {
    instagram_id: raw.id || raw.shortCode || "",
    post_type: postType,
    caption: raw.caption || null,
    like_count: raw.likesCount || 0,
    comment_count: raw.commentsCount || 0,
    view_count: raw.videoViewCount || null,
    location_name: raw.locationName || null,
    author_username: raw.ownerUsername || "unknown",
    author_profile_pic: raw.ownerProfilePicUrl || null,
    thumbnail_url: raw.displayUrl || null,
    media_url: raw.url || null,
    permalink: raw.shortCode
      ? `https://www.instagram.com/p/${raw.shortCode}/`
      : raw.url || "",
    hashtags: raw.hashtags || [],
    published_at: raw.timestamp || new Date().toISOString(),
    is_hidden: false,
    collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
