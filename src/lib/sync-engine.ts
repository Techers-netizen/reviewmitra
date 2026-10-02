import { db } from "@/lib/db";
import { generateAiReply } from "@/lib/review-engine";

export interface RawReviewPayload {
  externalId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number; // 1 to 5
  reviewText?: string;
  reviewTimestamp: Date;
}

export function classifySentiment(rating: number, text?: string): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

/**
 * Ingests a batch of raw reviews for a business platform,
 * avoids duplicates, saves to DB, and triggers auto-reply if enabled.
 */
export async function ingestReviews(
  businessId: string,
  platformName: "google" | "facebook" | "justdial",
  rawReviews: RawReviewPayload[]
) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    include: { subscriptions: true },
  });

  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  const results = {
    inserted: 0,
    updated: 0,
    autoReplied: 0,
  };

  for (const raw of rawReviews) {
    const sentiment = classifySentiment(raw.rating, raw.reviewText);

    const existing = await db.review.findUnique({
      where: {
        platformName_externalReviewId: {
          platformName,
          externalReviewId: raw.externalId,
        },
      },
    });

    if (!existing) {
      const newReview = await db.review.create({
        data: {
          businessId,
          platformName,
          externalReviewId: raw.externalId,
          reviewerName: raw.reviewerName,
          reviewerAvatarUrl: raw.reviewerAvatarUrl,
          rating: raw.rating,
          reviewText: raw.reviewText,
          sentiment,
          reviewTimestamp: raw.reviewTimestamp,
          isReplied: false,
        },
      });
      results.inserted++;

      // Check auto-reply logic
      const shouldAutoReply =
        (sentiment === "positive" && business.autoReplyPositive) ||
        (sentiment === "neutral" && business.autoReplyNeutral);

      if (shouldAutoReply && raw.reviewText) {
        try {
          const generatedText = await generateAiReply(
            {
              reviewerName: raw.reviewerName,
              rating: raw.rating,
              reviewText: raw.reviewText,
              businessName: business.businessName,
              category: business.category || "business",
              phoneSupport: business.phoneSupport || undefined,
            },
            business.defaultTone as any
          );

          await db.reviewReply.create({
            data: {
              reviewId: newReview.id,
              businessId,
              replyText: generatedText,
              generatedByAi: true,
              aiToneUsed: business.defaultTone,
              postStatus: platformName === "google" ? "posted" : "copied_to_clipboard",
              isAutoReply: true,
              isDraft: false,
            },
          });

          await db.review.update({
            where: { id: newReview.id },
            data: { isReplied: true },
          });

          results.autoReplied++;
        } catch (e) {
          console.error("Auto-reply generation failed:", e);
        }
      }
    }
  }

  // Update lastSyncAt on connection
  await db.platformConnection.updateMany({
    where: { businessId, platformName },
    data: { lastSyncAt: new Date(), status: "connected" },
  });

  return results;
}
