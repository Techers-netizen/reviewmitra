import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/**
 * GET /api/auth/verify-email?token=...
 * Verifies a user's email address via token link and redirects to /login?verified=true
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=Invalid+verification+link", req.url));
    }

    const user = await db.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Verification+link+is+invalid+or+already+used", req.url)
      );
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return NextResponse.redirect(
        new URL("/login?error=Verification+link+has+expired.+Please+resend+verification+email.", req.url)
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("GET /api/auth/verify-email error:", error);
    return NextResponse.redirect(new URL("/login?error=Failed+to+verify+email", req.url));
  }
}

/**
 * POST /api/auth/verify-email
 * Actions:
 * - "resend": Generates a fresh verification token & link for an unverified user
 * - "confirm_verified": Marks user as verified after Firebase email verification or token confirmation
 * - "link_google_password": Allows a Google-authenticated user to set a password for email login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, password } = body;
    const cleanEmail = email?.toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (action === "resend") {
      if (user.emailVerified) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: "Your email address is already verified. You can log in directly.",
        });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
      const verificationUrl = `${origin}/api/auth/verify-email?token=${verificationToken}`;

      await db.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpiry,
        },
      });

      return NextResponse.json({
        success: true,
        verificationUrl,
        message: "A fresh verification link has been sent to your email address.",
      });
    }

    if (action === "confirm_verified") {
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Email verified successfully! Your ReviewMitra service is now active.",
      });
    }

    if (action === "link_google_password") {
      if (!password || String(password).length < 6) {
        return NextResponse.json(
          { error: "Please enter a new password of at least 6 characters." },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(password),
          authProvider: "both",
          emailVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Password successfully linked to your Google account! You can now log in using either Google or Email + Password.",
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/auth/verify-email error:", error);
    return NextResponse.json(
      { error: "Failed to process email verification request." },
      { status: 500 }
    );
  }
}
