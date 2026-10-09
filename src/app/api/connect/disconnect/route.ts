import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platformName, businessId } = body;

    if (!platformName) {
      return NextResponse.json({ error: "platformName is required" }, { status: 400 });
    }

    let business: any = null;
    if (businessId) {
      business = await db.business.findUnique({ where: { id: businessId } });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Delete or mark disconnected
    await db.platformConnection.deleteMany({
      where: {
        businessId: business.id,
        platformName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${platformName} has been disconnected and tokens purged.`,
    });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect platform" },
      { status: 500 }
    );
  }
}
