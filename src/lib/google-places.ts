import { db } from "@/lib/db";
import { ingestReviews, RawReviewPayload } from "@/lib/sync-engine";

export interface PlaceSyncResult {
  success: boolean;
  reviewsCount: number;
  placeId?: string;
  placeName?: string;
  writeReviewUrl?: string;
  rating?: number;
  error?: string;
}

/**
 * Extracts Place ID, direct review URL, or search query from a Google Maps URL or shop name.
 */
export async function extractPlaceQuery(input: string): Promise<{
  placeId?: string;
  query?: string;
  resolvedUrl?: string;
}> {
  let trimmed = input.trim();

  // Follow short links like maps.app.goo.gl or g.page
  if (trimmed.includes("goo.gl/") || trimmed.includes("maps.app.goo.gl") || trimmed.includes("g.page/")) {
    try {
      const resp = await fetch(trimmed, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
        },
        redirect: "follow",
      });
      if (resp.url && resp.url !== trimmed) {
        trimmed = resp.url;
      }
    } catch (e) {
      console.warn("Could not unshorten Google Maps URL, using original:", e);
    }
  }

  // Direct Place ID (e.g. ChIJ...)
  if (/^ChIJ[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return { placeId: trimmed, resolvedUrl: trimmed };
  }

  // URL with placeid=... or place_id=...
  const placeIdMatch = trimmed.match(/place_?id=([a-zA-Z0-9_-]+)/i);
  if (placeIdMatch && placeIdMatch[1]) {
    return { placeId: placeIdMatch[1], resolvedUrl: trimmed };
  }

  // Google Maps /place/ URL: https://www.google.com/maps/place/Business+Name/...
  const placeNameMatch = trimmed.match(/\/maps\/place\/([^/@?]+)/);
  if (placeNameMatch && placeNameMatch[1]) {
    const decodedName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
    return { query: decodedName, resolvedUrl: trimmed };
  }

  // Search query parameter q=...
  const qMatch = trimmed.match(/[?&]q=([^&]+)/);
  if (qMatch && qMatch[1]) {
    const decodedQ = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
    return { query: decodedQ, resolvedUrl: trimmed };
  }

  return { query: trimmed, resolvedUrl: trimmed.startsWith("http") ? trimmed : undefined };
}

/**
 * Parses public reviews directly from Google Maps HTML / embedded JSON-LD / APP_INITIALIZATION_STATE
 * when official GBP API quota is 0. Never fabricates dummy reviews.
 */
async function scrapePublicGoogleMapsReviews(urlOrQuery: string): Promise<{
  placeName?: string;
  placeId?: string;
  rating?: number;
  reviews: RawReviewPayload[];
}> {
  const reviews: RawReviewPayload[] = [];
  let placeName: string | undefined;
  let placeId: string | undefined;
  let rating: number | undefined;

  try {
    const targetUrl = urlOrQuery.startsWith("http")
      ? urlOrQuery
      : `https://www.google.com/maps/search/${encodeURIComponent(urlOrQuery)}?hl=en`;

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });

    if (!res.ok) return { reviews };
    const html = await res.text();

    // Extract Place ID (ChIJ...) if present in page payload
    const chijMatch = html.match(/(ChIJ[a-zA-Z0-9_-]{18,40})/);
    if (chijMatch && chijMatch[1]) {
      placeId = chijMatch[1];
    }

    // Extract title from <meta property="og:title"> or <title>
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
    if (ogTitle && ogTitle[1]) {
      placeName = ogTitle[1].split("·")[0].replace(/- Google Maps/i, "").trim();
    }

    // Parse Schema.org JSON-LD blocks if present
    const ldJsonMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldJsonMatches) {
      try {
        const jsonStr = block.replace(/<\/?script[^>]*>/gi, "").trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.name && !placeName) placeName = parsed.name;
        if (parsed.aggregateRating?.ratingValue) {
          rating = Number(parsed.aggregateRating.ratingValue);
        }
        if (Array.isArray(parsed.review)) {
          for (const r of parsed.review) {
            reviews.push({
              externalId: `gmap_ld_${ Buffer.from((r.author?.name || "user") + "_" + (r.datePublished || "")).toString("hex").slice(0, 24) }`,
              reviewerName: r.author?.name || "Google Maps Customer",
              rating: Number(r.reviewRating?.ratingValue) || 5,
              reviewText: r.reviewBody || r.description || "",
              reviewTimestamp: r.datePublished ? new Date(r.datePublished) : new Date(),
            });
          }
        }
      } catch {
        // Ignore malformed JSON-LD block
      }
    }
  } catch (err) {
    console.warn("Direct Google Maps page parse warning:", err);
  }

  return { placeName, placeId, rating, reviews };
}

/**
 * Syncs REAL reviews from Google Places API (New v1 & Legacy) + Direct Google Maps Scraper.
 * ZERO dummy/mock reviews — only real customer reviews are ever saved.
 */
export async function syncGooglePlacesReviews(
  businessId: string,
  input: string
): Promise<PlaceSyncResult> {
  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return { success: false, reviewsCount: 0, error: "Business not found" };
    }

    const { placeId, query, resolvedUrl } = await extractPlaceQuery(input || business.businessName);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    let targetPlaceId = placeId || business.googlePlaceId || undefined;
    let placeName = business.businessName;
    let placeRating: number | undefined;
    const rawReviews: RawReviewPayload[] = [];

    // 1. Try Google Places API (if API key has Places enabled)
    if (apiKey) {
      try {
        if (!targetPlaceId && query) {
          const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            query
          )}&key=${apiKey}`;
          const searchRes = await fetch(searchUrl);
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.results && searchData.results.length > 0) {
              const bestMatch = searchData.results[0];
              targetPlaceId = bestMatch.place_id;
              placeName = bestMatch.name || placeName;
              placeRating = bestMatch.rating;
            }
          }
        }

        if (targetPlaceId) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${targetPlaceId}&fields=name,rating,reviews,user_ratings_total,url&reviews_sort=newest&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData.result) {
              placeName = detailsData.result.name || placeName;
              placeRating = detailsData.result.rating || placeRating;
              const fetchedReviews = detailsData.result.reviews || [];
              for (const r of fetchedReviews) {
                // Deterministic ID based on author + unix timestamp so we never duplicate
                const cleanAuthor = (r.author_name || "user").replace(/\W+/g, "_").toLowerCase();
                rawReviews.push({
                  externalId: `gp_${targetPlaceId}_${r.time || cleanAuthor}`,
                  reviewerName: r.author_name || "Google Reviewer",
                  reviewerAvatarUrl: r.profile_photo_url || undefined,
                  rating: Number(r.rating) || 5,
                  reviewText: r.text || "",
                  reviewTimestamp: r.time ? new Date(r.time * 1000) : new Date(),
                });
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn("Google Places API call notice:", apiErr);
      }
    }

    // 2. Fallback to Direct Public Google Maps Parser (Zero API Quota Needed)
    if (rawReviews.length === 0) {
      const scraped = await scrapePublicGoogleMapsReviews(resolvedUrl || query || business.businessName);
      if (scraped.placeId && !targetPlaceId) targetPlaceId = scraped.placeId;
      if (scraped.placeName) placeName = scraped.placeName;
      if (scraped.rating && !placeRating) placeRating = scraped.rating;
      rawReviews.push(...scraped.reviews);
    }

    // Construct official 1-Tap Google Write-a-Review link for QR Booster
    const writeReviewUrl = targetPlaceId
      ? `https://search.google.com/local/writereview?placeid=${targetPlaceId}`
      : resolvedUrl && resolvedUrl.startsWith("http")
      ? resolvedUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;

    // Save real Place ID & direct review link on the Business record
    await db.business.update({
      where: { id: businessId },
      data: {
        googlePlaceId: targetPlaceId || business.googlePlaceId,
        googleReviewUrl: writeReviewUrl,
      },
    });

    // 3. Ingest ONLY real fetched reviews (Never insert fake mock reviews)
    let totalIngested = 0;
    if (rawReviews.length > 0) {
      const ingestResult = await ingestReviews(businessId, "google", rawReviews);
      totalIngested = ingestResult.inserted + ingestResult.updated;
    }

    // 4. Mark Google connection as active in DB with real Place ID / URL
    await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId,
          platformName: "google",
        },
      },
      update: {
        status: "connected",
        externalAccountId: `${placeName}${targetPlaceId ? ` (${targetPlaceId})` : ""}`,
        listingUrl: writeReviewUrl,
        lastSyncAt: new Date(),
      },
      create: {
        businessId,
        platformName: "google",
        externalAccountId: `${placeName}${targetPlaceId ? ` (${targetPlaceId})` : ""}`,
        listingUrl: writeReviewUrl,
        status: "connected",
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      reviewsCount: totalIngested,
      placeId: targetPlaceId,
      placeName,
      writeReviewUrl,
      rating: placeRating,
    };
  } catch (error: any) {
    console.error("syncGooglePlacesReviews error:", error);
    return {
      success: false,
      reviewsCount: 0,
      error: error?.message || "Failed to sync Google Places reviews",
    };
  }
}
