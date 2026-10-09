import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { ingestReviews, RawReviewPayload } from "@/lib/sync-engine";

/**
 * Service to interact with Meta Graph API (v21.0):
 * - Page Recommendations/Ratings Fetching
 * - Page Comment Replies on Reviews
 */

interface MetaTokenResult {
  pageAccessToken: string;
  pageId?: string;
  error?: string;
}

/**
 * Retrieves the decrypted Facebook Page Access Token for a business.
 */
export async function getValidMetaToken(businessId: string): Promise<MetaTokenResult> {
  const connection = await db.platformConnection.findUnique({
    where: {
      businessId_platformName: {
        businessId,
        platformName: "facebook",
      },
    },
  });

  if (!connection || !connection.encryptedAccessToken || !connection.tokenIv || !connection.tokenAuthTag) {
    return { pageAccessToken: "", error: "Facebook Page not connected" };
  }

  try {
    const pageAccessToken = decryptToken(
      connection.encryptedAccessToken,
      connection.tokenIv,
      connection.tokenAuthTag
    );

    // Extract pageId from externalAccountId if stored like "Page Name (ID: 123456)"
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
    };
  } catch (err) {
    return { pageAccessToken: "", error: "Failed to decrypt Facebook Page token" };
  }
}

/**
 * Fetches real recommendations and customer reviews from Facebook Page.
 */
export async function syncMetaReviewsFromApi(businessId: string) {
  const { pageAccessToken, pageId, error } = await getValidMetaToken(businessId);
  if (!pageAccessToken) {
    return { success: false, error: error || "No Facebook access token found" };
  }

  // If pageId isn't stored, resolve it via /me
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
    return { success: false, error: "Could not identify Facebook Page ID" };
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
        reviewerName: item.reviewer?.name || "Facebook User",
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
      error: err?.message || "Failed to query Facebook ratings API",
    };
  }
}

/**
 * Publishes a reply comment to a Facebook recommendation/review story.
 */
export async function postMetaReplyToApi(
  businessId: string,
  externalReviewId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; facebookResponse?: any }> {
  const { pageAccessToken, error } = await getValidMetaToken(businessId);
  if (!pageAccessToken) {
    return { success: false, error: error || "No Facebook token found" };
  }

  try {
    // If the review is linked to an open graph story or comment ID
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
      error: err?.message || "Failed to post comment reply to Facebook",
    };
  }
}
