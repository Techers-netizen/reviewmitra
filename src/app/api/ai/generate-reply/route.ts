import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  detectReviewLanguage,
  generateAiReply,
  type Tone,
} from "@/lib/review-engine";

/**
 * POST /api/ai/generate-reply
 * Uses ONLY the single configured GEMINI_API_KEY (`gemini-2.5-flash`) via our Agentic AI engine
 * and automatically replies in the exact language of the customer's review.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId) {
      return NextResponse.json(
        { error: "Please provide a valid reviewId." },
        { status: 400 }
      );
    }

    const tone: Tone = ["friendly", "professional", "hinglish", "brief"].includes(body.tone)
      ? (body.tone as Tone)
      : "friendly";

    const review = await db.review.findUnique({
      where: { id: body.reviewId },
      include: { business: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const detectedLang = detectReviewLanguage(review.reviewText);

    const reply = await generateAiReply(
      {
        reviewerName: review.reviewerName,
        rating: review.rating,
        reviewText: review.reviewText || "",
        businessName: review.business.businessName,
        businessId: review.businessId,
        category: review.business.category,
        phoneSupport: review.business.phoneSupport,
        matchReviewLanguage: review.business.matchReviewLanguage,
      },
      tone
    );

    if (!reply) {
      return NextResponse.json(
        { error: "AI returned an empty reply. Please try again." },
        { status: 502 }
      );
    }

    // Increment subscription AI reply usage counter
    const sub = await db.subscription.findFirst({
      where: { businessId: review.businessId },
    });
    if (sub) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { aiRepliesUsed: { increment: 1 } },
      });
    }

    return NextResponse.json({
      reply,
      toneUsed: tone,
      detectedLanguage: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      sentiment: review.sentiment,
    });
  } catch (err) {
    console.error("AI generate-reply error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate AI reply.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
