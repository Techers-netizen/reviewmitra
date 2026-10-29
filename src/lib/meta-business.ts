import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { ingestReviews, RawReviewPayload } from "@/lib/sync-engine";

/**
 * Service for Facebook Page Recommendations & Reviews:
 * Supports both Direct Public Facebook Page URL Scraping (no Meta App Review required)
 * and official Meta Graph API (when Page Access Token is configured).
 */

interface MetaTokenResult {
  pageAccessToken: string;
  pageId?: string;
  listingUrl?: string;
  error?: string;
}

export async function getValidMetaToken(businessId: string): Promise<MetaTokenResult> {
  const connection = await db.platformConnection.findUnique({
    where: {
      businessId_platformName: {
        businessId,
        platformName: "facebook",
      },
    },
  });

  if (!connection) {
    return { pageAccessToken: "", error: "Facebook Page is not connected." };
  }

  if (!connection.encryptedAccessToken || !connection.tokenIv || !connection.tokenAuthTag) {
    return {
      pageAccessToken: "",
      listingUrl: connection.listingUrl || connection.externalAccountId || undefined,
      error: "Connected via Public Page URL (No OAuth token required).",
    };
  }

  try {
    const pageAccessToken = decryptToken(
      connection.encryptedAccessToken,
      connection.tokenIv,
      connection.tokenAuthTag
    );

    let pageId = "";
    if (connection.externalAccountId) {
      const match = connection.externalAccountId.match(/ID:\s*([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        pageId = match[1];
      }
    }

    return {
      pageAccessToken,
      pageId: pageId || undefined,
      listingUrl: connection.listingUrl || undefined,
    };
  } catch {
    return {
      pageAccessToken: "",
      listingUrl: connection.listingUrl || undefined,
      error: "Failed to decrypt Facebook Page token.",
    };
  }
}

/**
 * Scrapes public recommendations/reviews from a Facebook Page URL (`/reviews`)
 * using embedded Schema.org JSON-LD and OpenGraph metadata without requiring Meta OAuth approval.
 */
export async function scrapePublicFacebookPageReviews(pageUrl: string): Promise<{
  pageName?: string;
  reviews: RawReviewPayload[];
}> {
  const reviews: RawReviewPayload[] = [];
  let pageName: string | undefined;

  if (!pageUrl || !pageUrl.startsWith("http")) {
    return { reviews };
  }

  try {
    const res = await fetch(pageUrl.trim(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });

    if (!res.ok) return { reviews };
    const html = await res.text();

    const ogTitle = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle && ogTitle[1]) {
      pageName = ogTitle[1].replace(/\| Facebook/i, "").replace(/- Reviews/i, "").trim();
    }

    const ldBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      try {
        const jsonStr = block.replace(/<\/?script[^>]*>/gi, "").trim();
        const data = JSON.parse(jsonStr);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item.name && !pageName) pageName = String(item.name).trim();
          if (Array.isArray(item.review)) {
            for (const r of item.review) {
              const author = r.author?.name || "Facebook Customer";
              const dateStr = r.datePublished || new Date().toISOString().slice(0, 10);
              const body = r.reviewBody || r.description || "";
              const extId = `fb_pub_${Buffer.from(`${author}_${dateStr}_${body.slice(0, 20)}`).toString("hex").slice(0, 22)}`;
              reviews.push({
                externalId: extId,
                reviewerName: author,
                rating: Number(r.reviewRating?.ratingValue) || 5,
                reviewText: body,
                reviewTimestamp: r.datePublished ? new Date(r.datePublished) : new Date(),
              });
            }
          }
        }
      } catch {
        // Ignore non-review JSON-LD block
      }
    }
  } catch (err) {
    console.warn("Public Facebook Page scrape notice:", err);
  }

  return { pageName, reviews };
}

/**
 * Syncs customer recommendations and reviews from Facebook Page (via Graph API or Public Page URL).
 */
export async function syncMetaReviewsFromApi(businessId: string) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  const { pageAccessToken, pageId, listingUrl, error } = await getValidMetaToken(businessId);

  // Fallback to Direct Public Page Scraper when connected via public URL without OAuth token
  if (!pageAccessToken) {
    const targetUrl = listingUrl || business?.facebookPageUrl;
    if (targetUrl && targetUrl.startsWith("http")) {
      const scraped = await scrapePublicFacebookPageReviews(targetUrl);
      let ingestedCount = 0;
      if (scraped.reviews.length > 0) {
        const res = await ingestReviews(businessId, "facebook", scraped.reviews);
        ingestedCount = res.inserted;
      }
      await db.platformConnection.updateMany({
        where: { businessId, platformName: "facebook" },
        data: { lastSyncAt: new Date(), status: "connected" },
      });
      return {
        success: true,
        totalFetched: scraped.reviews.length,
        newIngested: ingestedCount,
        note: "Synced via Direct Facebook Page URL.",
      };
    }
    return { success: false, error: error || "No Facebook Page URL or access token found." };
  }

  let targetPageId = pageId;
  if (!targetPageId) {
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${pageAccessToken}&fields=id,name`
      );
      if (meRes.ok) {
        const meData = await meRes.json();
        targetPageId = meData.id;
      }
    } catch (e) {
      console.warn("Failed to fetch /me from Facebook Graph API", e);
    }
  }

  if (!targetPageId) {
    return { success: false, error: "Could not identify Facebook Page ID." };
  }

  try {
    const ratingsRes = await fetch(
      `https://graph.facebook.com/v21.0/${targetPageId}/ratings?access_token=${pageAccessToken}&fields=created_time,has_rating,has_review,rating,review_text,reviewer{name,id},recommendation_type,open_graph_story{id}&limit=50`
    );

    if (!ratingsRes.ok) {
      const errText = await ratingsRes.text();
      return {
        success: false,
        error: `Facebook Graph API error (${ratingsRes.status}): ${errText}`,
      };
    }

    const ratingsData = await ratingsRes.json();
    const items = ratingsData.data || [];

    const rawReviews: RawReviewPayload[] = [];
    for (const item of items) {
      const externalId =
        item.open_graph_story?.id ||
        item.created_time ||
        `fb_rec_${item.reviewer?.id || Date.now()}`;

      let ratingNum = 5;
      if (typeof item.rating === "number") {
        ratingNum = item.rating;
      } else if (item.recommendation_type === "positive") {
        ratingNum = 5;
      } else if (item.recommendation_type === "negative") {
        ratingNum = 1;
      }

      rawReviews.push({
        externalId,
        reviewerName: item.reviewer?.name || "Facebook Customer",
        rating: ratingNum,
        reviewText: item.review_text || (ratingNum >= 4 ? "Recommended this business." : "Feedback submitted."),
        reviewTimestamp: new Date(item.created_time || Date.now()),
      });
    }

    let ingestedCount = 0;
    if (rawReviews.length > 0) {
      const result = await ingestReviews(businessId, "facebook", rawReviews);
      ingestedCount = result.inserted;
    }

    await db.platformConnection.updateMany({
      where: { businessId, platformName: "facebook" },
      data: { lastSyncAt: new Date(), status: "connected" },
    });

    return {
      success: true,
      totalFetched: rawReviews.length,
      newIngested: ingestedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to query Facebook ratings API.",
    };
  }
}

export async function postMetaReplyToApi(
  businessId: string,
  externalReviewId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; facebookResponse?: any }> {
  const { pageAccessToken, error } = await getValidMetaToken(businessId);
  if (!pageAccessToken) {
    return { success: false, error: error || "No Facebook token found." };
  }

  try {
    const commentEndpoint = `https://graph.facebook.com/v21.0/${externalReviewId}/comments`;
    const res = await fetch(commentEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message: replyText,
        access_token: pageAccessToken,
      }),
    });

    const resJson = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, facebookResponse: resJson };
    } else {
      return {
        success: false,
        error: `Facebook Graph API error (${res.status}): ${JSON.stringify(resJson)}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to post comment reply to Facebook.",
    };
  }
}
