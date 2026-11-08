import { db } from "@/lib/db";
import { detectReviewLanguage, generateAiReply } from "@/lib/review-engine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export interface RawReviewPayload {
  externalId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  reviewText?: string;
  reviewTimestamp: Date;
}

export function classifySentiment(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

/**
 * Ingests a batch of real reviews for a business platform, avoids duplicates
 * (upsert by platform + externalReviewId), detects customer review language,
 * and handles the 1-3★ safety path (draft + WhatsApp alert).
 *
 * HONESTY RULES (2026-11-09, Step 0):
 * - Ingest NEVER marks a reply "posted" and NEVER sets isReplied=true.
 *   Posting happens only through the shared worker /reply path
 *   (POST /api/reviews/reply or the cron), which marks "posted" only after
 *   the worker reads the reply back on Google Maps. The old code created a
 *   ReviewReply with postStatus "posted" at ingest time for Google without
 *   ever posting it — that false-success bug is deleted.
 * - Auto-reply rule: 4-5★ only, posted by the cron via the worker path.
 *   1-3★ stays as a draft + WhatsApp alert, for a human to review.
 *   The old neutral (3★) auto-reply branch is deleted.
 */
export async function ingestReviews(
  businessId: string,
  platformName: "google" | "facebook" | "justdial" | "indiamart" | "qr_direct",
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
    autoReplied: 0, // kept for callers; ingest itself never auto-posts
    draftsCreated: 0,
  };

  for (const raw of rawReviews) {
    const sentiment = classifySentiment(raw.rating);
    const detectedLang = detectReviewLanguage(raw.reviewText);

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
          customerPhone: raw.customerPhone,
          rating: raw.rating,
          reviewText: raw.reviewText,
          detectedLanguage: detectedLang.code,
          sentiment,
          reviewTimestamp: raw.reviewTimestamp,
          isReplied: false,
        },
      });
      results.inserted++;

      // 1-3★ safety path: draft an empathetic reply in the customer's
      // language and alert the owner on WhatsApp. The draft is created
      // even when no WhatsApp number is configured; the alert only sends
      // when one is. 4-5★ reviews get nothing here — the cron posts them
      // via the shared worker /reply path.
      if (sentiment !== "positive") {
        try {
          const draftApology = await generateAiReply(
            {
              reviewerName: raw.reviewerName,
              rating: raw.rating,
              reviewText: raw.reviewText || "",
              businessName: business.businessName,
              businessId: business.id,
              category: business.category || "business",
              phoneSupport: business.phoneSupport || undefined,
              matchReviewLanguage: business.matchReviewLanguage,
            },
            business.defaultTone as any
          );

          await db.reviewReply.create({
            data: {
              reviewId: newReview.id,
              businessId,
              replyText: draftApology,
              generatedByAi: true,
              aiToneUsed: business.defaultTone,
              languageUsed: detectedLang.code,
              postStatus: "draft",
              isAutoReply: false,
              isDraft: true,
            },
          });
          results.draftsCreated++;

          if (business.notifyWhatsapp && business.notifyWhatsappNumber) {
            await sendWhatsAppNotification({
              toPhoneNumber: business.notifyWhatsappNumber,
              templateType: "negative_alert",
              data: {
                businessName: business.businessName,
                reviewerName: raw.reviewerName,
                rating: raw.rating,
                platform: platformName,
                reviewText: raw.reviewText,
                draftReply: draftApology,
              },
            }).catch((waErr) => {
              console.warn("Negative review WhatsApp alert failed:", waErr);
            });
          }
        } catch (e) {
          console.error("1-3★ draft creation failed:", e);
        }
      }
    }
  }

  if (platformName !== "qr_direct") {
    await db.platformConnection.updateMany({
      where: { businessId, platformName },
      data: { lastSyncAt: new Date(), status: "connected" },
    });
  }

  return results;
}
