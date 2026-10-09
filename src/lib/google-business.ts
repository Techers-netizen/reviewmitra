import { db } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { ingestReviews, RawReviewPayload } from "@/lib/sync-engine";

/**
 * Service to interact with the real Google Business Profile APIs:
 * - Google My Business Account Management API (v1)
 * - Google My Business Business Information API (v1)
 * - Google My Business Reviews API (v4)
 */

interface GoogleTokenResult {
  accessToken: string;
  externalAccountId?: string;
  error?: string;
}

/**
 * Retrieves and auto-refreshes the Google OAuth access token for a business.
 */
export async function getValidGoogleToken(businessId: string): Promise<GoogleTokenResult> {
  const connection = await db.platformConnection.findUnique({
    where: {
      businessId_platformName: {
        businessId,
        platformName: "google",
      },
    },
  });

  if (!connection || !connection.encryptedAccessToken || !connection.tokenIv || !connection.tokenAuthTag) {
    return { accessToken: "", error: "Google account not connected" };
  }

  let accessToken = "";
  try {
    accessToken = decryptToken(
      connection.encryptedAccessToken,
      connection.tokenIv,
      connection.tokenAuthTag
    );
  } catch (err) {
    return { accessToken: "", error: "Failed to decrypt token" };
  }

  // Check if token is valid or needs refresh using refresh_token
  if (connection.encryptedRefreshToken) {
    try {
      // Test current token validity with a lightweight userinfo call
      const testRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (testRes.status === 401) {
        // Token expired, refresh it
        const refreshToken = decryptToken(
          connection.encryptedRefreshToken,
          connection.tokenIv,
          connection.tokenAuthTag
        );

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (clientId && clientSecret && refreshToken) {
          const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: "refresh_token",
            }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            accessToken = refreshData.access_token;

            // Encrypt and save the new access token
            const encryptedNew = encryptToken(accessToken);
            await db.platformConnection.update({
              where: { id: connection.id },
              data: {
                encryptedAccessToken: encryptedNew.encryptedText,
                tokenIv: encryptedNew.iv,
                tokenAuthTag: encryptedNew.authTag,
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn("Token validation check skipped or failed, using existing token", e);
    }
  }

  return {
    accessToken,
    externalAccountId: connection.externalAccountId || undefined,
  };
}

/**
 * Fetches real accounts and locations from Google Business Profile API.
 */
export async function fetchGoogleAccountsAndLocations(accessToken: string) {
  try {
    // 1. Fetch Google Business Accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!accountsRes.ok) {
      const errBody = await accountsRes.text();
      return {
        success: false,
        error: `Google Accounts API responded with ${accountsRes.status}: ${errBody}`,
        accounts: [],
        locations: [],
      };
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    const locationsList: any[] = [];

    // 2. Fetch locations for each account
    for (const acc of accounts) {
      const accountName = acc.name; // format: "accounts/{accountId}"
      const locationsRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (locationsRes.ok) {
        const locData = await locationsRes.json();
        if (locData.locations) {
          locationsList.push(
            ...locData.locations.map((l: any) => ({
              ...l,
              accountName,
            }))
          );
        }
      }
    }

    return {
      success: true,
      accounts,
      locations: locationsList,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to fetch Google accounts and locations",
      accounts: [],
      locations: [],
    };
  }
}

/**
 * Maps Google's starRating string enum to a 1-5 integer.
 */
function parseGoogleRating(starRating: string): number {
  switch (starRating) {
    case "FIVE":
      return 5;
    case "FOUR":
      return 4;
    case "THREE":
      return 3;
    case "TWO":
      return 2;
    case "ONE":
      return 1;
    default:
      return 5;
  }
}

/**
 * Fetches real customer reviews from Google Business Profile API and ingests them into Neon DB.
 */
export async function syncGoogleReviewsFromApi(businessId: string) {
  const { accessToken, error } = await getValidGoogleToken(businessId);
  if (!accessToken) {
    return { success: false, error: error || "No valid Google token available" };
  }

  // 1. Discover Accounts and Locations
  const discovery = await fetchGoogleAccountsAndLocations(accessToken);
  if (!discovery.success || discovery.locations.length === 0) {
    // If no locations configured or API quota pending, log status
    return {
      success: true,
      reviewsCount: 0,
      note: discovery.error || "No active Google Business locations detected yet.",
      diagnostic: discovery,
    };
  }

  let totalIngested = 0;
  const rawReviews: RawReviewPayload[] = [];

  // 2. Query reviews for each location
  for (const loc of discovery.locations) {
    // loc.accountName: "accounts/{accountId}", loc.name: "locations/{locationId}"
    const accountName = loc.accountName;
    const locationName = loc.name;

    try {
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews?pageSize=50`;
      const reviewsRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const reviews = reviewsData.reviews || [];

        for (const r of reviews) {
          // r.name format: "accounts/{accId}/locations/{locId}/reviews/{reviewId}"
          const externalId = r.name || r.reviewId;
          const ratingNum = parseGoogleRating(r.starRating);

          rawReviews.push({
            externalId,
            reviewerName: r.reviewer?.displayName || "Google Reviewer",
            reviewerAvatarUrl: r.reviewer?.profilePhotoUrl,
            rating: ratingNum,
            reviewText: r.comment || "",
            reviewTimestamp: new Date(r.createTime || Date.now()),
          });
        }
      } else {
        console.warn(`Google Reviews API call returned ${reviewsRes.status} for ${locationName}`);
      }
    } catch (e) {
      console.error(`Error querying reviews for ${locationName}:`, e);
    }
  }

  if (rawReviews.length > 0) {
    const ingestResult = await ingestReviews(businessId, "google", rawReviews);
    totalIngested = ingestResult.inserted;
  }

  // Update lastSyncAt
  await db.platformConnection.updateMany({
    where: { businessId, platformName: "google" },
    data: { lastSyncAt: new Date(), status: "connected" },
  });

  return {
    success: true,
    totalFetched: rawReviews.length,
    newIngested: totalIngested,
  };
}

/**
 * Publishes a reply directly back to Google Maps & Search via the Google My Business API.
 */
export async function postGoogleReplyToApi(
  businessId: string,
  externalReviewId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; googleResponse?: any }> {
  const { accessToken, error } = await getValidGoogleToken(businessId);
  if (!accessToken) {
    return { success: false, error: error || "No valid Google access token found" };
  }

  try {
    // externalReviewId can be the full resource name: "accounts/{acc}/locations/{loc}/reviews/{revId}"
    // or just the reviewId. If it starts with "accounts/", call it directly.
    let endpoint = "";
    if (externalReviewId.startsWith("accounts/")) {
      endpoint = `https://mybusiness.googleapis.com/v4/${externalReviewId}/reply`;
    } else {
      // Find locations first to construct the path
      const discovery = await fetchGoogleAccountsAndLocations(accessToken);
      if (discovery.locations.length > 0) {
        const loc = discovery.locations[0];
        endpoint = `https://mybusiness.googleapis.com/v4/${loc.accountName}/${loc.name}/reviews/${externalReviewId}/reply`;
      } else {
        return {
          success: false,
          error: "No Google location found to attach reply endpoint",
        };
      }
    }

    const replyRes = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: replyText,
      }),
    });

    const resJson = await replyRes.json().catch(() => ({}));

    if (replyRes.ok) {
      return { success: true, googleResponse: resJson };
    } else {
      return {
        success: false,
        error: `Google API rejected reply (${replyRes.status}): ${JSON.stringify(resJson)}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to post reply to Google Business API",
    };
  }
}
