import { getEnv } from "@/lib/env";

const APIFY_ACTOR_ID = "apify~instagram-hashtag-scraper";

interface ApifyRunOptions {
  hashtags: string[];
  resultsLimit: number;
  webhookUrl?: string;
}

export async function startApifyRun({ hashtags, resultsLimit, webhookUrl }: ApifyRunOptions) {
  const token = getEnv("APIFY_API_TOKEN");

  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    throw new Error("hashtags must be a non-empty array");
  }
  if (typeof resultsLimit !== "number" || resultsLimit < 1 || resultsLimit > 1000) {
    throw new Error("resultsLimit must be a number between 1 and 1000");
  }

  const input = {
    hashtags,
    resultsLimit,
    resultsType: "reels",
    searchType: "hashtag",
  };

  const body: Record<string, unknown> = { ...input };
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const params = new URLSearchParams({ token });
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
  const token = getEnv("APIFY_API_TOKEN");

  if (!/^[\w-]+$/.test(datasetId)) {
    throw new Error("Invalid dataset ID format");
  }

  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status}`);
  }

  return res.json();
}

export async function getApifyRunDetails(runId: string) {
  const token = getEnv("APIFY_API_TOKEN");

  if (!/^[\w-]+$/.test(runId)) {
    throw new Error("Invalid run ID format");
  }

  const res = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
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
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid post data: expected an object");
  }

  const instagramId = raw.id || raw.shortCode;
  if (!instagramId || typeof instagramId !== "string") {
    throw new Error("Post missing required instagram_id (id or shortCode)");
  }

  const postType =
    raw.type === "Video" ? "reel" :
    raw.type === "Sidecar" ? "carousel" : "post";

  return {
    instagram_id: instagramId,
    post_type: postType,
    caption: typeof raw.caption === "string" ? raw.caption : null,
    like_count: typeof raw.likesCount === "number" ? raw.likesCount : 0,
    comment_count: typeof raw.commentsCount === "number" ? raw.commentsCount : 0,
    view_count: typeof raw.videoViewCount === "number" ? raw.videoViewCount : null,
    location_name: typeof raw.locationName === "string" ? raw.locationName : null,
    author_username: typeof raw.ownerUsername === "string" ? raw.ownerUsername : "unknown",
    author_profile_pic: typeof raw.ownerProfilePicUrl === "string" ? raw.ownerProfilePicUrl : null,
    thumbnail_url: typeof raw.displayUrl === "string" ? raw.displayUrl : null,
    media_url: typeof raw.url === "string" ? raw.url : null,
    permalink: raw.shortCode
      ? `https://www.instagram.com/p/${raw.shortCode}/`
      : (typeof raw.url === "string" ? raw.url : ""),
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    published_at: typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
    is_hidden: false,
    collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
