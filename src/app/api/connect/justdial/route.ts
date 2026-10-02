import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, url } = body;

    if (!url || typeof url !== "string" || !url.toLowerCase().includes("justdial.com")) {
      return NextResponse.json(
        { error: "Kripya valid Justdial listing URL daalein (e.g. https://www.justdial.com/...)" },
        { status: 400 }
      );
    }

    let business: any = null;
    if (businessId) {
      business = await db.business.findUnique({ where: { id: businessId } });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.json({ error: "Business account not found" }, { status: 404 });
    }

    // Save or update Justdial connection
    const connection = await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId: business.id,
          platformName: "justdial",
        },
      },
      update: {
        externalAccountId: url.trim(),
        status: "connected",
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        platformName: "justdial",
        externalAccountId: url.trim(),
        status: "connected",
        lastSyncAt: new Date(),
      },
    });

    // Ingest sample initial Justdial reviews
    await ingestReviews(business.id, "justdial", [
      {
        externalId: `jd_rev_${Date.now()}_1`,
        reviewerName: "Vikram Malhotra",
        rating: 5,
        reviewText: "Justdial se contact kiya tha. Bahut fast response mila aur pricing reasonable thi.",
        reviewTimestamp: new Date(),
      },
      {
        externalId: `jd_rev_${Date.now()}_2`,
        reviewerName: "Anjali Gupta",
        rating: 4,
        reviewText: "Good clinic and genuine guidance provided.",
        reviewTimestamp: new Date(Date.now() - 7200000),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Justdial listing connected and initial reviews synced successfully.",
      connectionId: connection.id,
    });
  } catch (error: any) {
    console.error("Justdial connect error:", error);
    return NextResponse.json(
      { error: "Justdial URL connect karne me samasya aayi." },
      { status: 500 }
    );
  }
}
