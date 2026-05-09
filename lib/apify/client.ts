/**
 * Thin wrapper over the Apify run-sync API.
 *
 * We use `apify/instagram-scraper` (the public scraper actor). It accepts a
 * `directUrls` array of profile URLs and returns posts; passing
 * `resultsLimit` controls how many posts we get back per profile.
 */

const APIFY_API = "https://api.apify.com/v2";
const ACTOR_ID = "apify~instagram-scraper";

export interface ApifyPost {
  type?: string;
  videoViewCount?: number;
  videoPlayCount?: number;
  productType?: string;
  ownerUsername?: string;
}

export interface ApifyProfile {
  username?: string;
  followersCount?: number;
}

export interface IgSyncResult {
  followers: number | null;
  avg_reel_views: number | null;
  reels_sampled: number;
  cost_credits: number | null;
  apify_run_id: string | null;
}

export class ApifyError extends Error {
  constructor(message: string, public detail?: unknown) {
    super(message);
    this.name = "ApifyError";
  }
}

/**
 * Runs the actor synchronously, returning the result of the dataset items.
 * Intended to be called from a Server Action.
 */
export async function runIgSync(igHandle: string): Promise<IgSyncResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new ApifyError("APIFY_TOKEN env var is not set");
  }
  const handle = igHandle.replace(/^@/, "").trim();
  if (!handle) throw new ApifyError("ig_handle is empty");

  const url = `${APIFY_API}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const body = {
    directUrls: [`https://www.instagram.com/${handle}/`],
    resultsType: "posts",
    resultsLimit: 12,
    addParentData: true,
    searchType: "user",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApifyError(`Apify run failed: ${res.status}`, text);
  }

  const apifyRunId = res.headers.get("X-Apify-Pagination-Total") ?? null;
  const json = (await res.json()) as Array<Record<string, unknown> & ApifyPost>;
  if (!Array.isArray(json) || json.length === 0) {
    return {
      followers: null,
      avg_reel_views: null,
      reels_sampled: 0,
      cost_credits: null,
      apify_run_id: apifyRunId,
    };
  }

  const first = json[0] as Record<string, unknown>;
  const followers =
    typeof first.ownerFollowersCount === "number"
      ? (first.ownerFollowersCount as number)
      : typeof (first as { followersCount?: number }).followersCount === "number"
        ? ((first as { followersCount?: number }).followersCount as number)
        : null;

  const reels = json.filter((p) => {
    const isVideo = p.type === "Video" || p.productType === "clips";
    return isVideo && (p.videoViewCount != null || p.videoPlayCount != null);
  });
  const reelsToSample = reels.slice(0, 10);
  const avg_reel_views =
    reelsToSample.length > 0
      ? Math.round(
          reelsToSample.reduce(
            (s, p) => s + ((p.videoViewCount ?? p.videoPlayCount ?? 0) as number),
            0,
          ) / reelsToSample.length,
        )
      : null;

  return {
    followers,
    avg_reel_views,
    reels_sampled: reelsToSample.length,
    cost_credits: null,
    apify_run_id: apifyRunId,
  };
}
