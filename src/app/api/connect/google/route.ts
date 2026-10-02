import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "default";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/connect/google/callback`;

  // If real Google OAuth credentials exist, redirect to real consent screen
  if (clientId) {
    const scope = encodeURIComponent("https://www.googleapis.com/auth/business.manage");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${businessId}`;

    return NextResponse.redirect(googleAuthUrl);
  }

  // Development / Demo fast connect mode
  return NextResponse.redirect(`${redirectUri}?code=mock_google_code&state=${businessId}`);
}
