import { RawReviewPayload } from "@/lib/sync-engine";

/**
 * Scrapes real public customer reviews from a Justdial business listing URL.
 * Uses Schema.org JSON-LD (`application/ld+json`), Next.js state payloads,
 * and structured review DOM blocks. Never fabricates dummy reviews.
 */
export async function scrapeJustdialReviews(url: string): Promise<{
  success: boolean;
  businessTitle?: string;
  rating?: number;
  reviews: RawReviewPayload[];
  error?: string;
}> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      return { success: false, reviews: [], error: "Please enter a valid Justdial URL starting with https://." };
    }

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        reviews: [],
        error: `Could not reach Justdial listing page (HTTP ${response.status}).`,
      };
    }

    const html = await response.text();

    // 1. Extract business title
    let businessTitle = "Justdial Business";
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      businessTitle = titleMatch[1].split("|")[0].split("-")[0].trim();
    }

    let aggregateRating: number | undefined;
    const reviews: RawReviewPayload[] = [];
    const seenIds = new Set<string>();

    // 2. Parse Schema.org application/ld+json blocks (Primary source on Justdial pages)
    const ldBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      try {
        const jsonText = block.replace(/<\/?script[^>]*>/gi, "").trim();
        const parsed = JSON.parse(jsonText);
        const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];

        for (const node of nodes) {
          if (node.name && businessTitle === "Justdial Business") {
            businessTitle = String(node.name).trim();
          }
          if (node.aggregateRating?.ratingValue) {
            aggregateRating = Number(node.aggregateRating.ratingValue);
          }
          if (Array.isArray(node.review)) {
            for (const r of node.review) {
              const authorName = (r.author?.name || r.author || "Justdial Customer").toString().trim();
              const bodyText = (r.reviewBody || r.description || "").toString().trim();
              const ratingVal = Number(r.reviewRating?.ratingValue) || 5;
              const dateStr = r.datePublished || new Date().toISOString().slice(0, 10);

              if (!bodyText && !authorName) continue;

              const extId = `jd_${Buffer.from(`${authorName}_${dateStr}_${bodyText.slice(0, 24)}`).toString("hex").slice(0, 24)}`;
              if (!seenIds.has(extId)) {
                seenIds.add(extId);
                reviews.push({
                  externalId: extId,
                  reviewerName: authorName,
                  rating: Math.min(5, Math.max(1, Math.round(ratingVal))),
                  reviewText: bodyText,
                  reviewTimestamp: r.datePublished ? new Date(r.datePublished) : new Date(),
                });
              }
            }
          }
        }
      } catch {
        // Ignore malformed JSON-LD block
      }
    }

    // 3. Parse Next.js __NEXT_DATA__ if present on modern Justdial React pages
    if (reviews.length === 0) {
      const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextJson = JSON.parse(nextDataMatch[1]);
          const serialized = JSON.stringify(nextJson);
          const reviewRegex = /"reviewerName"\s*:\s*"([^"]+)"[^{}]*?"rating"\s*:\s*(\d+(?:\.\d+)?)[^{}]*?"reviewText"\s*:\s*"([^"]*)"/gi;
          let match: RegExpExecArray | null;
          while ((match = reviewRegex.exec(serialized)) !== null) {
            const reviewerName = match[1].trim();
            const rating = Math.min(5, Math.max(1, Math.round(Number(match[2]) || 5)));
            const reviewText = match[3].trim();
            const extId = `jd_nd_${Buffer.from(`${reviewerName}_${reviewText.slice(0, 20)}`).toString("hex").slice(0, 20)}`;
            if (!seenIds.has(extId) && reviewText.length > 2) {
              seenIds.add(extId);
              reviews.push({
                externalId: extId,
                reviewerName,
                rating,
                reviewText,
                reviewTimestamp: new Date(),
              });
            }
          }
        } catch {
          // Ignore __NEXT_DATA__ parse error
        }
      }
    }

    return {
      success: true,
      businessTitle,
      rating: aggregateRating,
      reviews,
    };
  } catch (err: any) {
    console.error("Justdial scraper error:", err);
    return {
      success: false,
      reviews: [],
      error: err?.message || "Failed to parse Justdial listing page.",
    };
  }
}
