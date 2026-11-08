import { db } from "@/lib/db";
import { detectReviewLanguage } from "@/lib/review-engine";
import {
  enqueueWorkerJob,
  isWorkerTransportEnabled,
  workerBusinessUrl,
} from "@/lib/worker-queue";

/**
 * Shared Google reply path — used by BOTH the dashboard's manual Post Reply
 * button (POST /api/reviews/reply) and the AI auto-reply cron
 * (POST /api/cron/process-reviews). One path, one honesty rule:
 *
 * - The reply is recorded as "queued" and the review stays unreplied
 *   until the SeleniumBase worker reads the reply back on Google Maps
 *   (see applyJobOutcomeToDb in worker-queue.ts). Only then does it
 *   become "posted" + isReplied=true. Anything else becomes "failed".
 * - dryRun=true enqueues a dry-run job only: nothing is typed or
 *   submitted, and NO ReviewReply row is created.
 * - When the worker transport is disabled (GOOGLE_REPLY_TRANSPORT !=
 *   "worker") this returns ok:false instead of falling back to a
 *   fake "posted" — the caller must surface the failure honestly.
 *   The official GBP API is NOT used here (quota is 0).
 */
export async function enqueueGoogleReply(opts: {
  reviewId: string;
  replyText: string;
  generatedByAi?: boolean;
  tone?: string | null;
  dryRun?: boolean;
}): Promise<{
  ok: boolean;
  replyId?: string;
  jobId?: string;
  postStatus: string;
  error?: string;
}> {
  const review = await db.review.findUnique({
    where: { id: opts.reviewId },
    include: { business: true },
  });
  if (!review) {
    return { ok: false, postStatus: "failed", error: "Review not found." };
  }
  if (review.platformName !== "google") {
    return {
      ok: false,
      postStatus: "failed",
      error: "Worker reply path only handles Google reviews.",
    };
  }
  if (!isWorkerTransportEnabled()) {
    return {
      ok: false,
      postStatus: "failed",
      error:
        "Worker transport is not enabled (GOOGLE_REPLY_TRANSPORT != 'worker'). Reply was not posted.",
    };
  }

  const detectedLang = detectReviewLanguage(opts.replyText);
  const dryRun = !!opts.dryRun;
  const businessUrl = workerBusinessUrl(review.business);

  let replyId: string | undefined;
  if (!dryRun) {
    // Create the row FIRST so the worker result can update it, but keep it
    // "queued": isReplied stays false until the worker verifies the post.
    const reply = await db.reviewReply.create({
      data: {
        reviewId: review.id,
        businessId: review.businessId,
        replyText: String(opts.replyText).trim(),
        generatedByAi: !!opts.generatedByAi,
        aiToneUsed: opts.tone || null,
        languageUsed: detectedLang.code,
        postStatus: "queued",
      },
    });
    replyId = reply.id;
  }

  const job = enqueueWorkerJob({
    type: "google_reply",
    businessId: review.businessId,
    reviewId: review.id,
    externalReviewId: review.externalReviewId,
    reviewerName: review.reviewerName,
    reviewSnippet: (review.reviewText || "").slice(0, 120),
    replyText: String(opts.replyText).trim(),
    businessUrl,
    dryRun,
    replyDbId: replyId || null,
  });

  return {
    ok: true,
    replyId,
    jobId: job.id,
    postStatus: dryRun ? "dry_run_queued" : "queued",
  };
}
