import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/business - List all businesses owned by logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const activeBusinessId = (session.user as any).businessId;

    let businesses = await db.business.findMany({
      where: { ownerId: userId },
      include: {
        connections: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // If user has 0 businesses, check if user exists or create default
    if (businesses.length === 0 && userId) {
      const defaultBiz = await db.business.create({
        data: {
          ownerId: userId,
          businessName: "National Medical",
          category: "clinic",
          defaultTone: "friendly",
        },
        include: {
          connections: true,
          _count: { select: { reviews: true } },
        },
      });
      businesses = [defaultBiz];
    }

    return NextResponse.json({
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.businessName,
        category: b.category,
        reviewsCount: b._count.reviews,
        connectionsCount: b.connections.length,
        isActive: b.id === activeBusinessId || businesses[0]?.id === b.id,
      })),
      activeBusinessId: activeBusinessId || businesses[0]?.id,
    });
  } catch (error: any) {
    console.error("GET /api/business error:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

// POST /api/business - Add a new business (e.g. New Lucky Restaurant or National Medical)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { businessName, category, googleMapsUrl } = body;

    if (!businessName?.trim()) {
      return NextResponse.json({ error: "Business name zaroori hai" }, { status: 400 });
    }

    const newBusiness = await db.business.create({
      data: {
        ownerId: userId,
        businessName: businessName.trim(),
        category: category || "restaurant",
        defaultTone: "friendly",
        phoneSupport: null,
      },
    });

    // If Google Maps URL was provided, link Google connection
    if (googleMapsUrl?.trim()) {
      await db.platformConnection.create({
        data: {
          businessId: newBusiness.id,
          platformName: "google",
          externalAccountId: googleMapsUrl.trim(),
          status: "connected",
          lastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      business: newBusiness,
    });
  } catch (error: any) {
    console.error("POST /api/business error:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}
