import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postGoogleReplyToApi } from "@/lib/google-business";
import { postMetaReplyToApi } from "@/lib/meta-business";
import { detectReviewLanguage } from "@/lib/review-engine";
import { enqueueGoogleReply } from "@/lib/reply-service";
import { isWorkerTransportEnabled } from "@/lib/worker-queue";

// POST /api/reviews/reply
// Body: { reviewId: string, replyText: string, tone?: string,
//         generatedByAi?: boolean, dryRun?: boolean }
//
// Google transport is chosen with GOOGLE_REPLY_TRANSPORT:
//   "worker"  -> queue a SeleniumBase browser-worker job (no GBP API).
//               The reply is recorded as "queued" and only becomes "posted"
//               when the worker verifies it on the page (see
//               /api/worker/jobs/[id]/result). A failed job becomes "failed".
//   anything else (default) -> official GBP API as before, BUT a failed API
//               call is now recorded as "failed" (never "posted") and the
//               review is NOT marked replied. This fixes the old false-
//               success bug where failed replies showed as published live.
//
// dryRun=true only works with the worker transport: it enqueues a dry-run
// job (the worker checks the review + Reply control, types nothing, submits
// nothing) and creates NO ReviewReply row.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId || !body.replyText) {
      return NextResponse.json(
        { error: "Both reviewId and replyText are required." },
        { status: 400 }
      );
    }

    const review = await db.review.findUnique({
      where: { id: body.reviewId },
      include: { business: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const detectedLang = detectReviewLanguage(body.replyText);
    const dryRun = !!body.dryRun;

    // --- Google via SeleniumBase worker (shared path, see reply-service) ---
    if (review.platformName === "google" && isWorkerTransportEnabled()) {
      const res = await enqueueGoogleReply({
        reviewId: review.id,
        replyText: String(body.replyText).trim(),
        generatedByAi: !!body.generatedByAi,
        tone: body.tone || null,
        dryRun,
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: res.error || "Could not queue the reply." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ok: true,
        replyId: res.replyId,
        jobId: res.jobId,
        postStatus: res.postStatus,
        languageUsed: detectedLang.code,
        platform: "google",
        note: dryRun
          ? "Dry-run job queued for the browser worker. Nothing will be typed or submitted."
          : "Reply queued for the browser worker. It will show as posted only after the worker verifies it on Google Maps.",
      });
    }

    // --- Direct API transports (GBP / Meta) -------------------------------
    let postStatus = "posted";
    let publishError = "";

    if (review.platformName === "google") {
      const gResult = await postGoogleReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (!gResult.success) {
        // HONEST FAILURE: never record a failed Google reply as "posted".
        postStatus = "failed";
        publishError =
          gResult.error || "Google rejected the reply. It was not posted.";
      }
    } else if (review.platformName === "facebook") {
      const fbResult = await postMetaReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (!fbResult.success) {
        postStatus = "failed";
        publishError =
          fbResult.error || "Facebook rejected the reply. It was not posted.";
      }
    } else if (review.platformName === "justdial" || review.platformName === "indiamart") {
      postStatus = "copied_to_clipboard";
    } else if (review.platformName === "qr_direct") {
      postStatus = "posted";
    }

    const reply = await db.reviewReply.create({
      data: {
        reviewId: review.id,
        businessId: review.businessId,
        replyText: body.replyText.trim(),
        generatedByAi: !!body.generatedByAi,
        aiToneUsed: body.tone || null,
        languageUsed: detectedLang.code,
        postStatus,
      },
    });

    // Only mark the review replied when the reply is actually posted (or
    // saved for manual paste on Justdial/IndiaMART). Queued/failed replies
    // leave isReplied false so the dashboard keeps showing them as pending.
    if (postStatus === "posted" || postStatus === "copied_to_clipboard") {
      await db.review.update({
        where: { id: review.id },
        data: { isReplied: true },
      });
    }

    return NextResponse.json({
      ok: true,
      replyId: reply.id,
      postStatus,
      languageUsed: detectedLang.code,
      platform: review.platformName,
      publishError: publishError || undefined,
      note:
        postStatus === "copied_to_clipboard"
          ? `Reply saved and copied to clipboard for 1-tap pasting on ${review.platformName.toUpperCase()}.`
          : postStatus === "failed"
            ? `Reply could NOT be posted: ${publishError}`
            : `Reply published and recorded for ${review.platformName.toUpperCase()}.`,
    });
  } catch (err: unknown) {
    console.error("POST /api/reviews/reply error:", err);
    return NextResponse.json(
      { error: "Failed to post review reply." },
      { status: 500 }
    );
  }
}
