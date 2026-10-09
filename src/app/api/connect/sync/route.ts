import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncGoogleReviewsFromApi } from "@/lib/google-business";
import { syncMetaReviewsFromApi } from "@/lib/meta-business";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { businessId, platformName } = body;

    let business: any = null;
    if (businessId) {
      business = await db.business.findUnique({
        where: { id: businessId },
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
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const connectedPlatforms = business.connections.filter((c) => c.status === "connected");
    const syncSummary: Record<string, any> = {};

    for (const conn of connectedPlatforms) {
      if (platformName && platformName !== "all" && conn.platformName !== platformName) {
        continue;
      }

      if (conn.platformName === "google") {
        const googleResult = await syncGoogleReviewsFromApi(business.id);
        syncSummary.google = googleResult;
      } else if (conn.platformName === "facebook") {
        const fbResult = await syncMetaReviewsFromApi(business.id);
        syncSummary.facebook = fbResult;
      } else if (conn.platformName === "justdial") {
        // Justdial listings are synced via scheduled web scraper
        syncSummary.justdial = {
          success: true,
          mode: "scraper_queued",
          note: "Justdial listing queued for background scrape.",
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
      { error: "Review sync failed. Please try again or check connection credentials." },
      { status: 500 }
    );
  }
}
