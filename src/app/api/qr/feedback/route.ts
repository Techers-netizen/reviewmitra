import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestReviews } from "@/lib/sync-engine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

/**
 * GET /api/qr/feedback?businessId=...
 * Returns the real business profile, connected platforms, and direct review URLs
 * for the public In-Store QR Review Booster funnel (`/r/[businessId]`).
 */
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
      return NextResponse.json(
        { error: "Business profile not found." },
        { status: 404 }
      );
    }

    const googleConn = business.connections.find((c: any) => c.platformName === "google");
    const fbConn = business.connections.find((c: any) => c.platformName === "facebook");
    const jdConn = business.connections.find((c: any) => c.platformName === "justdial");
    const imConn = business.connections.find((c: any) => c.platformName === "indiamart");

    const googleDirectUrl =
      business.googleReviewUrl ||
      (business.googlePlaceId
        ? `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`
        : googleConn?.listingUrl) ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${business.businessName} ${business.city || ""}`.trim()
      )}`;

    const facebookDirectUrl =
      business.facebookPageUrl || fbConn?.listingUrl || null;
    const justdialDirectUrl =
      business.justdialUrl || jdConn?.listingUrl || jdConn?.externalAccountId || null;
    const indiamartDirectUrl =
      business.indiamartUrl || imConn?.listingUrl || null;

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        businessName: business.businessName,
        category: business.category || "clinic",
        city: business.city || "",
        phoneSupport: business.phoneSupport || "",
        platforms: {
          google: {
            enabled: true,
            label: "Google Maps",
            reviewUrl: googleDirectUrl,
          },
          facebook: {
            enabled: !!facebookDirectUrl,
            label: "Facebook Page",
            reviewUrl: facebookDirectUrl,
          },
          justdial: {
            enabled: !!justdialDirectUrl,
            label: "Justdial",
            reviewUrl: justdialDirectUrl,
          },
          indiamart: {
            enabled: !!indiamartDirectUrl,
            label: "IndiaMART",
            reviewUrl: indiamartDirectUrl,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/qr/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to load business QR profile." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qr/feedback
 * Handles both:
 * 1) 4-5 Star Public Review Push (records QR review in DB as `qr_direct` and returns direct platform review URL)
 * 2) 1-3 Star Private Shield Feedback (saves in DB as `qr_direct` and alerts owner on WhatsApp)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      reviewerName,
      rating,
      feedbackText,
      customerPhone,
      targetPlatform = "google",
    } = body;

    if (!rating) {
      return NextResponse.json(
        { error: "Please select a star rating between 1 and 5." },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const numRating = Math.min(5, Math.max(1, Number(rating)));
    const externalId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanPhone = customerPhone ? String(customerPhone).trim() : undefined;
    const cleanText =
      feedbackText?.trim() ||
      (numRating >= 4
        ? `Rated ${numRating} stars via In-Store QR Code (${targetPlatform.toUpperCase()})`
        : "Private feedback submitted via In-Store QR Shield");

    // Always store under platformName: "qr_direct" (never "justdial")
    await ingestReviews(business.id, "qr_direct", [
      {
        externalId,
        reviewerName: reviewerName?.trim() || "In-Store Customer",
        customerPhone: cleanPhone,
        rating: numRating,
        reviewText: cleanText,
        reviewTimestamp: new Date(),
      },
    ]);

    // If 1-3 Stars: Send instant WhatsApp alert to shop owner if configured
    if (numRating <= 3 && business.notifyWhatsapp && business.notifyWhatsappNumber) {
      try {
        await sendWhatsAppNotification({
          toPhoneNumber: business.notifyWhatsappNumber,
          templateType: "negative_alert",
          data: {
            businessName: business.businessName,
            reviewerName: reviewerName?.trim() || "In-Store Customer",
            rating: numRating,
            platform: "qr_direct",
            reviewText: `${cleanText}${cleanPhone ? ` (Customer Phone: ${cleanPhone})` : ""}`,
            draftReply: "Captured privately via In-Store QR Shield before public posting.",
          },
        });
      } catch (waErr) {
        console.warn("WhatsApp QR alert notice:", waErr);
      }
    }

    // Resolve exact target redirect URL for 4-5 star public push
    let redirectUrl =
      business.googleReviewUrl ||
      (business.googlePlaceId
        ? `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${business.businessName} ${business.city || ""}`.trim()
          )}`);

    if (targetPlatform === "facebook" && business.facebookPageUrl) {
      redirectUrl = business.facebookPageUrl;
    } else if (targetPlatform === "justdial" && business.justdialUrl) {
      redirectUrl = business.justdialUrl;
    } else if (targetPlatform === "indiamart" && business.indiamartUrl) {
      redirectUrl = business.indiamartUrl;
    }

    return NextResponse.json({
      success: true,
      platformName: "qr_direct",
      redirectUrl,
      message:
        numRating >= 4
          ? `Thank you! Redirecting to ${business.businessName} on ${targetPlatform.toUpperCase()}...`
          : "Thank you! Your feedback has been sent privately to management.",
    });
  } catch (error: any) {
    console.error("QR Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 }
    );
  }
}
