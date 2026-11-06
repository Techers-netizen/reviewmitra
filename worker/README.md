# ReviewMitra Google Maps worker (SeleniumBase, UC mode)

Posts Google Maps review replies from the ReviewMitra dashboard **without the
official GBP API**, by driving a real Chrome logged in as the business owner.

## How it works

```
Dashboard "Post Reply"
  -> POST /api/reviews/reply            (creates a ReviewReply row, status "queued")
  -> writes worker/jobs/job_<id>.json   (src/lib/worker-queue.ts)
  -> run_worker.py polls jobs/          (every 10s)
  -> gmaps_worker.py (SeleniumBase UC)  opens Google Maps with the stored
     Chrome profile, finds the review, posts the reply, READS IT BACK
  -> POST /api/worker/jobs/<id>/result  updates the DB row:
     verified on page  -> postStatus "posted", review.isReplied = true
     anything else     -> postStatus "failed" + error surfaced to the dashboard
```

A reply is **only** recorded as `posted` when the worker reads it back on the
page. Failed replies are recorded as `failed` -- the old false-"posted" bug
is fixed in `src/app/api/reviews/reply/route.ts`.

## Setup

```bash
cd <repo>
python3 -m venv worker/.venv
worker/.venv/bin/pip install -r worker/requirements.txt
# UC mode downloads its own ChromeDriver on first run; a system Chrome is
# NOT required. First run needs internet access.
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

## Running

```bash
# Poller (processes queued jobs continuously)
worker/.venv/bin/python worker/run_worker.py

# One-shot manual runs (no job queue)
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
   `run_worker.py` starts it automatically; for manual runs, start it first
   and export `REVIEWMITRA_LOCAL_PROXY=http://127.0.0.1:8899`. The upstream
   credential is read from the environment and never logged or written down.
2. **`--ignore-certificate-errors`** is passed to Chrome (test/dev only).
3. The proxy's TLS interception breaks Chrome's TLS 1.3, so the worker
   also passes **`--ssl-version-max=tls1.2`**; without it google.com fails
   with `ERR_CONNECTION_CLOSED`.

## Local test status (2026-11-06, this VM)

End-to-end plumbing verified on localhost:3000 with
`GOOGLE_REPLY_TRANSPORT=worker`:

- `GET /api/worker/jobs` -> 200, `[]`; homepage -> 200; `next build` passes
  and lists `/api/worker/jobs`, `/api/worker/jobs/[id]`,
  `/api/worker/jobs/[id]/result`.
- Hand-written dry-run job -> poller picks it up -> worker runs ->
  job file ends `failed` with an honest error + a real JSON result ->
  poller reports to `POST /api/worker/jobs/<id>/result` -> **200**
  (`applied: "no-db-row"` for the test job, which has no DB row).
- **NOT verified here: the Maps page itself never renders in this VM.**
  The search URL loads the Maps shell (title "Google Maps") but the
  content stays blank; the place URL times out (`ERR_TIMED_OUT` /
  `chrome-error://chromewebdata/`). So review extraction selectors
  (`div[data-review-id]` etc.) and the dry-run "Reply control present"
  check are still unverified against a real rendered page, and the
  worker fails every job here with "business page failed to load".
  First run on a machine with normal internet will tell whether the
  selectors are right.
- **Database is unreachable from this VM.** Direct Postgres connections
  are denied by the assistant's network policy: the connection is
  answered with "Database connections is turned off for this assistant.
  To allow it, ask the user to open Muse settings -> Permissions ->
  Direct network protocols and switch databases from Deny to Ask."
  So the DB-backed part of the local test (seed a test business/review,
  POST /api/reviews/reply, watch the ReviewReply row go queued ->
  failed/posted) could NOT run here. `worker/test-seed.mjs` /
  `worker/test-cleanup.mjs` are provided for that test once DB access
  is allowed. The deployed Vercel app is unaffected (it reaches Neon
  from Vercel's network, not this VM).

## Gotchas fixed during the build

- **SeleniumBase swallows exceptions** raised inside a `with SB(...)`
  block (it records the failure and returns normally, exit code 0),
  so a fatal error produced no JSON result. The `try/except` that
  emits the JSON result must be *inside* the `with` block -- see
  `cmd_list_reviews` / `cmd_post_reply` in `gmaps_worker.py`.
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

## Notes / risks

- Google Maps DOM selectors change often; `gmaps_worker.py` tries several
  selector strategies and logs what it finds. If extraction returns 0
  reviews, update `REVIEW_CARD_SELECTORS` / `TEXT_SELECTORS`.
- Browser automation against Google's ToS carries account risk; use the
  business owner's own account, keep the volume low, and never run it
  against accounts you don't own.
- Sessions expire: if the worker reports "no Reply control found", the
  profile session has likely expired and must be re-captured.
- Job files live in `worker/jobs/` (gitignored) and are the audit trail:
  every job keeps its full result + worker log tail.
