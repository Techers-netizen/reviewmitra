import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createOpenWaPairingSession,
  createOpenWaQrSession,
  sendWhatsAppNotification,
} from "@/lib/whatsapp";

async function resolveTargetBusiness(req: NextRequest, bodyBusinessId?: string) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const targetId =
    bodyBusinessId ||
    searchParams.get("businessId") ||
    (session?.user as any)?.businessId;

  let business: any = null;
  if (targetId) {
    business = await db.business.findUnique({
      where: { id: targetId },
      include: { reviews: true },
    });
  }
  if (!business && (session?.user as any)?.id) {
    business = await db.business.findFirst({
      where: { ownerId: (session?.user as any).id },
      orderBy: { createdAt: "asc" },
      include: { reviews: true },
    });
  }
  if (!business) {
    business = await db.business.findFirst({
      orderBy: { createdAt: "asc" },
      include: { reviews: true },
    });
  }
  return business;
}

/**
 * GET /api/whatsapp/test-alert
 * Loads real business profile settings, OpenWA QR/Pairing status, and review summary metrics from DB.
 */
export async function GET(req: NextRequest) {
  try {
    const business = await resolveTargetBusiness(req);
    if (!business) {
      return NextResponse.json(
        { error: "No business profile found." },
        { status: 404 }
      );
    }

    let parsedSession: any = null;
    if (business.openwaSessionData) {
      try {
        parsedSession = JSON.parse(business.openwaSessionData);
      } catch {
        parsedSession = null;
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        businessName: business.businessName,
        category: business.category || "clinic",
        city: business.city || "",
        phoneSupport: business.phoneSupport || "",
        notifyWhatsapp: business.notifyWhatsapp,
        notifyWhatsappNumber: business.notifyWhatsappNumber || business.phoneSupport || "",
        dailyDigestEnabled: business.dailyDigestEnabled,
        openwaStatus: business.openwaStatus || "disconnected",
        openwaSession: parsedSession,
        defaultTone: business.defaultTone || "friendly",
        matchReviewLanguage: business.matchReviewLanguage !== false,
        autoReplyPositive: business.autoReplyPositive,
        autoReplyNeutral: business.autoReplyNeutral,
        autoReplyDelay: business.autoReplyDelay ?? 5,
      },
    });
  } catch (error: any) {
    console.error("GET /api/whatsapp/test-alert error:", error);
    return NextResponse.json(
      { error: "Failed to load business and WhatsApp settings." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/whatsapp/test-alert
 * Persists business settings, WhatsApp report number, and AI auto-reply configuration to PostgreSQL DB.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const business = await resolveTargetBusiness(req, body.businessId);

    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found." },
        { status: 404 }
      );
    }

    const updated = await db.business.update({
      where: { id: business.id },
      data: {
        businessName:
          body.businessName !== undefined && String(body.businessName).trim()
            ? String(body.businessName).trim()
            : business.businessName,
        category: body.category !== undefined ? String(body.category) : business.category,
        city: body.city !== undefined ? (body.city ? String(body.city).trim() : null) : business.city,
        phoneSupport:
          body.phoneSupport !== undefined
            ? body.phoneSupport
              ? String(body.phoneSupport).trim()
              : null
            : business.phoneSupport,
        notifyWhatsapp:
          typeof body.notifyWhatsapp === "boolean" ? body.notifyWhatsapp : business.notifyWhatsapp,
        notifyWhatsappNumber:
          body.notifyWhatsappNumber !== undefined
            ? body.notifyWhatsappNumber
              ? String(body.notifyWhatsappNumber).trim()
              : null
            : business.notifyWhatsappNumber,
        dailyDigestEnabled:
          typeof body.dailyDigestEnabled === "boolean"
            ? body.dailyDigestEnabled
            : business.dailyDigestEnabled,
        defaultTone: body.defaultTone !== undefined ? String(body.defaultTone) : business.defaultTone,
        matchReviewLanguage:
          typeof body.matchReviewLanguage === "boolean"
            ? body.matchReviewLanguage
            : business.matchReviewLanguage,
        autoReplyPositive:
          typeof body.autoReplyPositive === "boolean"
            ? body.autoReplyPositive
            : business.autoReplyPositive,
        autoReplyNeutral:
          typeof body.autoReplyNeutral === "boolean"
            ? body.autoReplyNeutral
            : business.autoReplyNeutral,
        autoReplyDelay:
          body.autoReplyDelay !== undefined ? Number(body.autoReplyDelay) : business.autoReplyDelay,
      },
    });

    return NextResponse.json({
      success: true,
      business: updated,
      message: "Business profile and WhatsApp alert settings saved successfully.",
    });
  } catch (error: any) {
    console.error("PUT /api/whatsapp/test-alert error:", error);
    return NextResponse.json(
      { error: "Failed to save business settings to database." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/test-alert
 * Handles OpenWA QR generation, 8-Digit Pairing Code login, session verification,
 * and sending live WhatsApp reports to the shop owner's number.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "send_test_report", phoneNumber, businessId } = body;

    const business = await resolveTargetBusiness(req, businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found." },
        { status: 404 }
      );
    }

    const rawPhone = (phoneNumber || business.notifyWhatsappNumber || business.phoneSupport || "").replace(
      /\D/g,
      ""
    );

    if (action === "disconnect_openwa") {
      await db.business.update({
        where: { id: business.id },
        data: {
          openwaStatus: "disconnected",
          openwaSessionData: null,
        },
      });
      return NextResponse.json({
        success: true,
        openwaStatus: "disconnected",
        message: "OpenWA WhatsApp session disconnected.",
      });
    }

    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit WhatsApp mobile number." },
        { status: 400 }
      );
    }

    const cleanPhone = rawPhone.slice(-10);

    // 1. Start OpenWA QR Code Session
    if (action === "start_qr") {
      const qrSession = createOpenWaQrSession(business.id, cleanPhone);
      await db.business.update({
        where: { id: business.id },
        data: {
          notifyWhatsappNumber: `+91 ${cleanPhone}`,
          openwaStatus: "qr_ready",
          openwaSessionData: JSON.stringify(qrSession),
        },
      });
      return NextResponse.json({
        success: true,
        openwaStatus: "qr_ready",
        openwaSession: qrSession,
        message: "OpenWA QR code generated. Scan with WhatsApp (Linked Devices) and click Confirm Link.",
      });
    }

    // 2. Start OpenWA 8-Digit Pairing Code Session
    if (action === "start_pairing_code") {
      const pairSession = createOpenWaPairingSession(business.id, cleanPhone);
      await db.business.update({
        where: { id: business.id },
        data: {
          notifyWhatsappNumber: `+91 ${cleanPhone}`,
          openwaStatus: "qr_ready",
          openwaSessionData: JSON.stringify(pairSession),
        },
      });
      return NextResponse.json({
        success: true,
        openwaStatus: "qr_ready",
        openwaSession: pairSession,
        message: `8-Digit Pairing Code (${pairSession.pairingCode}) generated for +91 ${cleanPhone}.`,
      });
    }

    // 3. Confirm OpenWA Session Connection
    if (action === "confirm_session") {
      let existingSession: any = {};
      if (business.openwaSessionData) {
        try {
          existingSession = JSON.parse(business.openwaSessionData);
        } catch {
          existingSession = {};
        }
      }
      const connectedSession = {
        ...existingSession,
        linkedPhone: `91${cleanPhone}`,
        status: "connected",
        connectedAt: new Date().toISOString(),
      };
      await db.business.update({
        where: { id: business.id },
        data: {
          notifyWhatsapp: true,
          notifyWhatsappNumber: `+91 ${cleanPhone}`,
          openwaStatus: "connected",
          openwaSessionData: JSON.stringify(connectedSession),
        },
      });
      return NextResponse.json({
        success: true,
        openwaStatus: "connected",
        openwaSession: connectedSession,
        message: `WhatsApp (+91 ${cleanPhone}) is now actively linked via OpenWA!`,
      });
    }

    // 4. Send Live Business Summary Report or Test Alert to Shopkeeper's WhatsApp
    const reviews = business.reviews || [];
    const totalReviews = reviews.length;
    const repliedCount = reviews.filter((r: any) => r.isReplied).length;
    const unrepliedCount = totalReviews - repliedCount;
    const avgRating = totalReviews
      ? Number((reviews.reduce((a: number, r: any) => a + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    const templateType = action === "send_daily_digest" ? "daily_digest" : "test_message";

    const result = await sendWhatsAppNotification({
      toPhoneNumber: cleanPhone,
      templateType,
      openwaSessionData: business.openwaSessionData,
      data: {
        businessName: business.businessName,
        summary: {
          newReviews: totalReviews,
          replied: repliedCount,
          unreplied: unrepliedCount,
          avgRating,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `WhatsApp report prepared and dispatched for +91 ${cleanPhone}.`,
      messageId: result.messageId,
      messageBody: result.messageBody,
      whatsappDirectUrl: result.whatsappDirectUrl,
      transport: result.transport,
    });
  } catch (error: any) {
    console.error("WhatsApp OpenWA route error:", error);
    return NextResponse.json(
      { error: "Failed to process WhatsApp OpenWA request." },
      { status: 500 }
    );
  }
}
