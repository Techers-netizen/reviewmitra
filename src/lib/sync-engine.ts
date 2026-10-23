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
 * Ingests a batch of real reviews for a business platform, avoids duplicates,
 * detects customer review language, triggers same-language Agentic AI auto-reply,
 * and dispatches instant WhatsApp alerts for negative reviews.
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
    autoReplied: 0,
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

      // Check auto-reply rules (Positive 4-5★ or Neutral 3★)
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
              replyText: generatedText,
              generatedByAi: true,
              aiToneUsed: business.defaultTone,
              languageUsed: detectedLang.code,
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
      } else if (sentiment === "negative" && business.notifyWhatsapp && business.notifyWhatsappNumber) {
        // Draft an empathetic apology in the customer's language and send WhatsApp alert
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
          });
        } catch (waErr) {
          console.warn("Negative review WhatsApp alert failed:", waErr);
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
