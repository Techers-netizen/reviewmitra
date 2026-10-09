import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncGooglePlacesReviews } from "@/lib/google-places";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let businessId = (session?.user as any)?.businessId;
    const userId = (session?.user as any)?.id;

    if (!businessId && userId) {
      const userBiz = await db.business.findFirst({
        where: { ownerId: userId },
      });
      businessId = userBiz?.id;
    }

    if (!businessId) {
      // Fallback: look up the most recent business created
      const recentBiz = await db.business.findFirst({
        orderBy: { createdAt: "desc" },
      });
      businessId = recentBiz?.id;
    }

    if (!businessId) {
      return NextResponse.json({ error: "No active business found to sync" }, { status: 404 });
    }

    const body = await req.json();
    const input = body.googleMapsUrl || body.query || "";

    const result = await syncGooglePlacesReviews(businessId, input);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to sync reviews" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reviewsCount: result.reviewsCount,
      placeName: result.placeName,
      rating: result.rating,
      message: `${result.reviewsCount} Google reviews successfully synced!`,
    });
  } catch (error: any) {
    console.error("POST /api/connect/google/places-sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during Google Places sync" },
      { status: 500 }
    );
  }
}
