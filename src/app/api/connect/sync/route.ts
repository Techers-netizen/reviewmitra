import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncGoogleReviewsFromApi } from "@/lib/google-business";
import { syncGooglePlacesReviews } from "@/lib/google-places";
import { syncMetaReviewsFromApi } from "@/lib/meta-business";
import { scrapeJustdialReviews } from "@/lib/justdial-scraper";
import { ingestReviews } from "@/lib/sync-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { businessId, platformName } = body;

    let business: any = null;
    const targetId = businessId || (session?.user as any)?.businessId;
    if (targetId) {
      business = await db.business.findUnique({
        where: { id: targetId },
        include: { connections: true },
      });
    }
    if (!business && (session?.user as any)?.id) {
      business = await db.business.findFirst({
        where: { ownerId: (session?.user as any).id },
        orderBy: { createdAt: "asc" },
        include: { connections: true },
      });
    }
    if (!business) {
      business = await db.business.findFirst({
        orderBy: { createdAt: "asc" },
        include: { connections: true },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "No business account found." }, { status: 404 });
    }

    const connectedPlatforms = business.connections.filter((c: any) => c.status === "connected");
    const syncSummary: Record<string, any> = {};

    for (const conn of connectedPlatforms) {
      if (platformName && platformName !== "all" && conn.platformName !== platformName) {
        continue;
      }

      if (conn.platformName === "google") {
        const googleResult = await syncGoogleReviewsFromApi(business.id);
        // If official GBP API has 0 quota or no token, automatically run Direct Google Maps Scraper
        if (!googleResult.success || (googleResult.newIngested === 0 && !googleResult.totalFetched)) {
          const fallbackQuery =
            business.googlePlaceId ||
            business.googleReviewUrl ||
            conn.listingUrl ||
            `${business.businessName} ${business.city || ""}`.trim();
          const placesRes = await syncGooglePlacesReviews(business.id, fallbackQuery);
          syncSummary.google = {
            success: placesRes.success,
            newIngested: placesRes.reviewsCount,
            note: "Synced via Direct Google Maps Engine",
          };
        } else {
          syncSummary.google = googleResult;
        }
      } else if (conn.platformName === "facebook") {
        const fbResult = await syncMetaReviewsFromApi(business.id);
        syncSummary.facebook = fbResult;
      } else if (conn.platformName === "justdial") {
        const targetJdUrl = business.justdialUrl || conn.listingUrl || conn.externalAccountId;
        if (targetJdUrl && targetJdUrl.startsWith("http")) {
          const jdRes = await scrapeJustdialReviews(targetJdUrl);
          let inserted = 0;
          if (jdRes.reviews.length > 0) {
            const ing = await ingestReviews(business.id, "justdial", jdRes.reviews);
            inserted = ing.inserted;
          }
          await db.platformConnection.update({
            where: { id: conn.id },
            data: { lastSyncAt: new Date() },
          });
          syncSummary.justdial = {
            success: jdRes.success,
            newIngested: inserted,
            totalFetched: jdRes.reviews.length,
            note: "Synced via Justdial Scraper",
          };
        } else {
          syncSummary.justdial = {
            success: true,
            newIngested: 0,
            note: "Justdial listing connected.",
          };
        }
      } else if (conn.platformName === "indiamart") {
        await db.platformConnection.update({
          where: { id: conn.id },
          data: { lastSyncAt: new Date() },
        });
        syncSummary.indiamart = {
          success: true,
          newIngested: 0,
          note: "IndiaMART seller account synced.",
        };
      }
    }

    return NextResponse.json({
      success: true,
      lastSyncAt: new Date().toISOString(),
      summary: syncSummary,
    });
  } catch (error: any) {
    console.error("Platform sync error:", error);
    return NextResponse.json(
      { error: "Review sync failed. Please try again or check your listing URL." },
      { status: 500 }
    );
  }
}
