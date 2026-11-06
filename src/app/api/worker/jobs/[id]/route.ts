import { NextRequest, NextResponse } from "next/server";
import { applyJobOutcomeToDb, readWorkerJob } from "@/lib/worker-queue";

// GET /api/worker/jobs/[id] — job status. If the worker has finished and the
// linked ReviewReply row is still "queued", this read applies the outcome
// to the DB (idempotent fallback for the case where the worker could not
// reach the result endpoint).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = readWorkerJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  await applyJobOutcomeToDb(job);
  return NextResponse.json({ ok: true, job });
}
