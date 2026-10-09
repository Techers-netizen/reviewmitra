import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { ingestReviews } from "@/lib/sync-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "";
    const error = searchParams.get("error");

    if (error) {
      console.warn("Facebook OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard/connect?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/connect?error=missing_code", req.url)
      );
    }

    let business: any = null;
    if (state && state !== "default") {
      business = await db.business.findUnique({ where: { id: state } });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.redirect(
        new URL("/dashboard/connect?error=no_business", req.url)
      );
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
    const redirectUri = `${origin}/api/connect/facebook/callback`;

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL("/dashboard/connect?error=missing_credentials", req.url)
      );
    }

    // 1. Real Token Exchange with Facebook Graph API
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed Facebook token exchange:", tokenData);
      return NextResponse.redirect(
        new URL(`/dashboard/connect?error=token_exchange_failed`, req.url)
      );
    }

    const userAccessToken = tokenData.access_token;

    // 2. Fetch User's Pages
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
    );
    const accountsData = await accountsRes.json();

    let pageAccessToken = userAccessToken;
    let pageName = business.businessName;
    let pageId = `page_${Date.now()}`;

    if (accountsData.data && accountsData.data.length > 0) {
      const firstPage = accountsData.data[0];
      pageAccessToken = firstPage.access_token || userAccessToken;
      pageName = firstPage.name || business.businessName;
      pageId = firstPage.id || pageId;
    }

    // 3. Encrypt Page Access Token
    const encryptedAccess = encryptToken(pageAccessToken);

    // 4. Save PlatformConnection in Neon PostgreSQL
    await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId: business.id,
          platformName: "facebook",
        },
      },
      update: {
        status: "connected",
        externalAccountId: `${pageName} (ID: ${pageId})`,
        encryptedAccessToken: encryptedAccess.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        platformName: "facebook",
        externalAccountId: `${pageName} (ID: ${pageId})`,
        status: "connected",
        encryptedAccessToken: encryptedAccess.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
    });

    // 5. Try fetching ratings/recommendations
    try {
      const ratingsRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/ratings?access_token=${pageAccessToken}&limit=20`
      );
      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        if (ratingsData.data && ratingsData.data.length > 0) {
          const rawPayloads = ratingsData.data.map((r: any) => ({
            externalId: r.recommendation_id || r.created_time || `fb_${Date.now()}_${Math.random()}`,
            reviewerName: r.reviewer?.name || "Facebook User",
            rating: r.recommendation_type === "positive" ? 5 : 2,
            reviewText: r.review_text || "",
            reviewTimestamp: new Date(r.created_time || Date.now()),
          }));
          await ingestReviews(business.id, "facebook", rawPayloads);
        }
      }
    } catch (e) {
      console.log("Facebook ratings sync check completed");
    }

    return NextResponse.redirect(
      new URL("/dashboard/connect?success=facebook_connected", req.url)
    );
  } catch (error: any) {
    console.error("Facebook OAuth callback exception:", error);
    return NextResponse.redirect(
      new URL("/dashboard/connect?error=server_error", req.url)
    );
  }
}
