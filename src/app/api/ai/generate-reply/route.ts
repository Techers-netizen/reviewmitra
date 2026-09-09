import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { buildReplyPrompt, type Tone } from "@/lib/review-engine";

// POST /api/ai/generate-reply
// Body: { reviewId: string, tone: Tone }
// Returns: { reply: string, toneUsed: Tone }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const tone: Tone = (["friendly", "professional", "hinglish", "brief"].includes(body.tone)
      ? (body.tone as Tone)
      : "friendly");

    // Fetch review + business (mock "single tenant" — demo)
    const review = await db.review.findUnique({
      where: { id: body.reviewId },
      include: { business: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Build prompt
    const { systemPrompt, userPrompt } = buildReplyPrompt({
      businessName: review.business.businessName,
      businessCategory: review.business.category,
      phoneSupport: review.business.phoneSupport,
      reviewerName: review.reviewerName,
      rating: review.rating,
      reviewText: review.reviewText || "",
      tone,
    });

    // Call LLM via z-ai-web-dev-sdk (backend only)
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "AI returned an empty reply. Please try again." }, { status: 502 });
    }

    // Bump subscription usage counter if exists
    const sub = await db.subscription.findFirst({ where: { businessId: review.businessId } });
    if (sub) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { aiRepliesUsed: { increment: 1 } },
      });
    }

    return NextResponse.json({ reply, toneUsed: tone, sentiment: review.sentiment });
  } catch (err) {
    console.error("AI generate-reply error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
