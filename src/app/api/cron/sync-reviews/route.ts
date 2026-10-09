import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncGoogleReviewsFromApi } from "@/lib/google-business";
import { syncMetaReviewsFromApi } from "@/lib/meta-business";

// POST /api/cron/sync-reviews
// Scheduled background job to pull real incoming reviews from connected platforms
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = new URL(req.url).searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
      }
    }

    const activeConnections = await db.platformConnection.findMany({
      where: { status: "connected" },
      include: { business: true },
    });

    const report: Record<string, any> = {
      connectionsChecked: activeConnections.length,
      syncedSuccessfully: 0,
      details: [],
    };

    for (const conn of activeConnections) {
      try {
        let syncRes: any = null;
        if (conn.platformName === "google") {
          syncRes = await syncGoogleReviewsFromApi(conn.businessId);
        } else if (conn.platformName === "facebook") {
          syncRes = await syncMetaReviewsFromApi(conn.businessId);
        }

        report.syncedSuccessfully++;
        report.details.push({
          businessId: conn.businessId,
          platform: conn.platformName,
          result: syncRes,
        });
      } catch (e: any) {
        console.error(`Failed to sync reviews for ${conn.platformName} (${conn.businessId}):`, e);
        report.details.push({
          businessId: conn.businessId,
          platform: conn.platformName,
          error: e?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error: any) {
    console.error("Cron sync-reviews error:", error);
    return NextResponse.json(
      { error: "Review sync cron failed." },
      { status: 500 }
    );
  }
}
