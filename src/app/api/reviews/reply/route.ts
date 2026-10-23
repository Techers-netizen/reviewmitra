import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postGoogleReplyToApi } from "@/lib/google-business";
import { postMetaReplyToApi } from "@/lib/meta-business";
import { detectReviewLanguage } from "@/lib/review-engine";

// POST /api/reviews/reply
// Body: { reviewId: string, replyText: string, tone?: string, generatedByAi?: boolean }
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

    let postStatus = "posted";
    let publishError = "";

    if (review.platformName === "google") {
      const gResult = await postGoogleReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (!gResult.success) {
        publishError = gResult.error || "Saved in dashboard (direct link copy ready)";
      }
    } else if (review.platformName === "facebook") {
      const fbResult = await postMetaReplyToApi(
        review.businessId,
        review.externalReviewId,
        body.replyText
      );
      if (!fbResult.success) {
        publishError = fbResult.error || "Saved in dashboard (direct link copy ready)";
      }
    } else if (review.platformName === "justdial" || review.platformName === "indiamart") {
      postStatus = "copied_to_clipboard";
    } else if (review.platformName === "qr_direct") {
      postStatus = "posted";
    }

    const detectedLang = detectReviewLanguage(body.replyText);

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

    await db.review.update({
      where: { id: review.id },
      data: { isReplied: true },
    });

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
          : `Reply published and recorded for ${review.platformName.toUpperCase()}.`,
    });
  } catch (err: any) {
    console.error("POST /api/reviews/reply error:", err);
    return NextResponse.json(
      { error: "Failed to post review reply." },
      { status: 500 }
    );
  }
}
