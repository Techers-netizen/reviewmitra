# HANDOFF — ReviewMitra Google Maps worker (muse/gmaps-worker)

**Branch:** `muse/gmaps-worker` (based on `autotest/overnight`; `main` untouched, nothing merged)
**Preview (READY):** https://reviewmitra-git-muse-gmaps-worker-opensoz.vercel.app
**Deployment:** https://reviewmitra-nm0kmmbpg-opensoz.vercel.app (commit `bad7b49`, READY)
**Test business (only link used):** New Lucky Restaurant, Kalina Kurla Road, Santacruz East, Mumbai 400029 — 3.9★, 942 Google reviews — https://share.google/Rd7mruMQjwTihYs01
**Method:** SeleniumBase UC mode only. **No Google Business Profile API** (quota is 0). **Zero dummy data.**
**Date:** 2026-11-09. Full detail: `reports/GMAPS_REPORT.md`.

## What works — proven (with numbers)

- **Dummy data deleted (Step 0).** `prisma/seed.ts` (Demo Owner, Smile Dental Care, 16 hardcoded reviews), `worker/test-seed.mjs` / `test-cleanup.mjs`, the `GET /api/business` auto-seed of National Medical / New Lucky (fake "connected" Google rows) + its name filter + GET-time deletes, the false-"posted" bugs in `sync-engine.ts` and the cron, the hardcoded share.google fallback URL in the reply route, fabricated business objects in QR/connect/reviews routes. Grep over `src/lib`, `src/app/api`, `prisma`, `worker` finds no live fabrication. Real DB rows were NOT deleted.
- **Worker is a FastAPI service.** `worker/app.py`: `POST /sync`, `POST /reply`, `GET /health`. `WORKER_SECRET` header auth (refuses to start without it; `/sync` without the secret → **401**). One-Chrome-at-a-time lock (409 when busy). Selectors in one file: `worker/gmaps_selectors.py`. `worker/Dockerfile` + `worker/README.md`. Next.js client `src/lib/worker-http.ts` + `POST /api/worker/sync` (dedupe via `ingestReviews` upsert on stable externalId). Shared reply path `src/lib/reply-service.ts` (manual button + cron use the same `/reply` path). `next build` passes; `/api/worker/sync` and `/api/connect/sync` listed.
- **`/sync` logged-out: 5 of 942 = 0.5%, `complete: false`, on all 7 build runs and both 2026-11-09 verification runs.** Business read from the page every time: "New Lucky Restaurant", 3.9★, 942 shown, placeId `/g/11cs5st1_w`, address now returned too. Same 5 real reviews every run: Adrian Rodrigues 5★, Iram Shah 5★, D.J. 4★, Electrofix Services 2★, shubham sharma 4★.
- **Dedupe holds at worker level.** Identical 5 externalIds across all runs — 0 new ids on re-sync.
- **`/reply` dry-run is honest.** `posted: false, error: "no Reply control found — are we logged in as the business owner?"` Nothing typed or posted. Ever.
- **Auth gates work.** `POST /api/worker/sync` without a session → 401. `next build` passes.
- **WORKER_URL not set → "Worker not connected".** On Vercel the worker cannot run, so `POST /api/worker/sync` returns 503 `Worker not connected` and the dashboard Google sync (`POST /api/connect/sync`) shows the same note for Google. No fake data is inserted, nothing crashes. (Commit `bad7b49`.)
- **DB is clean.** Review count **0** at the last verified check (2026-11-08 21:13 IST). No DB writes have been made since — every worker test and every browser read was read-only, and `POST /api/worker/sync` was never called. **Deleted browser-sourced rows: none — 0 rows existed, so 0 deleted.** The cloud-browser read-only sync reached 400/942 reviews before it was stopped on 2026-11-09; those reviews were never inserted into the DB and must NOT be copied in by hand.

## What is NOT proven — NOT PASSED

**Overall: NOT PASSED.** Criteria 2 and 5 fail on the owner login (see below).

- **Full sync (criterion 2): FAIL.** Logged-out, Google shows only 5 of 942 reviews (no lazy-load on scroll, "See more reviews" does not expand). Fetched 5 vs 942 shown = 0.5%. Needs the owner's logged-in Chrome profile.
- **ONE live reply (criterion 5): FAIL — blocked.** Never posted. Needs the owner login + Zahid's go-ahead at the moment of posting.
- **Dashboard display of synced reviews: NOT PROVEN.** Route built, `next build` passes, preview READY — but no live end-to-end call (worker → ingest → dashboard) has been made. Needs the worker reachable from Vercel + a signed-in session.
- **DB-level dedupe: NOT PROVEN.** Worker-level dedupe is proven; the DB upsert path has not been exercised (0 reviews in DB).
- **Business name auto-fetch on the dashboard (criterion 1): PARTIAL.** Worker proven; dashboard display unproven (same reason as above).
- **Spot check 5 reviews word-for-word (criterion 4): PASS at worker level only.** DB comparison not possible (0 reviews in DB).

## Run the worker

### Locally (this machine)

```bash
# 1. Create the venv and install deps (once)
python3 -m venv worker/.venv
worker/.venv/bin/pip install -r worker/requirements.txt

# 2. Start the service (WORKER_SECRET is mandatory — it refuses to start without it)
WORKER_SECRET='<a-long-random-secret>' \
  worker/.venv/bin/uvicorn worker.app:app --port 8000

# 3. Test (logged-out: public reviews only)
curl -s -X POST localhost:8000/sync \
  -H 'X-Worker-Secret: <secret>' -H 'Content-Type: application/json' \
  -d '{"mapsUrl": "https://share.google/Rd7mruMQjwTihYs01"}' | python3 -m json.tool

# One-shot CLI runs (no service)
worker/.venv/bin/python worker/gmaps_worker.py sync \
  --business-url https://share.google/Rd7mruMQjwTihYs01 --headless
worker/.venv/bin/python worker/gmaps_worker.py post-reply \
  --business-url https://share.google/Rd7mruMQjwTihYs01 \
  --review-author "Aarav Sharma" --reply-text "Thank you! ..." --dry-run
```

### Docker (local now, VPS later)

```bash
docker build -f worker/Dockerfile -t reviewmitra-worker .
docker run -d --name reviewmitra-worker -p 8000:8000 \
  -e WORKER_SECRET='<a-long-random-secret>' \
  -v reviewmitra-profile:/app/worker/profiles \
  reviewmitra-worker
```

On a VPS the same image runs with `-p 8000:8000` behind a firewall that only allows the Vercel app's calls (or a reverse proxy with the secret header). Then set `WORKER_URL` in Vercel.

### Environment variables (names only — no values in this file)

| Var | Where | Purpose |
| --- | --- | --- |
| `WORKER_SECRET` | Worker + Next.js | **Required.** Secret for `X-Worker-Secret` / `Authorization: Bearer`. Same value on both sides. |
| `WORKER_URL` | Next.js (Vercel) | Base URL of the worker service, e.g. `http://localhost:8000` or `https://<vps-host>:8000`. |
| `GOOGLE_REPLY_TRANSPORT` | Next.js (Vercel) | Set to `worker` to route Google replies via this worker. Already set in Vercel. |
| `WORKER_PROFILE_DIR` | Worker (optional) | Persistent Chrome profile (default `worker/profiles/google-owner`). |
| `WORKER_HEADLESS` | Worker (optional) | `true` (default) / `false` for headed runs (login only). |
| `REVIEWMITRA_LOCAL_PROXY` | This VM only | Local forwarder for the egress proxy; auto-started by `worker/app.py`. |

## The one-time owner login (required for the full sync + replies)

The worker **never sees or types the owner's password.**

1. Run the worker on a machine Zahid can see and type into (his PC, or a VPS with a display) with a persistent profile dir (`WORKER_PROFILE_DIR`, default `worker/profiles/google-owner`).
2. In a headed Chrome, the worker types the **email only** and waits. Zahid types his password himself and completes 2FA on his phone (tap **Yes + the number** shown). The session is saved to the profile.
3. From then on the worker reuses the profile — no password, no tap.

**Correction (verified 2026-11-09): Google asks for the password FIRST on the challenge page and offers no "Try another way", so the device prompt cannot be sent without the password.** The earlier "email only + tap Yes + number" plan does not work as assumed. The password is required before any phone tap. The worker never types it; only Zahid does, once, in a headed Chrome he can see. The cloud browser is already signed in as publicdocc, but its profile is NOT on this VM and cannot be transferred to the worker.

Until that profile exists: `/sync` works logged-out (5/942) and `/reply` honestly reports `posted: false`.

## Known problems

- **Logged-out limit:** Google shows only 5 of 942 reviews without the owner login. No lazy-load, no "See more reviews" expansion. This is a Google limit, not a worker bug.
- **Owner login is password-first** (see above). No "Try another way" on the password page. The worker cannot trigger the phone tap without the password, and it never types the password.
- **Worker has no permanent home yet.** It runs on this VM for testing only. Needs a VPS + `WORKER_URL` / `WORKER_SECRET` in the Vercel `reviewmitra` project.
- **Neon DB is unreachable from this VM via Prisma** (the egress proxy blocks direct Postgres/TLS). DB checks use Neon's HTTP SQL endpoint. The Vercel app reaches Neon fine.
- **Address was null in early `/sync` runs** (stale address selectors); fixed in verification — address is now returned.
- **Pre-existing: an old `.env` is in git history** (added in the initial commit, deleted from tracking in `04b344c`; NOT in the current tree). It contains a `DATABASE_URL`. The current tree is clean and `.gitignore` covers `.env*`. If that old credential is still live, rotate it — rewriting history is a separate decision.
- **Chrome profile is local-only.** `worker/profiles/` is gitignored (it holds a live Google login). It exists only on the machine where the login was done.
- **Google Maps selectors change often.** They live in one file (`worker/gmaps_selectors.py`); if extraction returns 0 reviews, fix them there, not in the worker code.

## Next 3 steps

1. **Owner one-time login** (only Zahid can do this): run the worker on a machine he can see (his PC or a VPS with a display), headed Chrome, he types the password once + taps Yes + number. Profile saved to `worker/profiles/google-owner`. The worker then reuses it.
2. **Deploy the worker permanently (VPS):** build the Docker image, run it on the VPS, set `WORKER_URL` + `WORKER_SECRET` in the Vercel `reviewmitra` project. Then verify end-to-end: `POST /api/worker/sync` → ingest → reviews visible in `/dashboard/reviews`.
3. **Prove it and post ONE reply:** re-run the full sync (expect 942, >= 95% completeness), verify 0 duplicates on re-sync + 5 word-for-word spot checks, then get Zahid's go-ahead and post ONE live reply, reload and verify it is visible on Google. Update `reports/GMAPS_REPORT.md` with the real numbers. Only then mark the task PASSED.

## Security (checked 2026-11-09 before pushing)

- `.gitignore` covers `.env*` (line 39, `!.env.example` excepted), `worker/profiles/` (line 79), `qa/sessions/` (lines 63–64), `worker/config.json`, `worker/.venv/`, `worker/.chrome/`, `worker/*.log`, `worker/*.png`.
- Tracked files matching sensitive names: only `.env.example` (placeholders), `reports/shots/t1-session-persisted.png` (a screenshot, not a session file), `src/components/providers/session-provider.tsx` (a React component). No `.env`, no profile folder, no session file, no `storageState` file is tracked. No `storageState` files exist anywhere in the repo.
- No passwords, tokens, cookies or credential values are in any tracked file. `.env` on disk is ignored; `worker/config.json` does not exist on disk (only `config.example.json`, the template).
