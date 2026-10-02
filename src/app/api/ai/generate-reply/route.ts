import { NextRequest, NextResponse } from "next/server";
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

    // Call AI provider — configurable via environment
    const reply = await generateWithProvider(systemPrompt, userPrompt);

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

/**
 * Multi-provider AI generation.
 * Priority: GEMINI_API_KEY → OPENAI_API_KEY → MockProvider (for dev/demo)
 */
async function generateWithProvider(systemPrompt: string, userPrompt: string): Promise<string> {
  // 1. Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return generateWithGemini(geminiKey, systemPrompt, userPrompt);
  }

  // 2. Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return generateWithOpenAI(openaiKey, systemPrompt, userPrompt);
  }

  // 3. Fallback: Mock provider for dev/demo
  console.warn("No AI API key found — using mock reply provider");
  return generateMockReply(userPrompt);
}

async function generateWithGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function generateWithOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

function generateMockReply(userPrompt: string): string {
  // Parse rating from the prompt to generate sentiment-appropriate reply
  const ratingMatch = userPrompt.match(/Rating:\s*(\d)\s*\/\s*5/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;
  const nameMatch = userPrompt.match(/Reviewer:\s*(.+)/);
  const reviewerName = nameMatch ? nameMatch[1].trim() : "Customer";

  if (rating >= 4) {
    return `Bahut dhanyawaad ${reviewerName} ji! Aapke kind words hamare pure team ko motivate karte hain. Hum hamesha best service dene ki koshish karte hain. Phir se zaroor aayein — aapka swagat hai 🙏`;
  }
  if (rating <= 2) {
    return `${reviewerName} ji, hum samajh sakte hain ki aapko takleef hui. Yeh bilkul unacceptable hai aur maine personally is matter ko dekha hai. Aap mujhe directly +919876543210 pe call karein — main personally ensure karunga ki aapka agla experience perfect ho. Maafi chahte hain 🙏`;
  }
  return `Dhanyawaad ${reviewerName} ji aapke feedback ke liye! Aapne jo points mention kiye hain unpe hum kaam kar rahe hain. Aapka agla visit aur bhi better hoga — promise! 🙏`;
}
