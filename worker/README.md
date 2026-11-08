# ReviewMitra Google Maps Worker (SeleniumBase, no GBP API)

Fetches real Google Maps reviews and posts owner replies **without the
Google Business Profile API** (its quota is 0). A real Chrome in
SeleniumBase UC mode opens the business page, reads the reviews, and —
when logged in as the owner — posts replies and reads them back.

## How it works

```
Dashboard / cron (Next.js, Vercel)
        │  WORKER_URL + X-Worker-Secret
        ▼
FastAPI service (worker/app.py) ── one Chrome at a time
        │  SeleniumBase UC mode, persistent profile
        ▼
Google Maps (business page, Reviews tab, owner view)

Dashboard "Post Reply" also works via the file queue (local only):
  POST /api/reviews/reply -> worker/jobs/job_<id>.json
  -> run_worker.py polls jobs/ (every 10s) -> gmaps_worker.py CLI
  -> POST /api/worker/jobs/<id>/result
```

- `POST /sync` — resolve a Maps link, read business name/rating/total
  from the page, open Reviews (Newest), scroll until no new items load,
  expand every "More", capture ALL reviews. Returns business + reviews
  with a completeness check (fetched vs total shown, >= 95% = complete).
- `POST /reply` — find the exact review, click Reply, type, submit,
  reload and VERIFY the reply is visible. Only then `posted: true`.
- The Next.js app calls the service via `WORKER_URL` (see
  `src/lib/worker-http.ts` and `POST /api/worker/sync`). Dashboard replies
  (manual button + auto-reply cron) use the same shared path
  (`src/lib/reply-service.ts`) and the same honesty rule: a reply is
  "posted" only after the worker reads it back on the page.

## Run the FastAPI service locally (this machine)

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
```

## Run in Docker (local now, VPS later)

```bash
docker build -f worker/Dockerfile -t reviewmitra-worker .
docker run -d --name reviewmitra-worker -p 8000:8000 \
  -e WORKER_SECRET='<a-long-random-secret>' \
  -v reviewmitra-profile:/app/worker/profiles \
  reviewmitra-worker
```

On a VPS the same image runs with `-p 8000:8000` behind a firewall that
only allows the Vercel app's calls (or a reverse proxy with the secret
header). Set `WORKER_URL=https://<vps-host>:8000` in Vercel.

## The one-time owner login (required for the full sync + replies)

The worker **never sees or types the owner's password**.

1. Start the service with a persistent profile dir:
   `WORKER_PROFILE_DIR=/path/to/profile` (default
   `worker/profiles/google-owner`).
2. The owner signs in once in a headed Chrome using that profile: the
   worker types the **email only** and waits; the owner types their
   password and completes 2FA on their phone (tap **Yes + the number**
   shown). The session is saved to the profile.
3. From then on the worker reuses the profile — no password, no tap.

Until that profile exists:
- `/sync` works **logged-out** but Google shows only 5 reviews of 942
  (no lazy-load on scroll) — the response reports completeness honestly
  (e.g. 5/942 = 0.5%, `complete: false`).
- `/reply` honestly reports `posted: false, error: "no Reply control
  found — are we logged in as the business owner?"`.

## Setup (venv + poller)

```bash
cd <repo>
python3 -m venv worker/.venv
worker/.venv/bin/pip install -r worker/requirements.txt
cp worker/config.example.json worker/config.json
# edit worker/config.json -> set "profile_dir" to the captured Chrome profile
```

### The Chrome profile (session capture) -- NOT done by this worker

The worker never logs in. A separate step captures a logged-in Chrome
profile for the Google account that manages the business
(publicdocc@gmail.com for New Lucky Restaurant, Kalina, Kurla):

1. On a machine with Chrome, sign in to that Google account.
2. Open Google Maps / Business Profile and confirm the business is managed.
3. Copy the Chrome profile directory (e.g. `~/.config/google-chrome/Default`)
   to the path in `config.json` ("profile_dir").
4. Make sure Chrome is NOT running with that profile when the worker starts
   (Chrome locks the profile while running).

## Running the poller (file-queue path)

```bash
# Poller (processes queued jobs continuously)
worker/.venv/bin/python worker/run_worker.py

# One-shot manual runs (no job queue)
worker/.venv/bin/python worker/gmaps_worker.py sync \
  --business-url https://share.google/Rd7mruMQjwTihYs01 --headless

worker/.venv/bin/python worker/gmaps_worker.py list-reviews \
  --business-url https://share.google/Rd7mruMQjwTihYs01 --headless

worker/.venv/bin/python worker/gmaps_worker.py post-reply \
  --business-url https://share.google/Rd7mruMQjwTihYs01 \
  --review-author "Aarav Sharma" --reply-text "Thank you! ..." --dry-run
```

`--dry-run` never types and never submits: it only checks that the review
exists and the Reply control is present. **Live posting only happens with
an explicit user approval; there is no auto-post path.**

## Networking on this VM (egress proxy + TLS interception)

This VM reaches the internet through an authenticated egress proxy, and
Chrome ignores proxy credentials from environment variables (Chromium bug
16709), so a plain Chrome launch cannot load any page
(`ERR_TUNNEL_CONNECTION_FAILED`). The egress proxy also does TLS
interception with its own CA, which Chrome's NSS store does not trust
(`ERR_CERT_AUTHORITY_INVALID`). Two pieces solve both:

1. **`worker/local_proxy.py`** — a stdlib-only forwarder on
   `127.0.0.1:8899` that adds the `Proxy-Authorization` header itself.
   `run_worker.py` and `worker/app.py` start it automatically; for manual
   runs, start it first and export
   `REVIEWMITRA_LOCAL_PROXY=http://127.0.0.1:8899`. The upstream
   credential is read from the environment and never logged or written down.
2. **`--ignore-certificate-errors`** is passed to Chrome (test/dev only).
3. The proxy's TLS interception breaks Chrome's TLS 1.3, so the worker
   also passes **`--ssl-version-max=tls1.2`**; without it google.com fails
   with `ERR_CONNECTION_CLOSED`.

## Local test status (2026-11-08, this VM)

End-to-end plumbing verified on localhost:3000 with
`GOOGLE_REPLY_TRANSPORT=worker`:

- `GET /api/worker/jobs` -> 200, `[]`; homepage -> 200; `next build` passes
  and lists `/api/worker/jobs`, `/api/worker/jobs/[id]`,
  `/api/worker/jobs/[id]/result`.
- Hand-written dry-run job -> poller picks it up -> worker runs ->
  job file ends `failed` with an honest error + a real JSON result ->
  poller reports to `POST /api/worker/jobs/<id>/result` -> **200**
  (`applied: "no-db-row"` for the test job, which has no DB row).
- **FIXED 2026-11-08: Maps now renders in this VM's worker Chrome and
  review extraction works.** The 2026-11-06 blank page was a stale /
  degraded local proxy plus the worker's fixed 3s sleeps racing Maps'
  client-side boot; the proxy is healthy now (CONNECTs to Google hosts
  all 200) and every step waits for its marker (up to 30s). The real
  blocker was a parse bug, not rendering: in UC mode
  `sb.find_elements` returns CDP Elements whose `.find_elements()` /
  `.find_element()` are `None` (the class `__getattr__` returns the
  HTML attribute or None), so the old card-scoped extraction silently
  returned "" for every field and every card was skipped (0 reviews
  even though cards were in the DOM). Extraction is now done by JS
  (`sb.execute_script` with an IIFE; bare `return` is a SyntaxError
  here). Verified 2026-11-08, logged-out, New Lucky Restaurant:
  `list-reviews` returns 5 real reviews (Adrian Rodrigues 5★, Iram
  Shah 5★, D.J. 4★, Electrofix Services 2★, shubham sharma 4★) via
  both the Maps search URL (name + city) and the raw share link
  (share.google redirects to Search; the worker now uses the Search
  page title "New Lucky Restaurant Mumbai" as the Maps query and only
  clicks a result whose name matches the query -- a bare-name search
  once opened the wrong business, "New One Lucky" in New York).
  `post-reply --dry-run` finds the review and honestly reports "no
  Reply control found -- are we logged in as the business owner?"
  (logged-out pages have no Reply buttons, as expected).
- **Still open: logged-in session + pagination.** Logged-out, Google
  shows a limited view: 5 reviews, no lazy-load on scroll, "See more
  reviews" does not expand the list, and the Sort menu does not open.
  The worker's scroll logic is in place, but loading all 942 reviews
  and the Reply buttons need the owner's logged-in Chrome profile
  (the worker never logs in; the profile must be captured on a machine
  where Maps renders -- the cloud browser's profile is not on this
  VM). The live reply path (JS click on the card's Reply button,
  `sb.type` / `sb.click` for the box and Post) is written for that
  session but cannot be verified until it exists.
- **Database from this VM:** direct Postgres is blocked by the egress
  proxy (TLS to Neon fails); DB checks use Neon's HTTP SQL endpoint
  instead (see `/tmp/neon-db-check.py`, token passed via stdin only).
  The deployed Vercel app is unaffected (it reaches Neon from Vercel's
  network, not this VM).

## Gotchas fixed during the build

- **SeleniumBase swallows exceptions** raised inside a `with SB(...)`
  block (it records the failure and returns normally, exit code 0),
  so a fatal error produced no JSON result. The `try/except` that
  emits the JSON result must be *inside* the `with` block -- see
  `cmd_list_reviews` / `cmd_post_reply` / `cmd_sync` in `gmaps_worker.py`.
- **Route nesting:** `POST /api/worker/jobs/<id>/result` needs its own
  folder `src/app/api/worker/jobs/[id]/result/route.ts`; a `route.ts`
  in `[id]/` only matches `/api/worker/jobs/<id>` (the first version
  404'd for that reason). The DB-apply helper lives in
  `src/lib/worker-queue.ts` (`applyJobOutcomeToDb`) and is shared by
  the GET status route and the POST result route.

## Config (worker/config.json)

| key | meaning |
| --- | --- |
| `profile_dir` | logged-in Chrome profile dir (empty = logged-out, read-only) |
| `business_url` | share link of the business (New Lucky: https://share.google/Rd7mruMQjwTihYs01) |
| `headless` | run Chrome headless (true on servers) |
| `poll_interval_seconds` | how often the poller checks jobs/ |
| `app_base_url` | Next.js app, for reporting job results back |

## Environment variables

| Var | Purpose |
| --- | --- |
| `WORKER_SECRET` | **Required.** Secret for `X-Worker-Secret` / `Authorization: Bearer`. |
| `WORKER_PROFILE_DIR` | Persistent Chrome profile (default `worker/profiles/google-owner`). |
| `WORKER_HEADLESS` | `true` (default) / `false` for headed runs (login only). |
| `WORKER_URL` | (Next.js side) Base URL of this service, e.g. `http://localhost:8000`. |
| `GOOGLE_REPLY_TRANSPORT` | (Next.js side) `worker` to route Google replies via this worker. |
| `REVIEWMITRA_LOCAL_PROXY` | (This VM only) local forwarder for the egress proxy; auto-started. |

## Selectors

All Google Maps selectors live in **one file**: `worker/gmaps_selectors.py`.
If Google's layout changes, fix them there — the CLI, the FastAPI
service and the poller all pick them up. Never scatter selectors.

## Files

| File | Purpose |
| --- | --- |
| `worker/gmaps_worker.py` | SeleniumBase driver: sync / list-reviews / post-reply (CLI + importable). |
| `worker/gmaps_selectors.py` | The one selector config. |
| `worker/app.py` | FastAPI service (`POST /sync`, `POST /reply`, `GET /health`). |
| `worker/run_worker.py` | File-queue poller for dashboard reply jobs (CLI path). |
| `worker/local_proxy.py` | Local forwarder for this VM's authenticated egress proxy. |
| `worker/Dockerfile` | Container image for local Docker / VPS. |
| `worker/.chrome/` | Chrome-for-Testing binary downloaded by SeleniumBase (gitignored). |
| `worker/profiles/` | Persistent Chrome profiles (gitignored — contains a live login). |
| `worker/jobs/` | File-queue job JSONs (gitignored). |

## Notes / risks

- Google Maps DOM selectors change often; they live in
  `worker/gmaps_selectors.py` — if extraction returns 0 reviews, update them
  there, not in the worker code.
- Browser automation against Google's ToS carries account risk; use the
  business owner's own account, keep the volume low, and never run it
  against accounts you don't own.
- Sessions expire: if the worker reports "no Reply control found", the
  profile session has likely expired and must be re-captured.
- Job files live in `worker/jobs/` (gitignored) and are the audit trail:
  every job keeps its full result + worker log tail.
