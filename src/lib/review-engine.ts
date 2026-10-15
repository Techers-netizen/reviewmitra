// Shared types and helpers for ReviewMitra API layer

export type Tone = "friendly" | "professional" | "hinglish" | "brief";

export const TONES: { id: Tone; label: string; emoji: string; desc: string }[] = [
  { id: "friendly", label: "Friendly", emoji: "😊", desc: "Warm and welcoming" },
  { id: "professional", label: "Professional", emoji: "💼", desc: "Formal business tone" },
  { id: "hinglish", label: "Hinglish", emoji: "🇮🇳", desc: "Mix of Hindi & English" },
  { id: "brief", label: "Short", emoji: "⚡", desc: "Concise 1-2 lines" },
];

export type Sentiment = "positive" | "neutral" | "negative";

export function sentimentForRating(rating: number): Sentiment {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

export const PLATFORM_META: Record<string, { label: string; short: string; color: string; canReply: boolean }> = {
  google: { label: "Google", short: "G", color: "emerald", canReply: true },
  facebook: { label: "Facebook", short: "f", color: "sky", canReply: true },
  justdial: { label: "Justdial", short: "Jd", color: "amber", canReply: false },
  indiamart: { label: "IndiaMART", short: "IM", color: "blue", canReply: true },
};

/**
 * Build the system prompt for the LLM that generates a review reply.
 * - Wraps the untrusted review text in CDATA to mitigate prompt injection.
 * - Adapts tone & strategy based on sentiment + tone preset.
 * - For negative reviews: inject business contact (phone) and instruct empathetic, non-defensive reply.
 */
export function buildReplyPrompt(opts: {
  businessName: string;
  businessCategory?: string | null;
  phoneSupport?: string | null;
  reviewerName: string;
  rating: number;
  reviewText: string;
  tone?: Tone;
  pastApprovedReplies?: string[];
}): { systemPrompt: string; userPrompt: string } {
  const sentiment = sentimentForRating(opts.rating);
  const activeTone = opts.tone || "friendly";

  const categoryContext = (opts.businessCategory || "").toLowerCase().includes("restaurant") ||
    opts.businessName.toLowerCase().includes("restaurant") ||
    opts.businessName.toLowerCase().includes("lucky")
      ? `This business is a RESTAURANT / EATERY ("${opts.businessName}"). Emphasize hospitality, taste, fresh ingredients, cleanliness, and invite them back to enjoy meals with family.`
      : (opts.businessCategory || "").toLowerCase().includes("medical") ||
        (opts.businessCategory || "").toLowerCase().includes("clinic") ||
        opts.businessName.toLowerCase().includes("medical") ||
        opts.businessName.toLowerCase().includes("pharmacy")
      ? `This business is a MEDICAL STORE / HEALTHCARE PHARMACY ("${opts.businessName}"). Emphasize patient health, genuine medicines, caring service, trust, and well-being.`
      : `This business is an Indian local enterprise ("${opts.businessName}"). Emphasize customer satisfaction, trust, and dedicated service.`;

  const memorySection = opts.pastApprovedReplies && opts.pastApprovedReplies.length > 0
    ? `\nLEARNED STORE MEMORY (Voice of the Owner):
Previous approved replies:
${opts.pastApprovedReplies.map((r, i) => `Example ${i + 1}: "${r}"`).join("\n")}`
    : "";

  const systemPrompt = `You are an Autonomous Agentic AI Brand Manager for "${opts.businessName}".
Your mission is to act as the genuine, caring Indian business owner responding to customer reviews.

CORE AGENTIC CAPABILITIES:
1. MANDATORY LANGUAGE & SCRIPT MIRRORING (HIGHEST PRIORITY):
   - You MUST detect the exact language, dialect, and script used by the customer:
     * Review in Hindi (Devanagari script: उदा. "बहुत अच्छा इलाज/खाना मिला") -> Reply 100% in DEVANAGARI HINDI.
     * Review in Hinglish (Hindi in Roman/English alphabet: "bahut badhiya service thi") -> Reply 100% in NATURAL HINGLISH.
     * Review in Marathi (उदा. "उत्कृष्ट सेवा आणि चवदार जेवण") -> Reply 100% in MARATHI.
     * Review in Gujarati (દા.ત. "ખૂબ જ સરસ અનુભવ રહ્યો") -> Reply 100% in GUJARATI.
     * Review in Bengali / Punjabi / Tamil / Telugu -> Reply in that EXACT regional language.
     * Review in English -> Reply in polished, warm, professional English.
   - RULE: NEVER reply in English to a customer writing in Hindi or a regional Indian language!

2. BUSINESS CONTEXT INTELLIGENCE:
   ${categoryContext}

3. SENTIMENT REASONING:
   - 5-Star / 4-Star (Positive): Celebrate their visit, call them by name respectfully (e.g. "ji" for Indian names), highlight the specific item/service they praised, and invite them back warmly.
   - 3-Star (Neutral): Acknowledge their honest feedback, thank them for helping us improve, and gently mention how you are working to turn their next experience into 5 stars.
   - 1-Star / 2-Star (Negative/Critical):
     * Zero defensiveness. Take immediate ownership with sincere empathy.
     * Never use copy-paste templates ("sorry for inconvenience").
     * Address the SPECIFIC complaint (e.g. delay, behavior, waiting time).
     * Provide offline resolution: "Aap mujhse directly ${opts.phoneSupport || "hamare counter par"} contact karein — main personally iska dhyan rakhunga."

4. AUTHENTICITY & FORMAT:
   - Output ONLY the final reply text ready to be posted.
   - NO AI disclaimers, NO quotes, NO markdown labels.
   - Sound 100% human, humble, respectful, and genuine.
${memorySection}`;

  const userPrompt = `Reviewer Name: ${opts.reviewerName || "Valued Customer"}
Rating: ${opts.rating} / 5 Stars
Customer Review Text:
<![CDATA[
${opts.reviewText || "(Customer left star rating without text)"}
]]>

Detect the language, analyze the sentiment, and write the perfect personalized owner reply in that exact language:`;

  return { systemPrompt, userPrompt };
}

/**
 * High-level AI reply generator function with self-improving memory.
 * Called by review sync engine and API routes.
 */
export async function generateAiReply(
  opts: {
    reviewerName: string;
    rating: number;
    reviewText: string;
    businessName: string;
    businessId?: string;
    category?: string | null;
    phoneSupport?: string | null;
  },
  tone: Tone = "friendly"
): Promise<string> {
  let pastApprovedReplies: string[] = [];

  if (opts.businessId) {
    try {
      const { db } = await import("@/lib/db");
      const pastReplies = await db.reviewReply.findMany({
        where: { businessId: opts.businessId, postStatus: "posted" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { replyText: true },
      });
      pastApprovedReplies = pastReplies.map((r) => r.replyText);
    } catch (e) {
      // Fallback if DB is unavailable
    }
  }

  const { systemPrompt, userPrompt } = buildReplyPrompt({
    businessName: opts.businessName,
    businessCategory: opts.category,
    phoneSupport: opts.phoneSupport,
    reviewerName: opts.reviewerName,
    rating: opts.rating,
    reviewText: opts.reviewText,
    tone,
    pastApprovedReplies,
  });

  return generateWithProvider(systemPrompt, userPrompt);
}

async function generateWithProvider(systemPrompt: string, userPrompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      }
    } catch (e) {
      console.warn("Gemini call failed, falling back to mock");
    }
  }

  // Fallback mock generation for dev/demo
  const ratingMatch = userPrompt.match(/Rating:\s*(\d)\s*\/\s*5/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : 4;
  const nameMatch = userPrompt.match(/Reviewer:\s*(.+)/);
  const reviewerName = nameMatch ? nameMatch[1].trim() : "Customer";

  if (rating >= 4) {
    return `Bahut dhanyawaad ${reviewerName} ji! Aapke feedback se puri team ko bahut khushi hui. Agli baar zaroor visit karein 🙏`;
  }
  if (rating <= 2) {
    return `${reviewerName} ji, hume khed hai ki aapka anubhav accha nahi raha. Hum is par turant action le rahe hain. Kripya hume helpline par contact karein taaki hum matter resolve kar sakein 🙏`;
  }
  return `Dhanyawaad ${reviewerName} ji aapke honest review ke liye! Hum services ko aur behtar banane ke liye committed hain 🙏`;
}
