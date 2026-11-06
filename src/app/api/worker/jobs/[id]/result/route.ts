import { NextRequest, NextResponse } from "next/server";
import { applyJobOutcomeToDb, readWorkerJob } from "@/lib/worker-queue";

// POST /api/worker/jobs/[id]/result — the worker reports its outcome.
// Body: { status, success, verified, dryRun, error, detail }
// NOTE: this must live in its own `result/` folder: a route.ts in [id]/
// only matches /api/worker/jobs/[id], not /api/worker/jobs/[id]/result.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = readWorkerJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const outcome = {
    status: body.status as string | undefined,
    success: !!body.success,
    verified: !!body.verified,
    dryRun: !!body.dryRun,
    error: (body.error as string | undefined) || null,
    detail: body.detail ?? null,
  };
  const applied = await applyJobOutcomeToDb(job, outcome);
  return NextResponse.json({ ok: true, jobId: id, applied, outcome });
}
