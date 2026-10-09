import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, reviewerName, rating, feedbackText, customerPhone } = body;

    if (!businessId || !rating) {
      return NextResponse.json({ error: "businessId and rating are required" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Save as internal direct QR review/feedback
    const externalId = `qr_feed_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fullText = customerPhone 
      ? `${feedbackText || "No feedback text"}\n[Customer Contact: ${customerPhone}]`
      : (feedbackText || "Private feedback submitted via in-store QR code");

    await ingestReviews(business.id, "justdial", [
      {
        externalId,
        reviewerName: reviewerName || "In-Store Customer",
        rating: Number(rating),
        reviewText: fullText,
        reviewTimestamp: new Date(),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Feedback submitted privately to management.",
    });
  } catch (error: any) {
    console.error("QR Feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
