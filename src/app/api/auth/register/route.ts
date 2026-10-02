import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, password, businessName, category } = body;

    const rawPhone = phone?.replace(/\D/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { error: "Kripya 10-digit mobile number enter karein" },
        { status: 400 }
      );
    }
    const cleanPhone = rawPhone.slice(-10);

    if (!fullName || !businessName) {
      return NextResponse.json(
        { error: "Full name aur business name dono zaroori hain" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Yeh mobile number already registered hai. Kripya login karein." },
        { status: 400 }
      );
    }

    // Create user and initial business
    const user = await db.user.create({
      data: {
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        email: email?.trim() || null,
        passwordHash: password || "otp-login",
        businesses: {
          create: {
            businessName: businessName.trim(),
            category: category || "clinic",
            defaultTone: "friendly",
            autoReplyPositive: false,
            autoReplyNeutral: false,
            autoReplyDelay: 5,
            notifyWhatsapp: true,
            notifyWhatsappNumber: cleanPhone,
            subscriptions: {
              create: {
                planName: "starter_499",
                status: "active",
                monthlyAiReplyLimit: 100,
                aiRepliesUsed: 0,
              },
            },
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      businessId: user.businesses[0]?.id,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Account create karne me samasya aayi. Kripya dobara try karein." },
      { status: 500 }
    );
  }
}
