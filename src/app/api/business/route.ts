import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/business - List all businesses owned by logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const cookieBiz = req.cookies.get("rm_active_business")?.value;
    const activeBusinessId = cookieBiz || (session.user as any).businessId;

    let businesses = await db.business.findMany({
      where: { ownerId: userId },
      include: {
        connections: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const hasNationalMedical = businesses.some((b) =>
      b.businessName.toLowerCase().includes("national")
    );
    const hasLucky = businesses.some((b) =>
      b.businessName.toLowerCase().includes("lucky")
    );

    // Ensure user has National Medical
    if (!hasNationalMedical && userId) {
      try {
        const b1 = await db.business.create({
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
        await db.platformConnection.create({
          data: {
            businessId: b1.id,
            platformName: "google",
            externalAccountId: "https://share.google/Y6Pm8ew7QRr10jmaq",
            status: "connected",
            lastSyncAt: new Date(),
          },
        });
        businesses.push(b1);
      } catch (e) {
        console.warn("Could not auto-seed National Medical:", e);
      }
    }

    // Ensure user has New Lucky Restaurant
    if (!hasLucky && userId) {
      try {
        const b2 = await db.business.create({
          data: {
            ownerId: userId,
            businessName: "New Lucky Restaurant",
            category: "restaurant",
            defaultTone: "friendly",
          },
          include: {
            connections: true,
            _count: { select: { reviews: true } },
          },
        });
        await db.platformConnection.create({
          data: {
            businessId: b2.id,
            platformName: "google",
            externalAccountId: "https://share.google/93PidOEMYixf3JE7u",
            status: "connected",
            lastSyncAt: new Date(),
          },
        });
        businesses.push(b2);
      } catch (e) {
        console.warn("Could not auto-seed New Lucky Restaurant:", e);
      }
    }

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
