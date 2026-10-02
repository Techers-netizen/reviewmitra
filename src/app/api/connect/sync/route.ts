import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";

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

      // Simulate live incoming reviews during sync
      const simulatedReviews = [
        {
          externalId: `${conn.platformName}_live_${Date.now()}`,
          reviewerName: "Neeraj Chopda",
          rating: 5,
          reviewText: "Excellent staff and quick resolution. Highly recommended to everyone!",
          reviewTimestamp: new Date(),
        },
      ];

      const res = await ingestReviews(
        business.id,
        conn.platformName as "google" | "facebook" | "justdial",
        simulatedReviews
      );
      syncSummary[conn.platformName] = res;
    }

    return NextResponse.json({
      success: true,
      lastSyncAt: new Date().toISOString(),
      summary: syncSummary,
    });
  } catch (error: any) {
    console.error("Platform sync error:", error);
    return NextResponse.json(
      { error: "Review sync failed. Kripya dobara koshish karein." },
      { status: 500 }
    );
  }
}
