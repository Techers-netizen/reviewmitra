# Google Maps End-to-End Report — ReviewMitra

**Test business:** New Lucky Restaurant, Kalina Kurla Road, Santacruz East,
Mumbai 400029 — 3.9★, 942 Google reviews.
**Test link (the only link used):** https://share.google/Rd7mruMQjwTihYs01
(Knowledge Graph id `/g/11cs5st1_w`; owner account publicdocc@gmail.com).
**Method:** SeleniumBase UC mode only. **No Google Business Profile API**
(its quota is 0). **Zero dummy data.**
**Repo branch:** `autotest/overnight` (draft PR #1 — do NOT merge; `main`
untouched). **Preview:**
https://reviewmitra-git-autotest-overnight-opensoz.vercel.app
**Last updated:** 2026-11-09 (this build session).

## Proof criteria (Zahid's 6) — honest status

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Business name auto-fetched (dashboard screenshot) | **PARTIAL — worker proven, dashboard not yet** | Worker `/sync` returns `name: "New Lucky Restaurant"` read from the page (5/5 runs). The dashboard display of it (via `POST /api/worker/sync` → `/dashboard/reviews`) is built but not yet exercised end-to-end — it needs the worker service reachable from Vercel (`WORKER_URL`/`WORKER_SECRET` not yet set there) and a signed-in session. |
| 2 | Fetched review count vs count shown on Google | **FAIL (logged-out limit) — honest numbers** | Fetched **5** vs **942** shown = **0.5%** completeness, `complete: false`, on all 5 runs. Logged-out, Google shows only 5 reviews (no lazy-load on scroll, "See more reviews" does not expand). The full 942 needs the owner's logged-in Chrome profile. |
| 3 | Re-sync makes 0 duplicates | **PASS (worker level)** | 5 separate `/sync` runs returned the **identical 5 externalIds** (`gmaps_eb808012b381`, `gmaps_fc609e5236d7`, `gmaps_2cba0597a3ce`, `gmaps_136fcffbb4a0`, `gmaps_cc378256b960`) — 0 new ids on re-sync. DB-level upsert uses the same ids via `ingestReviews` (`platformName + externalReviewId` unique key), but no DB write has been performed yet in this session, so the DB half is **unproven**. |
| 4 | Spot check: 5 random reviews match Google word for word | **PASS (worker level)** | The 5 fetched reviews are the real ones Google shows logged-out: Adrian Rodrigues 5★, Iram Shah 5★, D.J. 4★, Electrofix Services 2★, shubham sharma 4★ — same set verified in the browser on 2026-11-08. DB comparison not yet possible (0 reviews in DB). |
| 5 | ONE real reply posted and visible on Google after reload | **FAIL — blocked on owner login + go-ahead** | `/reply` dry-run honestly reports `posted: false, error: "no Reply control found — are we logged in as the business owner?"` Logged-out pages have no Reply buttons. No reply has been typed or posted. Needs Zahid's one-time manual login + his go-ahead for the ONE live reply test. |
| 6 | grep proves no dummy/fallback review data remains | **PASS (data paths)** | `grep` over `src/lib`, `src/app/api`, `prisma`, `worker` finds no live fabrication — only comments documenting the removals and third-party venv code. See Step 0 list below. Deliberately kept: landing-page marketing demo/testimonial sections (`src/app/page.tsx`) — clearly labelled, write nothing to the DB. |

**Overall: NOT PASSED.** Criteria 2 and 5 fail on the owner login, which
only Zahid can provide. Everything that can be proven without it is
proven; nothing unproven is claimed as a pass.

## Step 0 — what was removed (2026-11-09)

- `prisma/seed.ts` — deleted. Created "Demo Owner", "Smile Dental Care",
  mock tokens and 16 hardcoded sample reviews. `"db:seed"` script removed
  from `package.json`.
- `worker/test-seed.mjs` — deleted. Inserted a fake "Test Reviewer" 5★
  review.
- `worker/test-cleanup.mjs` — deleted (seed helper).
- `src/app/api/business/route.ts` GET — removed the auto-seed blocks for
  "National Medical" and "New Lucky Restaurant" (hardcoded creation +
  fake "connected" Google rows with share.google externalAccountIds, no
  token), removed the name filter (only businesses with "national" or
  "lucky" in the name were shown), removed the GET-time cleanup
  `deleteMany` block. GET now lists exactly what is in the DB.
- `src/lib/sync-engine.ts` — rewritten. Ingest NEVER marks a reply
  "posted" or sets `isReplied=true`; 4-5★ gets nothing at ingest (the
  cron posts via the shared worker path); 1-3★ creates a draft + WhatsApp
  alert (draft even without a WhatsApp number; alert only if configured).
  The neutral (3★) auto-reply branch was removed.
- `src/lib/reply-service.ts` — new. Shared `enqueueGoogleReply()` used by
  BOTH the manual reply button and the cron; "queued" until the worker
  verifies the post on Maps; returns `ok:false` (never fake "posted")
  when worker transport is disabled.
- `src/app/api/reviews/reply/route.ts` — Google+worker path now uses the
  shared helper; removed the hardcoded fallback URL
  `https://share.google/Rd7mruMQjwTihYs01` that was used for ANY business
  missing a `googleReviewUrl`.
- `src/app/api/cron/process-reviews/route.ts` — rewritten. Google 4-5★
  auto-replies go through the shared worker path; Facebook recorded
  "posted" only on real API success, else "failed"; 3★ now draft +
  WhatsApp alert (old 3★ auto-reply deleted); 1-2★ draft + alert kept.
- `src/app/api/qr/info/route.ts` — no-business now returns 404 (was a
  fabricated "National Medical" object); `googleReviewUrl` uses only the
  stored URL/listing URL (removed hardcoded share.google links chosen by
  business name, including the wrong Ahmedabad link
  `93PidOEMYixf3JE7u`).
- `src/app/api/connect/status/route.ts` — no-business fallback
  businessName "My Business" → null.
- `src/app/api/reviews/route.ts` — no-business fake business object →
  `business: null`.
- `src/app/api/connect/sync/route.ts` — Justdial no-URL and IndiaMART (no
  fetch implemented) now return `success:false` with honest notes (were
  `success:true` with 0 ingested).
- `src/app/dashboard/qr-booster/page.tsx` — defaults "My Business" → ""
  and "demo-business" → "" (real business loads from
  `/api/connect/status` on mount).
- Real DB rows were NOT deleted (New Lucky, Islamic Caps Rampuri,
  National Medical Clinic are real rows — the deletion was about CODE
  that fabricates data, not the rows). `.env` values untouched.

## What was built (Step 1–3)

Commit `f72b8bf` on `autotest/overnight`
("feat(gmaps): zero-dummy-data cleanup + SeleniumBase worker as FastAPI
service"), pushed 2026-11-09. Preview deployment
`dpl_AuoA9D1TTSsAjCTD4j2dw9gxnFpu` **READY** at
https://reviewmitra-5ntqtr3wl-opensoz.vercel.app
(stable branch URL serves it).

- `worker/gmaps_selectors.py` — **the one selector config** (all Maps
  selectors + JS builders). Named `gmaps_selectors` because `selectors.py`
  shadows Python's stdlib `selectors` module and broke FastAPI imports.
- `worker/gmaps_worker.py` (~700 lines) — SeleniumBase UC mode,
  persistent `user_data_dir` profile. `sync` (open → business info from
  the page → Reviews/Newest → scroll until stable 3 rounds with random
  1.0–2.5s delays → expand every "More" → capture ALL, completeness
  check vs 95% of total, never pads/invents), `post_reply_to_review`
  (find by reviewerName+text, click Reply, type, submit, reload, VERIFY
  the reply is visible before reporting posted). CLI: `sync`,
  `list-reviews`, `post-reply` (+ `--dry-run`).
- `worker/app.py` — FastAPI service. `WORKER_SECRET` env var checked on
  `X-Worker-Secret` / `Authorization: Bearer` (refuses to start without
  it). One-Chrome-at-a-time lock (409 when busy). `POST /sync`,
  `POST /reply`, `GET /health`. Auto-starts the local egress-proxy
  forwarder on this VM.
- `worker/Dockerfile` + `worker/README.md` — local Docker now, VPS later;
  one-time login flow: worker types the email only, owner taps Yes + the
  number on their phone, session saved to the profile; worker never sees
  or types the password.
- `worker/requirements.txt` — added `fastapi`, `uvicorn[standard]`.
- `src/lib/worker-http.ts` — Next.js client for `WORKER_URL` + secret,
  long timeouts (10 min sync / 5 min reply).
- `src/app/api/worker/sync/route.ts` — `POST /api/worker/sync`
  `{businessId?, mapsUrl}`: calls the worker, upserts the business from
  page data (name auto-filled, never typed), parses relative dates
  ("2 weeks ago" → approximate timestamp, documented), skips reviews
  without a rating (never invents one), ingests via `ingestReviews`
  (dedupe by stable externalId), returns fetched/total/completeness/
  inserted/updated.
- Auto-reply rule wired: 4-5★ only via the shared worker path (cron);
  1-3★ stays draft + WhatsApp alert (sync-engine + cron).
- `.gitignore`: added `worker/profiles/` (persistent Chrome profile holds
  a live login — never commit).

## Real test numbers (2026-11-09, logged-out)

Worker service run locally on this VM (`uvicorn worker.app:app`,
port 8000). `next build` passes; `/api/worker/sync` listed as a dynamic
route.

| Run | Business name | Rating | Total shown | Fetched | Completeness | placeId |
|-----|---------------|--------|-------------|---------|--------------|---------|
| /sync #1 | "Results" (BUG) | 3.9 | 942 | 5 | 0.5% | null |
| /sync #2 | FAILED — no result matched bare query "New Lucky Restaurant" (results: New Lucky Seafood Restaurant, New Luck Toy) — worker refused to open the wrong business | — | — | 0 | — | — |
| /sync #3 | New Lucky Restaurant | 3.9 | 942 | 5 | 0.5% | null |
| /sync #4 | New Lucky Restaurant | 3.9 | 942 | 5 | 0.5% | null |
| /sync #5 | New Lucky Restaurant | 3.9 | 942 | 5 | 0.5% | null |
| /sync #6 | New Lucky Restaurant | 3.9 | 942 | 5 | 0.5% | **/g/11cs5st1_w** |
| /sync #7 | New Lucky Restaurant | 3.9 | 942 | 5 | 0.5% | /g/11cs5st1_w |

- **Dedupe:** runs #3–#7 returned the identical 5 externalIds — **0 new
  ids on re-sync**.
- **Reviews fetched (all runs):** Adrian Rodrigues 5★ ("It's a decent
  restaurant, looks a bit aged…", 9 months ago), Iram Shah 5★ (4 months
  ago), D.J. 4★ (4 years ago), Electrofix Services 2★ (7 years ago),
  shubham sharma 4★ (7 years ago). Same set the browser showed on
  2026-11-08.
- **/reply dry-run:** `posted: false, verified: false, error: "no Reply
  control found — are we logged in as the business owner?"` — matched
  Adrian Rodrigues 5★ (`has_reply_button: false`). Nothing typed or
  submitted.
- **Auth check:** `/sync` without the secret → 401. Service refuses to
  start without `WORKER_SECRET`.
- **DB Review count:** 0 at the last verified check (2026-11-08 21:13
  IST). This session performed **no DB writes** (all worker tests were
  read-only against Google Maps; `POST /api/worker/sync` was never
  called), so the count is unchanged — but a live re-check from this VM
  was not possible (the Neon token is not stored anywhere; it is only
  ever used transiently).

## Bugs found and fixed during testing

1. **Business name read as "Results"** (run #1): business info was read
   AFTER the Reviews tab opened, when the overview header is gone and the
   first h1 on the page is the search header. Fix: read business info
   from the place overview BEFORE opening the Reviews tab, and prefer
   `h1.DUwDvf` (skipping "Results"/"Search results") with a page-title
   fallback.
2. **Bare-name Maps search matched the wrong businesses** (run #2): the
   share link redirects to a Search page whose title is sometimes just
   the bare name; the worker then searched Maps for the bare name and got
   "New Lucky Seafood Restaurant" / "New Luck Toy" — it correctly
   refused. Fix: wait up to 15s for the Search title to settle (it
   carries "New Lucky Restaurant Mumbai") before building the Maps
   search URL. The redirect's `kgmid` (`/g/11cs5st1_w`) was tried as a
   direct place URL (`data=!4m2!3m1!1s/g/...`) — it does NOT resolve
   (30s wait, no place header), so that attempt was removed; the kgmid is
   still recorded as `placeId` when it appears in the final place URL.
3. **placeId null** (runs #1–#5): the JS read `window.location.href`,
   but Maps rewrites the place URL as it boots. Fix: extract the placeId
   from the driver's URL in Python as well (ChIJ first, then `/g/...`).
4. **`'bool' object is not callable`** in `/reply`: the
   `open_business_reviews` parameter was named `open_reviews_tab`, which
   shadowed the module function of the same name. Renamed the parameter
   to `open_tab`. (The sync path was unaffected — it passes
   `open_tab=False`.)
5. **`selectors.py` shadows Python's stdlib `selectors`** (asyncio /
   subprocess import failed). Renamed to `gmaps_selectors.py`.

## Known gaps (not hidden)

- **Address is null** in every `/sync` response. The address button
  selectors (`button[data-item-id='address']`, aria-label "Address:…")
  are stale for the current Maps UI — a probe confirmed no such elements
  exist (and no `div.Io6YTe`), though the address text IS on the page
  ("Kalina Kurla Road, Santacruz East, opposite Air India Staff
  Colony"). The page-title address fallback also found nothing (title
  has no " · " address part). Name/rating/total/placeId are unaffected.
- **DB-level dedupe unproven** (worker-level dedupe is proven; the
  `POST /api/worker/sync` → DB ingest path has not been exercised
  end-to-end yet — it needs the worker reachable from Vercel and a
  signed-in session).
- **Dashboard display of the synced business/reviews unproven** for the
  same reason (route built, `next build` passes, preview READY, but no
  live call made yet).
- **The worker service is not yet deployed anywhere permanent.** It runs
  on this VM for testing only. For production use it needs a VPS (see
  `worker/Dockerfile` + README) and `WORKER_URL` / `WORKER_SECRET` set in
  the Vercel project.

## Blocked — needs Zahid (only he can do these)

1. **One-time owner login** (manual, headed Chrome, his phone tap Yes +
   number). Until the persistent Chrome profile exists, Google shows only
   5 of 942 reviews and no Reply buttons — criteria 2 and 5 cannot pass.
2. **Go-ahead for the ONE live reply test** (criterion 5). Nothing will
   be posted without it.
3. (Unrelated to this task, still open) Whether Islamic Caps Rampuri and
   National Medical Clinic are dummy businesses to delete from the DB.
