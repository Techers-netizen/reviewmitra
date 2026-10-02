import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { ingestReviews } from "@/lib/sync-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "";

    // Find active business
    let business: any = null;
    if (state && state !== "default") {
      business = await db.business.findUnique({ where: { id: state } });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.redirect(new URL("/dashboard/connect?error=no_business", req.url));
    }

    // In production with real Google API:
    // exchange code for access_token and refresh_token
    const rawAccessToken = `ya29.google_mock_access_token_${Date.now()}`;
    const rawRefreshToken = `1//google_mock_refresh_token_${Date.now()}`;

    // Encrypt tokens using AES-256-GCM
    const encryptedAccess = encryptToken(rawAccessToken);
    const encryptedRefresh = encryptToken(rawRefreshToken);

    // Save platform connection in DB
    await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId: business.id,
          platformName: "google",
        },
      },
      update: {
        status: "connected",
        encryptedAccessToken: encryptedAccess.encryptedText,
        encryptedRefreshToken: encryptedRefresh.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        platformName: "google",
        externalAccountId: `accounts/g_biz_${Date.now()}`,
        status: "connected",
        encryptedAccessToken: encryptedAccess.encryptedText,
        encryptedRefreshToken: encryptedRefresh.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
    });

    // Ingest sample initial reviews if none exist
    await ingestReviews(business.id, "google", [
      {
        externalId: `google_rev_${Date.now()}_1`,
        reviewerName: "Pooja Hegde",
        rating: 5,
        reviewText: "Bahut badhiya treatment tha. Doctor saab aur staff dono bohot courteous aur helpful hain.",
        reviewTimestamp: new Date(),
      },
      {
        externalId: `google_rev_${Date.now()}_2`,
        reviewerName: "Rakesh Kulkarni",
        rating: 4,
        reviewText: "Clean environment and good service. Waiting time could be reduced slightly.",
        reviewTimestamp: new Date(Date.now() - 3600000),
      },
    ]);

    return NextResponse.redirect(new URL("/dashboard/connect?success=google", req.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/dashboard/connect?error=google_failed", req.url));
  }
}
