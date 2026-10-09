import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    let business: any = null;
    if (businessId) {
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
        businessId: null,
        connections: [],
        google: { connected: false },
        facebook: { connected: false },
        justdial: { connected: false },
      });
    }

    const googleConn = business.connections.find((c: any) => c.platformName === "google");
    const fbConn = business.connections.find((c: any) => c.platformName === "facebook");
    const jdConn = business.connections.find((c: any) => c.platformName === "justdial");
    const imConn = business.connections.find((c: any) => c.platformName === "indiamart");

    return NextResponse.json({
      businessId: business.id,
      businessName: business.businessName,
      google: {
        connected: !!googleConn && googleConn.status === "connected",
        account: googleConn?.externalAccountId || null,
        lastSyncAt: googleConn?.lastSyncAt || null,
      },
      facebook: {
        connected: !!fbConn && fbConn.status === "connected",
        account: fbConn?.externalAccountId || null,
        lastSyncAt: fbConn?.lastSyncAt || null,
      },
      justdial: {
        connected: !!jdConn && jdConn.status === "connected",
        account: jdConn?.externalAccountId || null,
        lastSyncAt: jdConn?.lastSyncAt || null,
      },
      indiamart: {
        connected: !!imConn && imConn.status === "connected",
        account: imConn?.externalAccountId || null,
        lastSyncAt: imConn?.lastSyncAt || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching connection status:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform connection status" },
      { status: 500 }
    );
  }
}
