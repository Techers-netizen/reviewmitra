import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/businesses
 * Lists all businesses registered under the logged-in user's email account
 * so multi-business owners (2+ businesses on the same email) can view and switch between them.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get("businessId");

    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email?.toLowerCase().trim();

    let businesses: any[] = [];

    if (userId) {
      businesses = await db.business.findMany({
        where: { ownerId: userId },
        include: {
          connections: true,
          subscriptions: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    } else if (userEmail) {
      const user = await db.user.findUnique({
        where: { email: userEmail },
        include: {
          businesses: {
            include: {
              connections: true,
              subscriptions: true,
              _count: { select: { reviews: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      businesses = user?.businesses || [];
    } else {
      businesses = await db.business.findMany({
        take: 10,
        include: {
          connections: true,
          subscriptions: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    const activeBusiness =
      businesses.find((b) => b.id === requestedBusinessId) ||
      businesses.find((b) => b.id === (session?.user as any)?.businessId) ||
      businesses[0] ||
      null;

    return NextResponse.json({
      success: true,
      activeBusinessId: activeBusiness?.id || null,
      activeBusinessName: activeBusiness?.businessName || null,
      businesses: businesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        category: b.category || "clinic",
        city: b.city || "",
        phoneSupport: b.phoneSupport || "",
        googlePlaceId: b.googlePlaceId || null,
        googleReviewUrl: b.googleReviewUrl || null,
        facebookPageUrl: b.facebookPageUrl || null,
        justdialUrl: b.justdialUrl || null,
        indiamartUrl: b.indiamartUrl || null,
        reviewsCount: b._count?.reviews || 0,
        connectedPlatforms: b.connections
          .filter((c: any) => c.status === "connected")
          .map((c: any) => c.platformName),
        planName: b.subscriptions?.[0]?.planName || "nano_79",
      })),
    });
  } catch (error: any) {
    console.error("GET /api/businesses error:", error);
    return NextResponse.json(
      { error: "Failed to load business profiles." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/businesses
 * Creates an additional business profile under the same email account or switches the active business.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { action = "create", businessId, businessName, category = "clinic", city = "", phoneSupport = "", googleMapsUrl = "" } = body;

    let userId = (session?.user as any)?.id;
    if (!userId && session?.user?.email) {
      const u = await db.user.findUnique({ where: { email: session.user.email.toLowerCase().trim() } });
      userId = u?.id;
    }
    if (!userId) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
      userId = firstUser?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to manage your business locations." },
        { status: 401 }
      );
    }

    if (action === "switch" && businessId) {
      const target = await db.business.findFirst({
        where: { id: businessId, ownerId: userId },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Selected business location was not found on your account." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        activeBusinessId: target.id,
        activeBusinessName: target.businessName,
        message: `Switched active business to ${target.businessName}.`,
      });
    }

    if (!businessName || !String(businessName).trim()) {
      return NextResponse.json(
        { error: "Please enter a valid business name." },
        { status: 400 }
      );
    }

    const cleanName = String(businessName).trim();

    const newBusiness = await db.business.create({
      data: {
        ownerId: userId,
        businessName: cleanName,
        category: String(category || "clinic"),
        city: city ? String(city).trim() : null,
        phoneSupport: phoneSupport ? String(phoneSupport).trim() : null,
        googleReviewUrl: googleMapsUrl ? String(googleMapsUrl).trim() : null,
        defaultTone: "friendly",
        matchReviewLanguage: true,
        autoReplyPositive: true,
        notifyWhatsapp: true,
        subscriptions: {
          create: {
            planName: "growth_249",
            status: "active",
            taxExclusive: true,
            monthlyAiReplyLimit: 1000,
            maxBusinesses: 2,
            aiRepliesUsed: 0,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        id: newBusiness.id,
        businessName: newBusiness.businessName,
        category: newBusiness.category,
        city: newBusiness.city,
      },
      message: `Business location "${newBusiness.businessName}" added to your account successfully.`,
    });
  } catch (error: any) {
    console.error("POST /api/businesses error:", error);
    return NextResponse.json(
      { error: "Failed to save business location." },
      { status: 500 }
    );
  }
}
