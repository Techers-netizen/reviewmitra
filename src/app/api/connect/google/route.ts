import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "default";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
  const redirectUri = `${origin}/api/connect/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dashboard/connect?error=missing_google_client_id", req.url)
    );
  }

  // Google OAuth 2.0 authorization URL
  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    scopes
  )}&access_type=offline&prompt=consent&state=${encodeURIComponent(businessId)}`;

  return NextResponse.redirect(googleAuthUrl);
}
