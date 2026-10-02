import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { ingestReviews } from "@/lib/sync-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "";

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

    const rawPageAccessToken = `EAAB_fb_mock_page_token_${Date.now()}`;
    const encryptedAccess = encryptToken(rawPageAccessToken);

    await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId: business.id,
          platformName: "facebook",
        },
      },
      update: {
        status: "connected",
        encryptedAccessToken: encryptedAccess.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        platformName: "facebook",
        externalAccountId: `page_id_fb_${Date.now()}`,
        status: "connected",
        encryptedAccessToken: encryptedAccess.encryptedText,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        lastSyncAt: new Date(),
      },
    });

    await ingestReviews(business.id, "facebook", [
      {
        externalId: `fb_rec_${Date.now()}_1`,
        reviewerName: "Sunita Roy",
        rating: 5,
        reviewText: "Recommends this business! Very professional and clean setup.",
        reviewTimestamp: new Date(),
      },
    ]);

    return NextResponse.redirect(new URL("/dashboard/connect?success=facebook", req.url));
  } catch (error) {
    console.error("Facebook callback error:", error);
    return NextResponse.redirect(new URL("/dashboard/connect?error=facebook_failed", req.url));
  }
}
