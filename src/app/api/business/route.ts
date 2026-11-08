import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/business - List all businesses owned by logged-in user.
//
// NOTE (2026-11-09, Step 0 dummy-data removal): this endpoint used to
// (a) auto-create "National Medical" and "New Lucky Restaurant" with fake
// "connected" Google rows (a share.google URL as externalAccountId, no
// token — the cosmetic "Connected & Active" badge), (b) hide every business
// whose name did not contain "national" or "lucky", and (c) delete rows on
// a GET (dummy-name businesses + gm_* reviews). All three are deleted.
// This endpoint now lists exactly what is in the DB: nothing is created,
// filtered or deleted here. Businesses are created only from a real Google
// Maps link via the worker sync.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const cookieBiz = req.cookies.get("rm_active_business")?.value;
    const activeBusinessId = cookieBiz || (session.user as any).businessId;

    const businesses = await db.business.findMany({
      where: { ownerId: userId },
      include: {
        connections: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const currentActiveId =
      businesses.find((b) => b.id === activeBusinessId)?.id || businesses[0]?.id;

    return NextResponse.json({
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.businessName,
        category: b.category,
        reviewsCount: b._count.reviews,
        connectionsCount: b.connections.length,
        isActive: b.id === currentActiveId,
      })),
      activeBusinessId: currentActiveId,
    });
  } catch (error: any) {
    console.error("GET /api/business error:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

// POST /api/business - Add a new business (user-provided name + optional Maps URL)
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
