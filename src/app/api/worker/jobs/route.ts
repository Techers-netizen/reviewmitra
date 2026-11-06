import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  enqueueWorkerJob,
  listWorkerJobs,
  workerBusinessUrl,
  type WorkerJobType,
} from "@/lib/worker-queue";

// GET /api/worker/jobs — list recent worker jobs (newest first).
export async function GET() {
  return NextResponse.json({ ok: true, jobs: listWorkerJobs(20) });
}

// POST /api/worker/jobs — enqueue a worker job directly.
// Body: { type: "google_reply" | "google_list_reviews", businessId,
//         reviewId?, replyText?, dryRun? }
// For google_reply the review must exist in the DB (same lookup the reply
// route does); the job carries the business's googleReviewUrl.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.businessId || !body.type) {
      return NextResponse.json(
        { error: "businessId and type are required." },
        { status: 400 }
      );
    }
    const type = body.type as WorkerJobType;
    if (type !== "google_reply" && type !== "google_list_reviews") {
      return NextResponse.json({ error: "Unknown job type." }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id: body.businessId },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    const businessUrl = workerBusinessUrl(business);

    let review: Awaited<ReturnType<typeof db.review.findUnique>> = null;
    if (type === "google_reply") {
      if (!body.reviewId || !body.replyText) {
        return NextResponse.json(
          { error: "reviewId and replyText are required for google_reply." },
          { status: 400 }
        );
      }
      review = await db.review.findUnique({ where: { id: body.reviewId } });
      if (!review) {
        return NextResponse.json({ error: "Review not found." }, { status: 404 });
      }
      if (review.platformName !== "google") {
        return NextResponse.json(
          { error: "Worker jobs only handle Google reviews." },
          { status: 400 }
        );
      }
    }

    const job = enqueueWorkerJob({
      type,
      businessId: business.id,
      reviewId: review ? review.id : null,
      externalReviewId: review ? review.externalReviewId : null,
      reviewerName: review ? review.reviewerName : "",
      reviewSnippet: review ? (review.reviewText || "").slice(0, 120) : "",
      replyText: type === "google_reply" ? String(body.replyText).trim() : "",
      businessUrl,
      dryRun: !!body.dryRun,
      replyDbId: null,
    });

    return NextResponse.json({ ok: true, jobId: job.id, status: job.status });
  } catch (err: unknown) {
    console.error("POST /api/worker/jobs error:", err);
    return NextResponse.json({ error: "Failed to enqueue worker job." }, { status: 500 });
  }
}
