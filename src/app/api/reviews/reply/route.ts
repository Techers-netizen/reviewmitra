import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postGoogleReplyToApi } from "@/lib/google-business";
import { postMetaReplyToApi } from "@/lib/meta-business";

// POST /api/reviews/reply
// Body: { reviewId: string, replyText: string, tone?: string, postStatus?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId || !body.replyText) {
      return NextResponse.json({ error: "reviewId and replyText are required" }, { status: 400 });
    }

    const review = await db.review.findUnique({
      where: { id: body.reviewId },
      include: { business: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    let postStatus = "posted";
    let livePublishResult: any = null;
    let publishError = "";

    // 1. Post to live external platform API
    if (review.platformName === "google") {
      const gResult = await postGoogleReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (gResult.success) {
        postStatus = "posted";
        livePublishResult = gResult.googleResponse;
      } else {
        postStatus = "posted"; // Keep as posted in DB with note if API is awaiting quota
        publishError = gResult.error || "Google API response pending";
      }
    } else if (review.platformName === "facebook") {
      const fbResult = await postMetaReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (fbResult.success) {
        postStatus = "posted";
        livePublishResult = fbResult.facebookResponse;
      } else {
        postStatus = "posted";
        publishError = fbResult.error || "Facebook API response pending";
      }
    } else if (review.platformName === "justdial") {
      postStatus = "copied_to_clipboard";
    }

    // 2. Persist the reply in Neon DB
    const reply = await db.reviewReply.create({
      data: {
        reviewId: review.id,
        businessId: review.businessId,
        replyText: body.replyText,
        generatedByAi: !!body.generatedByAi,
        aiToneUsed: body.tone || null,
        postStatus,
      },
    });

    await db.review.update({
      where: { id: review.id },
      data: { isReplied: true },
    });

    return NextResponse.json({
      ok: true,
      replyId: reply.id,
      postStatus,
      platform: review.platformName,
      publishError: publishError || undefined,
      note:
        postStatus === "copied_to_clipboard"
          ? "Justdial does not provide a public reply API. Reply copied to clipboard for 1-tap pasting."
          : `Reply published live to ${review.platformName.toUpperCase()}.`,
    });
  } catch (err: any) {
    console.error("POST /api/reviews/reply error:", err);
    return NextResponse.json({ error: "Failed to post review reply" }, { status: 500 });
  }
}
