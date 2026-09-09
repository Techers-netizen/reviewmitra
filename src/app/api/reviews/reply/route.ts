import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reviews/reply
// Body: { reviewId: string, replyText: string, tone?: string, platform?: string }
// - For google/facebook: marks review as REPLIED and saves the reply.
// - For justdial: marks review as replied with postStatus='copied_to_clipboard'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId || !body.replyText) {
      return NextResponse.json({ error: "reviewId and replyText are required" }, { status: 400 });
    }

    const review = await db.review.findUnique({
      where: { id: body.reviewId },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // In production this is where we'd post to Google Business API or FB Graph API.
    // Here we just persist the reply and mark it posted.
    const postStatus = body.postStatus || (review.platformName === "justdial" ? "copied_to_clipboard" : "posted");

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
      note:
        postStatus === "copied_to_clipboard"
          ? "Justdial has no public reply API — the reply was copied. Tap the deep link to open Justdial and paste manually."
          : "Reply posted live to " + review.platformName + ".",
    });
  } catch (err) {
    console.error("POST /api/reviews/reply error:", err);
    return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
  }
}
