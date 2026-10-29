import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, password, businessName, category } = body;

    const cleanEmail = email?.toLowerCase().trim();
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: "A valid email address and password are required." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!fullName?.trim() || !businessName?.trim()) {
      return NextResponse.json(
        { error: "Both your full name and business name are required." },
        { status: 400 }
      );
    }

    const rawPhone = phone?.replace(/\D/g, "");
    const cleanPhone = rawPhone && rawPhone.length >= 10 ? rawPhone.slice(-10) : null;

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
    const verificationUrl = `${origin}/api/auth/verify-email?token=${verificationToken}`;

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { businesses: true },
    });

    if (existing) {
      // Scenario: User previously signed in with Google and now registers with Email + Password
      if (!existing.passwordHash) {
        const updatedUser = await db.user.update({
          where: { id: existing.id },
          data: {
            fullName: fullName.trim() || existing.fullName,
            phoneNumber: cleanPhone || existing.phoneNumber,
            passwordHash: hashPassword(password),
            authProvider: "both",
            verificationToken,
            verificationTokenExpiry,
          },
          include: { businesses: true },
        });

        return NextResponse.json({
          success: true,
          linkedGoogleAccount: true,
          requiresVerification: !updatedUser.emailVerified,
          userId: updatedUser.id,
          businessId: updatedUser.businesses[0]?.id,
          verificationUrl,
          message:
            "Your existing Google account has been linked with your new password.",
        });
      }

      // If existing user is still unverified, issue a fresh verification token
      if (!existing.emailVerified) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            passwordHash: hashPassword(password),
            verificationToken,
            verificationTokenExpiry,
          },
        });

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          userId: existing.id,
          businessId: existing.businesses[0]?.id,
          verificationUrl,
          message:
            "Account already exists but is awaiting email verification. We have sent a fresh verification link.",
        });
      }

      return NextResponse.json(
        { error: "This email address is already registered. Please log in to your account." },
        { status: 400 }
      );
    }

    // Create new User (emailVerified = false until verified) and initial Business
    const user = await db.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        passwordHash: hashPassword(password),
        authProvider: "email",
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
        businesses: {
          create: {
            businessName: businessName.trim(),
            category: category || "clinic",
            defaultTone: "friendly",
            matchReviewLanguage: true,
            autoReplyPositive: true,
            autoReplyNeutral: false,
            autoReplyDelay: 5,
            notifyWhatsapp: true,
            notifyWhatsappNumber: cleanPhone,
            subscriptions: {
              create: {
                planName: "nano_79",
                status: "active",
                taxExclusive: true,
                monthlyAiReplyLimit: 100,
                maxBusinesses: 1,
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
      requiresVerification: true,
      userId: user.id,
      businessId: user.businesses[0]?.id,
      verificationUrl,
      message: "Account created! Please verify your email address to activate your dashboard.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create your account. Please check your details and try again." },
      { status: 500 }
    );
  }
}
