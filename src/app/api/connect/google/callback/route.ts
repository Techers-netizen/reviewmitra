import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { fetchGoogleAccountsAndLocations, syncGoogleReviewsFromApi } from "@/lib/google-business";

/**
 * GET /api/connect/google/callback
 * Handles Google OAuth 2.0 callback, discovers ALL Google Business locations registered
 * on the user's Google account (e.g., 2+ businesses on the same email), creates/links each
 * business location in PostgreSQL, and syncs real customer reviews.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "";
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/connect?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/connect?error=missing_code", req.url)
      );
    }

    // Resolve primary business & owner in DB
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com";
    const redirectUri = `${origin}/api/connect/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/dashboard/connect?error=missing_credentials", req.url)
      );
    }

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed Google token exchange:", tokenData);
      return NextResponse.redirect(
        new URL(`/dashboard/connect?error=token_exchange_failed`, req.url)
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";

    // 2. Fetch Google user email
    let googleEmail = "";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.email) googleEmail = userData.email;
      }
    } catch {
      // Continue with default label if userinfo fails
    }

    // 3. Encrypt tokens with AES-256-GCM
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

    // 4. Discover ALL Google Business locations registered under this email
    const discovery = await fetchGoogleAccountsAndLocations(accessToken);
    const discoveredLocations = discovery.locations || [];

    if (discoveredLocations.length > 0) {
      const ownerBusinesses = await db.business.findMany({
        where: { ownerId: business.ownerId },
        orderBy: { createdAt: "asc" },
      });

      for (let i = 0; i < discoveredLocations.length; i++) {
        const loc = discoveredLocations[i];
        const locTitle = loc.title || `${business.businessName} #${i + 1}`;
        const locCity =
          loc.storefrontAddress?.locality ||
          loc.storefrontAddress?.administrativeArea ||
          business.city ||
          null;
        const placeId = loc.metadata?.placeId || undefined;
        const writeReviewUrl =
          loc.metadata?.newReviewUri ||
          (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : undefined);

        // Match existing business or create a new Business record for 2nd/3rd locations
        let targetBiz =
          ownerBusinesses.find(
            (b) => b.businessName.toLowerCase() === locTitle.toLowerCase()
          ) || (i === 0 ? business : null);

        if (!targetBiz) {
          targetBiz = await db.business.create({
            data: {
              ownerId: business.ownerId,
              businessName: locTitle,
              city: locCity,
              category: business.category || "clinic",
              googlePlaceId: placeId,
              googleReviewUrl: writeReviewUrl,
              defaultTone: "friendly",
              matchReviewLanguage: true,
              autoReplyPositive: true,
              notifyWhatsapp: true,
            },
          });
        } else {
          targetBiz = await db.business.update({
            where: { id: targetBiz.id },
            data: {
              businessName: locTitle || targetBiz.businessName,
              city: locCity || targetBiz.city,
              googlePlaceId: placeId || targetBiz.googlePlaceId,
              googleReviewUrl: writeReviewUrl || targetBiz.googleReviewUrl,
            },
          });
        }

        const label = googleEmail ? `${locTitle} (${googleEmail})` : locTitle;

        await db.platformConnection.upsert({
          where: {
            businessId_platformName: {
              businessId: targetBiz.id,
              platformName: "google",
            },
          },
          update: {
            status: "connected",
            externalAccountId: label,
            listingUrl: writeReviewUrl,
            encryptedAccessToken: encryptedAccess.encryptedText,
            encryptedRefreshToken: encryptedRefresh?.encryptedText || undefined,
            tokenIv: encryptedAccess.iv,
            tokenAuthTag: encryptedAccess.authTag,
            lastSyncAt: new Date(),
          },
          create: {
            businessId: targetBiz.id,
            platformName: "google",
            externalAccountId: label,
            listingUrl: writeReviewUrl,
            status: "connected",
            encryptedAccessToken: encryptedAccess.encryptedText,
            encryptedRefreshToken: encryptedRefresh?.encryptedText || undefined,
            tokenIv: encryptedAccess.iv,
            tokenAuthTag: encryptedAccess.authTag,
            lastSyncAt: new Date(),
          },
        });

        await syncGoogleReviewsFromApi(targetBiz.id);
      }
    } else {
      // Save connection on primary business even if GBP API quota is 0 (Direct Google Maps sync handles reviews)
      const accountLabel = googleEmail
        ? `${business.businessName} (${googleEmail})`
        : "Google Business Account";

      await db.platformConnection.upsert({
        where: {
          businessId_platformName: {
            businessId: business.id,
            platformName: "google",
          },
        },
        update: {
          status: "connected",
          externalAccountId: accountLabel,
          encryptedAccessToken: encryptedAccess.encryptedText,
          encryptedRefreshToken: encryptedRefresh?.encryptedText || undefined,
          tokenIv: encryptedAccess.iv,
          tokenAuthTag: encryptedRefresh?.authTag || encryptedAccess.authTag,
          lastSyncAt: new Date(),
        },
        create: {
          businessId: business.id,
          platformName: "google",
          externalAccountId: accountLabel,
          status: "connected",
          encryptedAccessToken: encryptedAccess.encryptedText,
          encryptedRefreshToken: encryptedRefresh?.encryptedText || undefined,
          tokenIv: encryptedAccess.iv,
          tokenAuthTag: encryptedAccess.authTag,
          lastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/connect?success=google_connected", req.url)
    );
  } catch (error: any) {
    console.error("Google OAuth callback exception:", error);
    return NextResponse.redirect(
      new URL("/dashboard/connect?error=server_error", req.url)
    );
  }
}
