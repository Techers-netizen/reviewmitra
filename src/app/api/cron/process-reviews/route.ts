import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAiReply } from "@/lib/review-engine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { postMetaReplyToApi } from "@/lib/meta-business";
import { enqueueGoogleReply } from "@/lib/reply-service";

/**
 * Cron: process unreplied reviews (daily auto-reply).
 *
 * HONESTY + SHARED-PATH RULES (2026-11-09, Step 0/3):
 * - Google replies go through the SAME worker /reply path as the manual
 *   Post Reply button (enqueueGoogleReply). The old code called the GBP
 *   API with .catch(() => {}) and then recorded postStatus "posted" +
 *   isReplied=true unconditionally — with GBP quota 0 that call always
 *   failed, so failed replies showed as published live. That is deleted.
 *   A reply is "posted" only after the worker reads it back on Google
 *   Maps (applyJobOutcomeToDb); until then the review stays unreplied
 *   and the cron will retry it on the next run.
 * - Auto-reply rule: 4-5★ only. 1-3★ stays as a draft + WhatsApp alert
 *   for a human to review. The old 3★ auto-reply branch is deleted.
 * - Facebook replies are recorded "posted" only when the Meta API call
 *   actually succeeds; a failure is recorded as "failed" and the review
 *   stays unreplied. Justdial stays "copied_to_clipboard" (manual paste).
 */
interface CronOptions {
  dryRun: boolean;
  limit: number;
}

async function handleProcessReviews(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(req.url);

    // Optional security check if secret is configured in env
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = url.searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
      }
    }

    // Parse options: dry-run and rate-limit
    let dryRun = url.searchParams.get("dryRun") === "true";
    let limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body.dryRun === "boolean") dryRun = body.dryRun;
        if (typeof body.limit === "number") limit = Math.min(20, Math.max(1, body.limit));
      } catch {}
    }

    // 1. Fetch unreplied reviews queue with rate limiting
    const unrepliedReviews = await db.review.findMany({
      where: { isReplied: false },
      include: {
        business: true,
        replies: true,
      },
      orderBy: { reviewTimestamp: "desc" },
      take: limit,
    });

    const summary = {
      queueTotal: await db.review.count({ where: { isReplied: false } }),
      batchProcessed: unrepliedReviews.length,
      autoReplied: 0,
      draftsCreated: 0,
      alertsSent: 0,
      dryRun,
      rateLimit: limit,
      retries: 0,
      items: [] as any[],
    };

    const makeDraft = async (rev: any, biz: any, generatedReply: string) => {
      await db.reviewReply.create({
        data: {
          reviewId: rev.id,
          businessId: biz.id,
          replyText: generatedReply,
          generatedByAi: true,
          aiToneUsed: "friendly",
          postStatus: "draft",
          isAutoReply: false,
          isDraft: true,
        },
      });
      if (biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
        await sendWhatsAppNotification({
          toPhoneNumber: biz.notifyWhatsappNumber,
          templateType: "negative_alert",
          data: {
            businessName: biz.businessName,
            reviewerName: rev.reviewerName,
            rating: rev.rating,
            platform: rev.platformName,
            reviewText: rev.reviewText || "(No comment text)",
            draftReply: generatedReply,
          },
        }).catch(() => {});
        summary.alertsSent++;
      }
    };

    for (const rev of unrepliedReviews) {
      const biz = rev.business;
      if (!biz) continue;

      const tone = (biz.defaultTone || "friendly") as any;
      let itemAction = "none";
      let generatedReply = "";

      try {
        // ─── Case 1: Positive Review (4-5★) — auto-reply ─────────────
        if (rev.rating >= 4) {
          if (biz.autoReplyPositive) {
            generatedReply = await generateAiReply(
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

            if (dryRun) {
              itemAction = "dry_run_auto_reply_preview";
              summary.autoReplied++;
            } else if (rev.platformName === "google") {
              // Same worker path as the manual button.
              const res = await enqueueGoogleReply({
                reviewId: rev.id,
                replyText: generatedReply,
                generatedByAi: true,
                tone,
              });
              if (res.ok) {
                itemAction = "auto_reply_queued_for_worker";
                summary.autoReplied++;
              } else {
                itemAction = "auto_reply_queue_failed";
                summary.retries++;
                console.error(`Cron could not queue Google reply for ${rev.id}:`, res.error);
              }
            } else if (rev.platformName === "facebook") {
              const fb = await postMetaReplyToApi(biz.id, rev.externalReviewId, generatedReply).catch(
                (e: any) => ({ success: false, error: e?.message || "Facebook reply failed" })
              );
              if (fb.success) {
                await db.reviewReply.create({
                  data: {
                    reviewId: rev.id,
                    businessId: biz.id,
                    replyText: generatedReply,
                    generatedByAi: true,
                    aiToneUsed: tone,
                    postStatus: "posted",
                    isAutoReply: true,
                    isDraft: false,
                  },
                });
                await db.review.update({ where: { id: rev.id }, data: { isReplied: true } });
                itemAction = "auto_reply_posted";
                summary.autoReplied++;
              } else {
                await db.reviewReply.create({
                  data: {
                    reviewId: rev.id,
                    businessId: biz.id,
                    replyText: generatedReply,
                    generatedByAi: true,
                    aiToneUsed: tone,
                    postStatus: "failed",
                    isAutoReply: true,
                    isDraft: false,
                  },
                });
                itemAction = "auto_reply_failed";
                summary.retries++;
              }
            } else {
              // Justdial / IndiaMART: manual-paste flow.
              await db.reviewReply.create({
                data: {
                  reviewId: rev.id,
                  businessId: biz.id,
                  replyText: generatedReply,
                  generatedByAi: true,
                  aiToneUsed: tone,
                  postStatus: "copied_to_clipboard",
                  isAutoReply: true,
                  isDraft: false,
                },
              });
              await db.review.update({ where: { id: rev.id }, data: { isReplied: true } });
              itemAction = "auto_reply_copied_to_clipboard";
              summary.autoReplied++;
            }

            if (!dryRun && itemAction === "auto_reply_queued_for_worker" && biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
              await sendWhatsAppNotification({
                toPhoneNumber: biz.notifyWhatsappNumber,
                templateType: "auto_reply_confirm",
                data: {
                  reviewerName: rev.reviewerName,
                  rating: rev.rating,
                  platform: rev.platformName,
                  draftReply: generatedReply,
                },
              }).catch(() => {});
              summary.alertsSent++;
            }
          }
        }
        // ─── Case 2: 1-3★ — SAFETY DRAFT ONLY + WhatsApp alert ──────
        else {
          const existingDraft = rev.replies.find((r) => r.isDraft);

          if (!existingDraft) {
            generatedReply = await generateAiReply(
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

            itemAction = dryRun ? "dry_run_low_star_draft_preview" : "low_star_draft_created";

            if (!dryRun) {
              await makeDraft(rev, biz, generatedReply);
              summary.draftsCreated++;
            } else {
              summary.draftsCreated++;
            }
          } else {
            itemAction = "low_star_draft_already_exists";
          }
        }

        summary.items.push({
          reviewId: rev.id,
          reviewer: rev.reviewerName,
          rating: rev.rating,
          platform: rev.platformName,
          action: itemAction,
          replyPreview: generatedReply.slice(0, 100) + "...",
        });
      } catch (err: any) {
        summary.retries++;
        console.error(`Error processing review ${rev.id}:`, err);
        summary.items.push({
          reviewId: rev.id,
          error: err?.message || "Failed processing",
          retryStatus: "queued_for_retry",
        });
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

export async function GET(req: NextRequest) {
  return handleProcessReviews(req);
}

export async function POST(req: NextRequest) {
  return handleProcessReviews(req);
}
