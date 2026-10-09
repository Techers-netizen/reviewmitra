import { RawReviewPayload } from "@/lib/sync-engine";

/**
 * Scrapes public customer reviews from a Justdial business listing URL.
 */
export async function scrapeJustdialReviews(url: string): Promise<{
  success: boolean;
  businessTitle?: string;
  reviews: RawReviewPayload[];
  error?: string;
}> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      return { success: false, reviews: [], error: "Invalid URL provided." };
    }

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        reviews: [],
        error: `Could not reach Justdial page (${response.status})`,
      };
    }

    const html = await response.text();

    // Extract business title from <title> or <h1>
    let businessTitle = "Justdial Business";
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      businessTitle = titleMatch[1].split("|")[0].split("-")[0].trim();
    }

    const reviews: RawReviewPayload[] = [];

    // Parse review comments from common Justdial HTML blocks
    const reviewBlocks = html.match(/class="[^"]*review_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) ||
      html.match(/class="[^"]*comment[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) ||
      [];

    for (let i = 0; i < Math.min(reviewBlocks.length, 10); i++) {
      const block = reviewBlocks[i];
      const textContent = block.replace(/<[^>]+>/g, "").trim();

      if (textContent.length > 5) {
        reviews.push({
          externalId: `jd_${Date.now()}_${i}`,
          reviewerName: `Justdial User ${i + 1}`,
          rating: 5,
          reviewText: textContent,
          reviewTimestamp: new Date(Date.now() - i * 86400000),
        });
      }
    }

    return {
      success: true,
      businessTitle,
      reviews,
    };
  } catch (err: any) {
    console.error("Justdial scraper error:", err);
    return {
      success: false,
      reviews: [],
      error: err?.message || "Failed to parse Justdial listing",
    };
  }
}
