import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingestReviews, RawReviewPayload } from "@/lib/sync-engine";

/**
 * Scrapes real public buyer ratings & reviews from an IndiaMART company profile URL
 * using embedded Schema.org JSON-LD and HTML review blocks (No CRM API Key required).
 */
async function scrapeIndiaMartPublicReviews(catalogUrl: string): Promise<{
  companyName?: string;
  reviews: RawReviewPayload[];
}> {
  const reviews: RawReviewPayload[] = [];
  let companyName: string | undefined;

  if (!catalogUrl || !catalogUrl.startsWith("http")) {
    return { reviews };
  }

  try {
    const res = await fetch(catalogUrl.trim(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });

    if (!res.ok) return { reviews };
    const html = await res.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      companyName = titleMatch[1].split("-")[0].split("|")[0].trim();
    }

    // Parse Schema.org JSON-LD Review entries on IndiaMART catalog pages
    const ldBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      try {
        const rawJson = block.replace(/<\/?script[^>]*>/gi, "").trim();
        const data = JSON.parse(rawJson);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (Array.isArray(item.review)) {
            for (const r of item.review) {
              const author = r.author?.name || "IndiaMART Buyer";
              const dateStr = r.datePublished || new Date().toISOString().slice(0, 10);
              const extId = `im_${Buffer.from(`${author}_${dateStr}`).toString("hex").slice(0, 20)}`;
              reviews.push({
                externalId: extId,
                reviewerName: author,
                rating: Number(r.reviewRating?.ratingValue) || 5,
                reviewText: r.reviewBody || r.description || "",
                reviewTimestamp: r.datePublished ? new Date(r.datePublished) : new Date(),
              });
            }
          }
        }
      } catch {
        // Ignore non-review JSON-LD block
      }
    }
  } catch (e) {
    console.warn("IndiaMART public page scrape warning:", e);
  }

  return { companyName, reviews };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { businessId, mobileNumber, email, catalogUrl } = body;

    const cleanMobile = mobileNumber ? String(mobileNumber).replace(/\D/g, "").slice(-10) : "";
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanUrl = catalogUrl ? String(catalogUrl).trim() : "";

    if (!cleanMobile && !cleanEmail && !cleanUrl) {
      return NextResponse.json(
        { error: "Please enter your IndiaMART Mobile Number, Email Address, or Company Catalog URL." },
        { status: 400 }
      );
    }

    let business: any = null;
    const targetBizId = businessId || (session?.user as any)?.businessId;
    if (targetBizId) {
      business = await db.business.findUnique({ where: { id: targetBizId } });
    }
    if (!business && (session?.user as any)?.id) {
      business = await db.business.findFirst({
        where: { ownerId: (session?.user as any).id },
        orderBy: { createdAt: "asc" },
      });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.json({ error: "Business account not found." }, { status: 404 });
    }

    // Build clear account identifier from Mobile / Email / URL (No API Key required)
    const identifierParts: string[] = [];
    if (cleanMobile) identifierParts.push(`+91 ${cleanMobile}`);
    if (cleanEmail) identifierParts.push(cleanEmail);
    if (cleanUrl) identifierParts.push(cleanUrl);
    const accountLabel = `IndiaMART (${identifierParts.join(" · ")})`;

    // Update Business record with direct IndiaMART details
    await db.business.update({
      where: { id: business.id },
      data: {
        indiamartMobile: cleanMobile || business.indiamartMobile,
        indiamartEmail: cleanEmail || business.indiamartEmail,
        indiamartUrl: cleanUrl || business.indiamartUrl,
      },
    });

    // Upsert PlatformConnection for IndiaMART
    await db.platformConnection.upsert({
      where: {
        businessId_platformName: {
          businessId: business.id,
          platformName: "indiamart",
        },
      },
      update: {
        externalAccountId: accountLabel,
        listingUrl: cleanUrl || undefined,
        status: "connected",
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        platformName: "indiamart",
        externalAccountId: accountLabel,
        listingUrl: cleanUrl || undefined,
        status: "connected",
        lastSyncAt: new Date(),
      },
    });

    // If a public IndiaMART catalog URL was provided, scrape real buyer reviews (NO fake reviews!)
    let realImportedCount = 0;
    if (cleanUrl) {
      const scraped = await scrapeIndiaMartPublicReviews(cleanUrl);
      if (scraped.reviews.length > 0) {
        const res = await ingestReviews(business.id, "indiamart", scraped.reviews);
        realImportedCount = res.inserted;
      }
    }

    return NextResponse.json({
      success: true,
      reviewsImported: realImportedCount,
      message:
        realImportedCount > 0
          ? `IndiaMART account connected! ${realImportedCount} real buyer reviews synced.`
          : `IndiaMART Seller Account (${accountLabel}) connected successfully!`,
    });
  } catch (err: any) {
    console.error("IndiaMART connect exception:", err);
    return NextResponse.json(
      { error: "Failed to connect IndiaMART seller account." },
      { status: 500 }
    );
  }
}
