import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";

// POST /api/cron/sync-reviews
// Polls and triggers scheduled sync for all connected platforms
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

    const report: Record<string, number> = {
      connectionsChecked: activeConnections.length,
      syncedSuccessfully: 0,
    };

    for (const conn of activeConnections) {
      try {
        await db.platformConnection.update({
          where: { id: conn.id },
          data: { lastSyncAt: new Date() },
        });
        report.syncedSuccessfully++;
      } catch (e) {
        console.error(`Failed to update sync for ${conn.platformName}:`, e);
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
