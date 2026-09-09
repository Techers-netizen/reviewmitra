import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews — returns the unified review feed for the demo business
export async function GET() {
  try {
    const business = await db.business.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        reviews: {
          orderBy: { reviewTimestamp: "desc" },
          include: { replies: { orderBy: { createdAt: "desc" } } },
        },
        connections: true,
        subscriptions: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "No demo business seeded" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.businessName,
        category: business.category,
        phoneSupport: business.phoneSupport,
        defaultTone: business.defaultTone,
      },
      connections: business.connections.map((c) => ({
        platform: c.platformName,
        status: c.status,
        lastSyncAt: c.lastSyncAt,
      })),
      subscription: business.subscriptions[0] || null,
      reviews: business.reviews.map((r) => ({
        id: r.id,
        platform: r.platformName,
        externalId: r.externalReviewId,
        reviewerName: r.reviewerName,
        reviewerAvatarUrl: r.reviewerAvatarUrl,
        rating: r.rating,
        reviewText: r.reviewText,
        sentiment: r.sentiment,
        reviewTimestamp: r.reviewTimestamp,
        isReplied: r.isReplied,
        lastReply: r.replies[0]
          ? { text: r.replies[0].replyText, tone: r.replies[0].aiToneUsed, createdAt: r.replies[0].createdAt }
          : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
