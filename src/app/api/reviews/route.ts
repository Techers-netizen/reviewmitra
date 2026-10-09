import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/reviews — returns the unified review feed for the logged in user's business
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    let business: any = null;
    if (session?.user) {
      const userId = (session.user as any).id;
      const businessId = (session.user as any).businessId;

      if (businessId) {
        business = await db.business.findUnique({
          where: { id: businessId },
          include: {
            reviews: {
              orderBy: { reviewTimestamp: "desc" },
              include: { replies: { orderBy: { createdAt: "desc" } } },
            },
            connections: true,
            subscriptions: true,
          },
        });
      }

      if (!business && userId) {
        business = await db.business.findFirst({
          where: { ownerId: userId },
          include: {
            reviews: {
              orderBy: { reviewTimestamp: "desc" },
              include: { replies: { orderBy: { createdAt: "desc" } } },
            },
            connections: true,
            subscriptions: true,
          },
        });
      }
    }

    // If no business found, return empty zero-state for clean production
    if (!business) {
      return NextResponse.json({
        business: {
          id: "",
          name: "My Business",
          category: "clinic",
          phoneSupport: null,
          defaultTone: "friendly",
        },
        connections: [],
        subscription: null,
        reviews: [],
      });
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
