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
    const googleReviewUrl = googleConn?.externalAccountId?.startsWith("http")
      ? googleConn.externalAccountId
      : business.businessName.toLowerCase().includes("lucky")
      ? "https://www.google.com/search?q=New%20Lucky%20Restaurant&shem=epsd1%2Cesd2e%2Crimspwouoe%2Csdpie&source=sh%2Fx%2Fpage%2Fhdr%2Fm1%2F1&kgs=96a0fb19d327742f"
      : "https://www.google.com/search?q=National%20medical&shem=epsd1%2Cesd2e%2Crimspwouoe%2Csdpie&source=sh%2Fx%2Fpage%2Fhdr%2Fm1%2F1&kgs=e5dee88ce33cc248";

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
