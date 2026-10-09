import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAiReply } from "@/lib/review-engine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { postGoogleReplyToApi } from "@/lib/google-business";
import { postMetaReplyToApi } from "@/lib/meta-business";

// POST /api/cron/process-reviews
// Secured via CRON_SECRET header or query parameter
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional security check if secret is configured in env
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = new URL(req.url).searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
      }
    }

    // 1. Fetch all unreplied reviews
    const unrepliedReviews = await db.review.findMany({
      where: { isReplied: false },
      include: {
        business: true,
        replies: true,
      },
      take: 20,
    });

    const summary = {
      totalFound: unrepliedReviews.length,
      autoReplied: 0,
      draftsCreated: 0,
      alertsSent: 0,
    };

    for (const rev of unrepliedReviews) {
      const biz = rev.business;
      if (!biz) continue;

      const tone = (biz.defaultTone || "friendly") as any;

      // ─── Case 1: Positive Review (4-5★) ───────────────────────
      if (rev.rating >= 4) {
        if (biz.autoReplyPositive) {
          const replyText = await generateAiReply(
            {
              reviewerName: rev.reviewerName,
              rating: rev.rating,
              reviewText: rev.reviewText || "5 star rating",
              businessName: biz.businessName,
              category: biz.category,
              phoneSupport: biz.phoneSupport,
            },
            tone
          );

          // Post live to platform API
          if (rev.platformName === "google") {
            await postGoogleReplyToApi(biz.id, rev.externalReviewId, replyText).catch(() => {});
          } else if (rev.platformName === "facebook") {
            await postMetaReplyToApi(biz.id, rev.externalReviewId, replyText).catch(() => {});
          }

          await db.reviewReply.create({
            data: {
              reviewId: rev.id,
              businessId: biz.id,
              replyText,
              generatedByAi: true,
              aiToneUsed: tone,
              postStatus: rev.platformName === "justdial" ? "copied_to_clipboard" : "posted",
              isAutoReply: true,
              isDraft: false,
            },
          });

          await db.review.update({
            where: { id: rev.id },
            data: { isReplied: true },
          });

          summary.autoReplied++;

          // Send confirmation WhatsApp if enabled
          if (biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
            await sendWhatsAppNotification({
              toPhoneNumber: biz.notifyWhatsappNumber,
              templateType: "auto_reply_confirm",
              data: {
                reviewerName: rev.reviewerName,
                rating: rev.rating,
                platform: rev.platformName,
                draftReply: replyText,
              },
            });
            summary.alertsSent++;
          }
        }
      }

      // ─── Case 2: Negative Review (1-2★) — SAFETY DRAFT LOCK ──
      else if (rev.rating <= 2) {
        const existingDraft = rev.replies.find((r) => r.isDraft);

        if (!existingDraft) {
          const draftText = await generateAiReply(
            {
              reviewerName: rev.reviewerName,
              rating: rev.rating,
              reviewText: rev.reviewText || "Negative experience reported",
              businessName: biz.businessName,
              category: biz.category,
              phoneSupport: biz.phoneSupport,
            },
            "friendly"
          );

          await db.reviewReply.create({
            data: {
              reviewId: rev.id,
              businessId: biz.id,
              replyText: draftText,
              generatedByAi: true,
              aiToneUsed: "friendly",
              postStatus: "draft",
              isAutoReply: false,
              isDraft: true,
            },
          });

          summary.draftsCreated++;

          // Urgent WhatsApp alert to owner
          if (biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
            await sendWhatsAppNotification({
              toPhoneNumber: biz.notifyWhatsappNumber,
              templateType: "negative_alert",
              data: {
                reviewerName: rev.reviewerName,
                rating: rev.rating,
                platform: rev.platformName,
                reviewText: rev.reviewText || "(No comment text)",
                draftReply: draftText,
              },
            });
            summary.alertsSent++;
          }
        }
      }

      // ─── Case 3: Neutral Review (3★) ─────────────────────────
      else {
        if (biz.autoReplyNeutral) {
          const replyText = await generateAiReply(
            {
              reviewerName: rev.reviewerName,
              rating: rev.rating,
              reviewText: rev.reviewText || "Average feedback",
              businessName: biz.businessName,
              category: biz.category,
              phoneSupport: biz.phoneSupport,
            },
            tone
          );

          if (rev.platformName === "google") {
            await postGoogleReplyToApi(biz.id, rev.externalReviewId, replyText).catch(() => {});
          } else if (rev.platformName === "facebook") {
            await postMetaReplyToApi(biz.id, rev.externalReviewId, replyText).catch(() => {});
          }

          await db.reviewReply.create({
            data: {
              reviewId: rev.id,
              businessId: biz.id,
              replyText,
              generatedByAi: true,
              aiToneUsed: tone,
              postStatus: rev.platformName === "justdial" ? "copied_to_clipboard" : "posted",
              isAutoReply: true,
              isDraft: false,
            },
          });

          await db.review.update({
            where: { id: rev.id },
            data: { isReplied: true },
          });

          summary.autoReplied++;
        } else {
          const existingDraft = rev.replies.find((r) => r.isDraft);
          if (!existingDraft) {
            const draftText = await generateAiReply(
              {
                reviewerName: rev.reviewerName,
                rating: rev.rating,
                reviewText: rev.reviewText || "Average feedback",
                businessName: biz.businessName,
                category: biz.category,
                phoneSupport: biz.phoneSupport,
              },
              tone
            );

            await db.reviewReply.create({
              data: {
                reviewId: rev.id,
                businessId: biz.id,
                replyText: draftText,
                generatedByAi: true,
                aiToneUsed: tone,
                postStatus: "draft",
                isAutoReply: false,
                isDraft: true,
              },
            });

            summary.draftsCreated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error("Cron process-reviews error:", error);
    return NextResponse.json(
      { error: "Cron review processing failed." },
      { status: 500 }
    );
  }
}
