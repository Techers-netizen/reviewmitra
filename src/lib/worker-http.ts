/**
 * HTTP client for the ReviewMitra Google Maps worker service (FastAPI).
 *
 * The worker runs separately (local Docker now, VPS later) because Vercel
 * cannot run Chrome. The Next.js app calls it via WORKER_URL with the
 * WORKER_SECRET as the X-Worker-Secret header (or Authorization: Bearer).
 *
 * Timeouts are long on purpose: a full sync scrolls hundreds of reviews
 * and takes minutes. Callers must still handle the worker being
 * unreachable (503) and the worker being busy (409) honestly.
 */

export interface WorkerSyncReview {
  externalId: string;
  reviewerName: string;
  rating: number | null;
  text: string;
  dateText: string;
  ownerReply?: string | null;
  hasOwnerReply?: boolean;
  hasReplyButton?: boolean;
}

export interface WorkerSyncResult {
  ok: boolean;
  action?: string;
  business?: {
    name: string | null;
    address: string | null;
    rating: number | null;
    totalReviewsShown: number | null;
    placeId?: string | null;
  };
  reviews?: WorkerSyncReview[];
  fetchedCount?: number;
  totalReviewsShown?: number | null;
  completenessPct?: number | null;
  complete?: boolean;
  place_url?: string;
  error?: string;
}

export interface WorkerReplyResult {
  ok: boolean;
  action?: string;
  posted?: boolean;
  verified?: boolean;
  dry_run?: boolean;
  place_url?: string;
  review?: Record<string, unknown>;
  error?: string;
  note?: string;
}

function workerBaseUrl(): string | null {
  const url = (process.env.WORKER_URL || "").trim().replace(/\/$/, "");
  return url || null;
}

function workerSecret(): string {
  return process.env.WORKER_SECRET || "";
}

async function callWorker<T>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ status: number; data: T }> {
  const base = workerBaseUrl();
  if (!base) {
    throw new Error(
      "WORKER_URL is not configured — the Google Maps worker service is not reachable."
    );
  }
  const secret = workerSecret();
  if (!secret) {
    throw new Error(
      "WORKER_SECRET is not configured — refusing to call the worker without its secret."
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/** POST /sync — full review sync for one Maps link (long timeout). */
export async function callWorkerSync(
  mapsUrl: string,
  timeoutMs = 10 * 60 * 1000
): Promise<WorkerSyncResult> {
  const { status, data } = await callWorker<WorkerSyncResult>(
    "/sync",
    { mapsUrl },
    timeoutMs
  );
  if (status === 409) {
    throw new Error("Worker is busy with another job — retry in a minute.");
  }
  if (status === 401) {
    throw new Error("Worker rejected the secret — check WORKER_SECRET.");
  }
  if (status >= 400) {
    throw new Error(
      (data as { error?: string }).error || `Worker /sync failed (HTTP ${status}).`
    );
  }
  return data;
}

/** POST /reply — post one reply via the worker (long timeout). */
export async function callWorkerReply(
  body: {
    mapsUrl: string;
    externalId?: string;
    reviewerName?: string;
    reviewText?: string;
    replyText: string;
    dryRun?: boolean;
  },
  timeoutMs = 5 * 60 * 1000
): Promise<WorkerReplyResult> {
  const { status, data } = await callWorker<WorkerReplyResult>("/reply", body, timeoutMs);
  if (status === 409) {
    throw new Error("Worker is busy with another job — retry in a minute.");
  }
  if (status === 401) {
    throw new Error("Worker rejected the secret — check WORKER_SECRET.");
  }
  if (status >= 400) {
    throw new Error(
      (data as { error?: string }).error || `Worker /reply failed (HTTP ${status}).`
    );
  }
  return data;
}

/** Is the worker configured (URL + secret present)? */
export function isWorkerHttpConfigured(): boolean {
  return !!workerBaseUrl() && !!workerSecret();
}
