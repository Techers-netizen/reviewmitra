import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/qr/info?businessId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    let business: any = null;
    if (businessId && businessId !== "demo-business") {
      business = await db.business.findUnique({
        where: { id: businessId },
        include: { connections: true },
      });
    }

    if (!business) {
      business = await db.business.findFirst({
        include: { connections: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!business) {
      // Honest: no business exists yet. Never return a fabricated
      // "National Medical" placeholder (deleted 2026-11-09, Step 0).
      return NextResponse.json({ error: "No business found." }, { status: 404 });
    }

    const googleConn = business.connections.find((c: any) => c.platformName === "google");
    // Use only the stored review URL / connection listing URL. Never fall
    // back to hardcoded share.google links chosen by business name
    // (deleted 2026-11-09, Step 0 — the old links pointed at the wrong
    // Ahmedabad listing).
    const googleReviewUrl =
      business.googleReviewUrl || googleConn?.listingUrl || null;

    return NextResponse.json({
      businessId: business.id,
      businessName: business.businessName,
      category: business.category || "retail",
      googleReviewUrl,
      phoneSupport: business.phoneSupport,
    });
  } catch (error: any) {
    console.error("GET /api/qr/info error:", error);
    return NextResponse.json({ error: "Failed to load business details" }, { status: 500 });
  }
}
