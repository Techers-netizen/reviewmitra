import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scrapePublicFacebookPageReviews } from "@/lib/meta-business";
import { ingestReviews } from "@/lib/sync-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get("businessId") || (session?.user as any)?.businessId;
    const userId = (session?.user as any)?.id;

    let business: any = null;
    if (requestedBusinessId) {
      business = await db.business.findUnique({
        where: { id: requestedBusinessId },
        include: { connections: true },
      });
    }

    if (!business && userId) {
      business = await db.business.findFirst({
        where: { ownerId: userId },
        include: { connections: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!business) {
      business = await db.business.findFirst({
        include: { connections: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!business) {
      return NextResponse.json({
        businessId: null,
        businessName: "My Business",
        businesses: [],
        connections: [],
        google: { connected: false, account: null, lastSyncAt: null },
        facebook: { connected: false, account: null, lastSyncAt: null },
        justdial: { connected: false, account: null, lastSyncAt: null },
        indiamart: { connected: false, account: null, lastSyncAt: null },
      });
    }

    const allUserBusinesses = await db.business.findMany({
      where: { ownerId: business.ownerId },
      select: { id: true, businessName: true, category: true, city: true },
      orderBy: { createdAt: "asc" },
    });

    const googleConn = business.connections.find((c: any) => c.platformName === "google");
    const fbConn = business.connections.find((c: any) => c.platformName === "facebook");
    const jdConn = business.connections.find((c: any) => c.platformName === "justdial");
    const imConn = business.connections.find((c: any) => c.platformName === "indiamart");

    return NextResponse.json({
      businessId: business.id,
      businessName: business.businessName,
      category: business.category || "clinic",
      city: business.city || "",
      phoneSupport: business.phoneSupport || "",
      googlePlaceId: business.googlePlaceId || null,
      googleReviewUrl: business.googleReviewUrl || googleConn?.listingUrl || null,
      facebookPageUrl: business.facebookPageUrl || fbConn?.listingUrl || null,
      justdialUrl: business.justdialUrl || jdConn?.listingUrl || jdConn?.externalAccountId || null,
      indiamartUrl: business.indiamartUrl || imConn?.listingUrl || null,
      indiamartMobile: business.indiamartMobile || null,
      indiamartEmail: business.indiamartEmail || null,
      businesses: allUserBusinesses,
      google: {
        connected: !!googleConn && googleConn.status === "connected",
        account: googleConn?.externalAccountId || null,
        lastSyncAt: googleConn?.lastSyncAt || null,
      },
      facebook: {
        connected: !!fbConn && fbConn.status === "connected",
        account: fbConn?.externalAccountId || null,
        lastSyncAt: fbConn?.lastSyncAt || null,
      },
      justdial: {
        connected: !!jdConn && jdConn.status === "connected",
        account: jdConn?.externalAccountId || null,
        lastSyncAt: jdConn?.lastSyncAt || null,
      },
      indiamart: {
        connected: !!imConn && imConn.status === "connected",
        account: imConn?.externalAccountId || null,
        lastSyncAt: imConn?.lastSyncAt || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching connection status:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform connection status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connect/status
 * Saves Direct Facebook Page URL or updates Direct QR Review Platform URLs for a business.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const {
      businessId,
      platformName,
      facebookPageUrl,
      googleReviewUrl,
      googlePlaceId,
      justdialUrl,
      indiamartUrl,
    } = body;

    let business: any = null;
    const targetId = businessId || (session?.user as any)?.businessId;
    if (targetId) {
      business = await db.business.findUnique({ where: { id: targetId } });
    }
    if (!business && (session?.user as any)?.id) {
      business = await db.business.findFirst({
        where: { ownerId: (session?.user as any).id },
        orderBy: { createdAt: "asc" },
      });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.json({ error: "Business account not found." }, { status: 404 });
    }

    // Direct Facebook Page Public URL connection (No OAuth token required)
    if (platformName === "facebook" && facebookPageUrl) {
      const cleanFbUrl = String(facebookPageUrl).trim();
      if (!cleanFbUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "Please enter a valid Facebook Page URL starting with https://." },
          { status: 400 }
        );
      }

      const scraped = await scrapePublicFacebookPageReviews(cleanFbUrl);
      const label = scraped.pageName ? `${scraped.pageName} (${cleanFbUrl})` : cleanFbUrl;

      await db.business.update({
        where: { id: business.id },
        data: { facebookPageUrl: cleanFbUrl },
      });

      await db.platformConnection.upsert({
        where: {
          businessId_platformName: {
            businessId: business.id,
            platformName: "facebook",
          },
        },
        update: {
          externalAccountId: label,
          listingUrl: cleanFbUrl,
          status: "connected",
          lastSyncAt: new Date(),
        },
        create: {
          businessId: business.id,
          platformName: "facebook",
          externalAccountId: label,
          listingUrl: cleanFbUrl,
          status: "connected",
          lastSyncAt: new Date(),
        },
      });

      let imported = 0;
      if (scraped.reviews.length > 0) {
        const res = await ingestReviews(business.id, "facebook", scraped.reviews);
        imported = res.inserted;
      }

      return NextResponse.json({
        success: true,
        reviewsImported: imported,
        message:
          imported > 0
            ? `Facebook Page connected! ${imported} public recommendations synced.`
            : "Facebook Page URL connected successfully!",
      });
    }

    // Update direct review URLs for Smart QR Booster
    const updated = await db.business.update({
      where: { id: business.id },
      data: {
        googlePlaceId: googlePlaceId !== undefined ? (googlePlaceId ? String(googlePlaceId).trim() : null) : business.googlePlaceId,
        googleReviewUrl:
          googleReviewUrl !== undefined
            ? googleReviewUrl
              ? String(googleReviewUrl).trim()
              : null
            : googlePlaceId
            ? `https://search.google.com/local/writereview?placeid=${String(googlePlaceId).trim()}`
            : business.googleReviewUrl,
        facebookPageUrl: facebookPageUrl !== undefined ? (facebookPageUrl ? String(facebookPageUrl).trim() : null) : business.facebookPageUrl,
        justdialUrl: justdialUrl !== undefined ? (justdialUrl ? String(justdialUrl).trim() : null) : business.justdialUrl,
        indiamartUrl: indiamartUrl !== undefined ? (indiamartUrl ? String(indiamartUrl).trim() : null) : business.indiamartUrl,
      },
    });

    return NextResponse.json({
      success: true,
      business: updated,
      message: "Direct platform review links saved successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/connect/status error:", error);
    return NextResponse.json(
      { error: "Failed to update platform configuration." },
      { status: 500 }
    );
  }
}
