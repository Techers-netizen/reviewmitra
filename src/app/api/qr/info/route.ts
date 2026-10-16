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
      return NextResponse.json({
        businessId: "default",
        businessName: "National Medical",
        category: "clinic",
        googleReviewUrl: "https://www.google.com/search?q=National+medical",
      });
    }

    const googleConn = business.connections.find((c: any) => c.platformName === "google");
    const isLucky = business.businessName.toLowerCase().includes("lucky") || business.category === "restaurant";
    const googleReviewUrl = googleConn?.externalAccountId?.startsWith("http")
      ? googleConn.externalAccountId
      : isLucky
      ? "https://share.google/93PidOEMYixf3JE7u"
      : "https://share.google/Y6Pm8ew7QRr10jmaq";

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
