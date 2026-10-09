import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "default";

  const appId = process.env.FACEBOOK_APP_ID;
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
  const redirectUri = `${origin}/api/connect/facebook/callback`;

  if (!appId) {
    return NextResponse.redirect(
      new URL("/dashboard/connect?error=missing_facebook_app_id", req.url)
    );
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_engagement",
    "pages_read_user_content",
  ].join(",");

  const fbAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(businessId)}`;

  return NextResponse.redirect(fbAuthUrl);
}
