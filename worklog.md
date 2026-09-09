# ReviewMitra - Work Log

Project: Local Business Review Aggregator & AI Auto-Reply SaaS
Stack: Next.js 16, TypeScript, Tailwind 4, shadcn/ui, Prisma (SQLite), z-ai-web-dev-sdk (LLM)

---
Task ID: 0
Agent: main
Task: Initialize worklog and plan build for ReviewMitra SaaS

Work Log:
- Reviewed user's 6-document spec (PRD, TRD, Architecture, UI/UX, Schema, Sprint plan)
- Adapted PostgreSQL schema → SQLite (Prisma) for sandbox
- Identified LLM skill (z-ai-web-dev-sdk) as the AI reply engine
- Planned single-route mobile-first app at / with: landing/hero, unified inbox dashboard, AI reply drawer, pricing, WhatsApp floating button

Stage Summary:
- Build order: schema → APIs (ai/reply, reviews) → UI dashboard → AI drawer → pricing/footer → verify
- Mock data for Google/FB/Justdial reviews seeded into SQLite (real OAuth not available in sandbox)
- Real AI reply generation via z-ai-web-dev-sdk chat completions with tone + sentiment presets

---
Task ID: ALL
Agent: main
Task: Build complete ReviewMitra SaaS — schema, AI reply engine, APIs, mobile-first dashboard, AI reply drawer, pricing, WhatsApp support, sticky footer

Work Log:
- Schema: Adapted PostgreSQL spec → SQLite (Prisma). Models: User, Business, PlatformConnection (with AES-256 fields: encryptedAccessToken, tokenIv, tokenAuthTag), Review, ReviewReply, Subscription. Pushed with `bun run db:push`.
- Seed: 16 realistic reviews for "Smile Dental Care" clinic across Google (6), Facebook (4), Justdial (6) with positive/neutral/negative mix. Realistic reviewer names + Hindi/English review text matching Indian MSME tone.
- AI Engine (`src/lib/review-engine.ts`): Tone presets (Friendly/Professional/Hinglish/Brief), sentiment-aware prompt strategy. Positive → warm thanks + invite; Negative → empathy + auto-inject business phone (`+919876543210`) + zero-defensive language + offline resolution. Hinglish tone strengthened with explicit example + "50%+ transliterated Hindi" rule. Untrusted review text wrapped in CDATA to mitigate prompt injection. TONES export shared by client + server.
- API endpoints:
  * `POST /api/ai/generate-reply` — uses z-ai-web-dev-sdk chat completions (LLM skill), bumps Subscription.aiRepliesUsed counter.
  * `GET /api/reviews` — unified inbox payload (business, connections, subscription, reviews with last reply).
  * `POST /api/reviews/reply` — saves reply, marks review replied. For Justdial sets postStatus=`copied_to_clipboard`, else `posted`.
- UI components (all in `src/components/review-mitra/`):
  * `star-rating.tsx` — colored stars (green/amber/red by rating).
  * `platform-icon.tsx` — Google/Facebook/Justdial branded circles.
  * `review-card.tsx` — sentiment badge, time-ago, expandable text, AI Reply button, replied state with reply snippet.
  * `ai-reply-drawer.tsx` — vaul bottom sheet, flex-column layout (fixed header, scrollable middle, sticky footer) so Send Reply Live button is always clickable. Auto-generates on open, tone pills, editable draft, Regenerate, copy vs send-live logic per platform.
  * `whatsapp-support.tsx` — floating button with popover that links to `wa.me/919876543210?text=Namaste,%20mujhe%20ReviewMitra...`.
  * `pricing-section.tsx` — ₹499 Starter + ₹899 Growth plans, "Most popular" badge on Growth.
- Page (`src/app/page.tsx`): min-h-screen flex flex-col root. Sticky header, Hero (with phone mockup), Dashboard section (#dashboard), Pricing section (#pricing), Security section (#security), SiteFooter (sticky via mt-auto + flex-1 main), WhatsAppSupport floating.
- Lint: 0 errors, 0 warnings after eslint cleanup.
- Agent Browser self-verification (mobile 390×844 + desktop 1280×800):
  * Page loads, no hydration/runtime errors.
  * 16 review cards render correctly.
  * AI Reply drawer opens, generates context-aware replies (positive review mentions specific compliments; negative review injects +919876543210 phone for resolution).
  * Tone switch verified: Hinglish tone produces actual transliterated Hindi reply.
  * "Send Reply Live" button is fully clickable after drawer layout fix — POST /api/reviews/reply returns 200, DB shows ReviewReply saved + review.is_replied=true. Verified end-to-end with Ankit Verma (Google, posted) and Arjun Malhotra (Justdial, copied_to_clipboard).
  * Replied cards show "You replied · [tone] tone" snippet.
  * Filters verified: Justdial filter shows exactly 6 reviews; 1★ + Justdial shows 1 review.
  * WhatsApp floating button opens popover with correct pre-filled Hindi wa.me link.
  * Pricing section renders both plan cards with feature lists.
  * Sticky header at top=0 on both viewports; footer pushed naturally on long content.

Stage Summary:
- All 6 spec docs implemented as a working demo. Single-tenant demo (one business "Smile Dental Care") for sandbox simplicity.
- Production PostgreSQL / OAuth / Razorpay / Redis / BullMQ / Apify stubs replaced with mock equivalents — but data model, encryption fields, sentiment-aware LLM prompting, tone presets, Justdial clipboard fallback, WhatsApp support, and ₹499/₹899 pricing are all real and reflect the spec.
- Tech: Next.js 16 + Tailwind 4 + shadcn/ui + Prisma SQLite + z-ai-web-dev-sdk (LLM skill).
- 0 lint errors. Dev server runs cleanly on port 3000. All core user flows (read reviews, generate AI reply, post/copy reply, filter, WhatsApp support, view pricing) verified working in browser.
