import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { callWorkerSync, isWorkerHttpConfigured } from "@/lib/worker-http";
import { ingestReviews, type RawReviewPayload } from "@/lib/sync-engine";

/**
 * POST /api/worker/sync — sync Google Maps reviews via the SeleniumBase
 * worker service (no GBP API).
 *
 * Body: { businessId?: string, mapsUrl: string }
 *  - mapsUrl is the ONLY input the user pastes (short links like
 *    share.google / maps.app.goo.gl are resolved by the worker).
 *  - The business name, rating and total review count are read FROM THE
 *    PAGE by the worker — the user never types the business name.
 *  - If businessId is omitted, the business is found by its stored
 *    googleReviewUrl, else the user's first business, else created from
 *    the page's business name (owner = signed-in user).
 *
 * Response: { success, business: {id, name}, fetched, total,
 *             completenessPct, complete, inserted, updated, skipped,
 *             duplicatesOnReSync } — numbers are honest: a logged-out
 *             worker reports e.g. 5 fetched of 942 shown, complete:false.
 *
 * Dedupe: reviews upsert by the stable externalId (hash of
 * reviewerName + date text + text) via ingestReviews; re-syncing the
 * same page inserts 0 and updates the existing rows.
 */

const RELATIVE_DATE_PATTERNS: Array<[RegExp, (n: number) => number]> = [
  [/(\d+)\s*(?:min|minute)s?\s*ago/i, () => 0],
  [/(\d+)\s*hours?\s*ago/i, (n) => n * 60 * 60 * 1000],
  [/(\d+)\s*days?\s*ago/i, (n) => n * 24 * 60 * 60 * 1000],
  [/(\d+)\s*weeks?\s*ago/i, (n) => n * 7 * 24 * 60 * 60 * 1000],
  [/(\d+)\s*months?\s*ago/i, (n) => n * 30 * 24 * 60 * 60 * 1000],
  [/(\d+)\s*years?\s*ago/i, (n) => n * 365 * 24 * 60 * 60 * 1000],
];

/**
 * Google shows relative dates ("2 weeks ago", "a month ago"). The DB
 * needs a timestamp, so convert to an APPROXIMATE date (documented as
 * such — the exact posting time is not on the page). The stable
 * externalId uses the original dateText, so this approximation never
 * affects dedupe.
 */
function parseRelativeDate(dateText: string, now = Date.now()): Date {
  const text = (dateText || "").trim().toLowerCase();
  if (!text) return new Date(now);
  if (text === "yesterday") return new Date(now - 24 * 60 * 60 * 1000);
  if (text === "today" || text === "just now") return new Date(now);
  if (text.startsWith("a ") || text.startsWith("an ")) {
    const singular = text.replace(/^an?\s+/, "");
    const unitMs: Record<string, number> = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    for (const [unit, ms] of Object.entries(unitMs)) {
      if (singular.startsWith(unit)) return new Date(now - ms);
    }
  }
  for (const [re, toMs] of RELATIVE_DATE_PATTERNS) {
    const m = text.match(re);
    if (m) return new Date(now - toMs(parseInt(m[1], 10)));
  }
  const parsed = Date.parse(dateText);
  return Number.isNaN(parsed) ? new Date(now) : new Date(parsed);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const mapsUrl = (body.mapsUrl || "").trim();
    const businessId = (body.businessId || "").trim() || null;
    if (!mapsUrl) {
      return NextResponse.json(
        { success: false, error: "mapsUrl is required — paste a Google Maps link." },
        { status: 400 }
      );
    }
    if (!isWorkerHttpConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Worker not connected — the Google Maps worker service is not configured (WORKER_URL / WORKER_SECRET missing). Start the worker service first — see worker/README.md. No reviews were synced and no data was changed.",
        },
        { status: 503 }
      );
    }

    // 1. Call the worker. It resolves the link, reads the business from
    //    the page, scrolls the Reviews tab and returns everything it saw.
    let result;
    try {
      result = await callWorkerSync(mapsUrl);
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err?.message || "Worker call failed." },
        { status: 502 }
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error || "Worker sync failed.", worker: result },
        { status: 502 }
      );
    }

    const pageBusiness = result.business || {};
    const pageName = (pageBusiness.name || "").trim();
    if (!pageName) {
      return NextResponse.json(
        {
          success: false,
          error: "Worker could not read the business name from the page — sync aborted, nothing saved.",
          worker: result,
        },
        { status: 502 }
      );
    }

    // 2. Find or create the business. The name comes from the page, never
    //    from user input. Ownership is always the signed-in user.
    let business: any = null;
    if (businessId) {
      business = await db.business.findFirst({
        where: { id: businessId, ownerId: userId },
      });
      if (!business) {
        return NextResponse.json(
          { success: false, error: "Business not found for this account." },
          { status: 404 }
        );
      }
    }
    if (!business) {
      business = await db.business.findFirst({
        where: { ownerId: userId, googleReviewUrl: mapsUrl },
      });
    }
    if (!business) {
      business = await db.business.findFirst({
        where: { ownerId: userId, businessName: pageName },
      });
    }
    const placeUrl = result.place_url || mapsUrl;
    if (business) {
      business = await db.business.update({
        where: { id: business.id },
        data: {
          businessName: pageName,
          googleReviewUrl: placeUrl,
          ...(pageBusiness.placeId ? { googlePlaceId: pageBusiness.placeId } : {}),
        },
      });
    } else {
      business = await db.business.create({
        data: {
          ownerId: userId,
          businessName: pageName,
          googleReviewUrl: placeUrl,
          ...(pageBusiness.placeId ? { googlePlaceId: pageBusiness.placeId } : {}),
        },
      });
    }

    // 3. Ingest. Reviews without a rating are skipped (never invented);
    //    the stable externalId dedupes on re-sync.
    const rawReviews: RawReviewPayload[] = [];
    let skippedNoRating = 0;
    for (const r of result.reviews || []) {
      if (!r.rating || r.rating < 1 || r.rating > 5) {
        skippedNoRating++;
        continue;
      }
      rawReviews.push({
        externalId: r.externalId,
        reviewerName: r.reviewerName || "Google user",
        rating: r.rating,
        reviewText: r.text || "",
        reviewTimestamp: parseRelativeDate(r.dateText || ""),
      });
    }
    const ingest = await ingestReviews(business.id, "google", rawReviews);

    const fetched = result.fetchedCount ?? rawReviews.length;
    const total = result.totalReviewsShown ?? null;
    return NextResponse.json({
      success: true,
      business: { id: business.id, name: business.businessName },
      fetched,
      total,
      completenessPct: result.completenessPct ?? null,
      complete: result.complete ?? false,
      inserted: ingest.inserted,
      updated: ingest.updated,
      draftsCreated: ingest.draftsCreated,
      skippedNoRating,
      duplicatesOnReSync: ingest.updated,
    });
  } catch (err: any) {
    console.error("[worker/sync] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed." },
      { status: 500 }
    );
  }
}
