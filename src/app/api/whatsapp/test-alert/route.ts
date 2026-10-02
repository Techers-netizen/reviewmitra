import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber } = body;

    const raw = phoneNumber?.replace(/\D/g, "");
    if (!raw || raw.length < 10) {
      return NextResponse.json(
        { error: "Kripya valid 10-digit mobile number enter karein" },
        { status: 400 }
      );
    }

    const cleanPhone = raw.slice(-10);

    const result = await sendWhatsAppNotification({
      toPhoneNumber: cleanPhone,
      templateType: "test_message",
      data: {},
    });

    return NextResponse.json({
      success: true,
      message: `Test alert sent successfully to +91 ${cleanPhone}.`,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("WhatsApp test alert error:", error);
    return NextResponse.json(
      { error: "Test notification send karne me samasya aayi." },
      { status: 500 }
    );
  }
}
