import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";
import { scrapeJustdialReviews } from "@/lib/justdial-scraper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, url } = body;

    const cleanUrl = typeof url === "string" ? url.trim() : "";
    if (!cleanUrl || (!cleanUrl.toLowerCase().includes("justdial.com") && !cleanUrl.toLowerCase().includes("jsdl.in"))) {
      return NextResponse.json(
        { error: "Please enter a valid Justdial listing URL (e.g., https://www.justdial.com/... or https://jsdl.in/...)" },
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

    // Run scraper on the provided URL
    const scrapeResult = await scrapeJustdialReviews(url);

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

    // Ingest any scraped reviews
    if (scrapeResult.reviews.length > 0) {
      await ingestReviews(business.id, "justdial", scrapeResult.reviews);
    }

    return NextResponse.json({
      success: true,
      message: `Justdial listing connected! ${scrapeResult.reviews.length} public reviews imported.`,
      connectionId: connection.id,
      reviewsImported: scrapeResult.reviews.length,
    });
  } catch (error: any) {
    console.error("Justdial connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Justdial listing. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
