import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/business/switch - Switch the active business
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const business = await db.business.findFirst({
      where: { id: businessId, ownerId: userId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found or access denied" }, { status: 404 });
    }

    // Set cookie or return confirmation so client can refresh session
    const response = NextResponse.json({
      success: true,
      activeBusinessId: business.id,
      businessName: business.businessName,
    });

    response.cookies.set("rm_active_business", business.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/business/switch error:", error);
    return NextResponse.json({ error: "Failed to switch business" }, { status: 500 });
  }
}
