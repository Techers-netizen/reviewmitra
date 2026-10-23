import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/reviews — returns the unified review feed for the active business
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get("businessId");

    let business: any = null;
    const userId = (session?.user as any)?.id;
    const targetBizId = requestedBusinessId || (session?.user as any)?.businessId;

    if (targetBizId) {
      business = await db.business.findUnique({
        where: { id: targetBizId },
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
    }

    if (!business) {
      business = await db.business.findFirst({
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
    }

    if (!business) {
      return NextResponse.json({
        business: {
          id: "",
          name: "My Business",
          category: "clinic",
          phoneSupport: null,
          defaultTone: "friendly",
          matchReviewLanguage: true,
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
        city: business.city,
        phoneSupport: business.phoneSupport,
        defaultTone: business.defaultTone,
        matchReviewLanguage: business.matchReviewLanguage,
      },
      connections: business.connections.map((c: any) => ({
        platform: c.platformName,
        status: c.status,
        account: c.externalAccountId,
        lastSyncAt: c.lastSyncAt,
      })),
      subscription: business.subscriptions[0] || null,
      reviews: business.reviews.map((r: any) => ({
        id: r.id,
        platform: r.platformName,
        externalId: r.externalReviewId,
        reviewerName: r.reviewerName,
        reviewerAvatarUrl: r.reviewerAvatarUrl,
        customerPhone: r.customerPhone,
        rating: r.rating,
        reviewText: r.reviewText,
        detectedLanguage: r.detectedLanguage || "en",
        sentiment: r.sentiment,
        reviewTimestamp: r.reviewTimestamp,
        isReplied: r.isReplied,
        lastReply: r.replies[0]
          ? {
              text: r.replies[0].replyText,
              tone: r.replies[0].aiToneUsed,
              languageUsed: r.replies[0].languageUsed,
              createdAt: r.replies[0].createdAt,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}
