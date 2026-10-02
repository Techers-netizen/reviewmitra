import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "default";

  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/connect/facebook/callback`;

  if (appId) {
    const scope = encodeURIComponent("pages_show_list,pages_read_engagement,pages_manage_engagement");
    const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${businessId}`;

    return NextResponse.redirect(fbAuthUrl);
  }

  // Development / Demo fast connect
  return NextResponse.redirect(`${redirectUri}?code=mock_fb_code&state=${businessId}`);
}
