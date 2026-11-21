# 14 — Codebenders Prompts: Member B (Backend, Matching & Data)
**Annapoorna Link (అన్నపూర్ణ లింక్)** · tasks B1–B15 from `12-team-split.md`

## How to use this file
1. **Start a new Nexon chat** and send the context message below first.
2. Paste **one prompt at a time**, in order. After each:
   - **read Nexon's plan before approving it**
   - run the **checks** listed under the prompt
   - fix issues with short follow-ups
   - commit
   - add a row to `CODEBENDERS_USAGE.md`
3. **You own `server/`.** Member A owns `app/`. Never edit A's folder.
4. **Secrets:** only you hold the Gnani and AI-model keys, and only in backend env vars. Never in prompts, code, commits or chat.
5. **Fill in the blanks** marked `<<< >>>` (Gnani API details, AI model). The organisers confirmed the product may call external AI-model and voice APIs (doc 15).
6. **Use the IDE the way the organisers recommend** (doc 15 §3):
   - one feature at a time
   - split large prompts (likely B1, B7, B9)
   - re-plan after two failed fixes
   - start a new chat when the history gets long
7. **Hard cut-off:** last commit before **Sun 22 Nov, 11:59 PM IST**.

### Context message (send first, in a new chat)
```text
We are building "Annapoorna Link" (అన్నపూర్ణ లింక్), a web app for the ACE Builders Hackathon 2026,
Problem Statement 2: Rescue the Surplus. In Hyderabad, it connects surplus food from caterers, wedding halls,
hostel/college messes and restaurants to nearby shelters, community kitchens and NGOs, with volunteers doing
the pickup, before the food spoils.

Read these files for context: docs/02-product-spec.md, docs/03-architecture.md, docs/04-sample-data-plan.md,
docs/10-food-handling-guidance.md, docs/11-impact-assumptions.md, docs/12-team-split.md.

I am Member B (Backend, Matching & Data). I own server/. Member A owns app/; never create or edit files there.
The API contract, types and decisions D1–D12 are in docs/12-team-split.md §2. Follow them exactly.

Don't write code yet. Reply with a short summary of the product, the listing state machine, the matching
rules and my responsibilities, then wait for task B1.
```

---

## B1 · Backend skeleton with contract stubs
```text
Create the backend skeleton for Annapoorna Link in server/: project setup, security basics, the error format,
and STUB endpoints that already return the exact contract shapes from docs/12-team-split.md §2, so the
frontend can integrate immediately. No database or external APIs yet.

TECH: Node 18+, Express, TypeScript strict, zod, helmet, cors, express-rate-limit, pino, jsonwebtoken,
multer (memory storage only), Vitest + supertest, ESLint + Prettier.

STRUCTURE (server/src/)
  index.ts, app.ts (exported for tests), config.ts (zod-validated env, fail fast)
  schemas.ts      ALL types/enums from docs/12-team-split.md §2.1 as zod schemas (single source of truth)
  errors.ts       AppError + catalogue (below)
  middleware/     auth.ts (JWT, role/org on req), errorHandler.ts, rateLimit.ts, requestId.ts
  routes/         auth, demo, me, guidance, listings, offers, receiver, tasks, volunteer, impact, map,
                  voicePost, events, health
  stubs/          realistic fake responses using the demo data in docs/04-sample-data-plan.md

ENV (.env.example; never commit .env): PORT=8080, ALLOWED_ORIGIN, JWT_SECRET, DATABASE_URL, GNANI_API_KEY,
AI_API_KEY, USE_STUBS=true

ERRORS: { error_code, message, message_te }
VALIDATION_FAILED 400 · UNAUTHORIZED 401 · FORBIDDEN 403 · NOT_FOUND 404 · INVALID_STATE 409 ·
PICKUP_BY_TOO_LATE 422 · WRONG_CODE 422 · CODE_LOCKED 423 · RATE_LIMITED 429 · SERVER_BUSY 503 · INTERNAL_ERROR 500
(write message in English and message_te in simple Telugu for each; never leak stack traces).

SECURITY: CORS only ALLOWED_ORIGIN; helmet; JSON limit 100 KB; rate limits per user (or IP before login):
120 req / 10 min general, 20 / 10 min for /api/voice-post. Logs contain no request bodies or personal data.

STUBS (USE_STUBS=true, header "X-Stub: true"): every endpoint in §2.2 returns valid contract data, including
GET /api/events streaming a fake status sequence every 5 s.

TESTS: every stub response validates against its zod schema; auth required where expected; error format;
CORS; rate limit.
Scripts: dev, build, start, test, lint, migrate (placeholder). server/README.md with the contract table.
```
**Checks:**
- `npm test` passes.
- Every endpoint returns contract-shaped data with `X-Stub: true`.
- `.env` isn't tracked.

---

## B2 · Deploy + Postgres + migrations
```text
Deploy the Annapoorna Link backend and add the database.
- Hosting on <Render | Railway> (name: ______): build/start commands, PORT, health check /api/health,
  env vars (ALLOWED_ORIGIN = Member A's Vercel URL, JWT_SECRET, DATABASE_URL, USE_STUBS=true for now).
- Supabase Postgres; a small query layer (postgres.js or Kysely), migrations in server/migrations/ run by
  `npm run migrate`.
- Tables exactly as docs/03-architecture.md §3: orgs, users, receiver_needs, listings, offers, pickups, events,
  guidance_rules (+ indexes on status, pickup_by, donor_org_id, receiver_org_id, volunteer_user_id).
- /api/health reports db: "ok" | "down" with a 1 s timeout.
Give me the exact dashboard steps and a checklist to verify the live API.
```
**Checks:**
- The live `/api/health` shows `db: "ok"`.
- **Send the API URL to Member A.**

---

## B3 · Seed data (synthetic Hyderabad)
```text
Create `npm run seed` for Annapoorna Link following docs/04-sample-data-plan.md exactly.
- Deterministic (fixed random seed); re-running resets demo data.
- 12 Hyderabad areas with approximate centre coordinates; every org gets a coordinate jittered within ~500 m.
- Orgs: 4 caterers, 3 wedding halls, 3 hostel messes, 4 restaurants (donors); 3 shelters, 3 community
  kitchens, 3 NGOs (receivers, some veg_only, with intake hours). Fictional names only.
- Users: one per org + 10 volunteers (6 two-wheelers ≤ 40 meals, 4 cars ≤ 150 meals) + 1 sponsor.
  Demo accounts as in §4 with stable account_ids.
- guidance_rules from docs/10-food-handling-guidance.md §2 (including the stricter category overrides).
- 30 days of history: ~120 listings with offers, pickups and timeline events; ~90% delivered, some expired/
  cancelled; realistic times (8:30 PM–midnight), more events on weekends.
- Today's receiver_needs.
No real names, phones, emails or addresses (placeholders like @example.org).
```
**Checks:**
- Counts match doc 04.
- The impact endpoint (later) has realistic numbers.
- Re-running the seed gives identical data.

---

## B4 · Demo auth & authorization
```text
Implement demo auth for Annapoorna Link (decision D10).
- GET /api/demo/accounts → the six demo accounts (account_id, role, label, area).
- POST /api/auth/demo-login { account_id } → { token (JWT, 12 h, with user id, role, org id), user, org }.
- GET /api/me.
- Middleware: requireAuth, requireRole(...roles), and ownership helpers:
  donor → only their org's listings; receiver → only offers made to their org and listings they claimed;
  volunteer → only available tasks and their own tasks; sponsor → city-level aggregates and map only.
- pickup_code only in responses to the donor org; delivery_code only to the claiming receiver org;
  volunteers never receive codes.
Tests for every rule above (a receiver can't read another receiver's offer or codes, etc.).
```
**Checks:**
- Each test passes.
- No API response ever leaks a code to the wrong role.

---

## B5 · Guidance service
```text
Implement handling guidance for Annapoorna Link (docs/10-food-handling-guidance.md, decision D6).
- server/src/guidance/: computeSafety(items, storage, cooked_at) → { max_pickup_by, serve_by, guidance_en,
  guidance_te } using guidance_rules, applying the strictest item (category overrides, non-veg at room
  temperature → 1 h).
- GET /api/guidance?categories=&storage=&cooked_at= → that object.
- Unit tests for each storage, each override, mixed items (strictest wins), and cooked_at in the future
  (reject).
Never use words like "safe/certified/approved" in guidance text.
```
**Checks:**
- Hot biryani cooked at 9:30 PM gives a max pickup-by of 12:30 AM.
- Room-temperature curd rice gives 1 h.

---

## B6 · Listings API + expiry
```text
Implement listings for Annapoorna Link (contract §2.2).
- POST /api/listings (donor): validate with zod; total_meals = sum (kg → meals at 0.4 kg/meal per D2);
  compute safety via computeSafety; reject pickup_by > max_pickup_by with PICKUP_BY_TOO_LATE; generate a
  4-digit pickup_code and delivery_code (random, not sequential); store posted_in_ms; status "posted";
  write a timeline event; then call the matching/offer service (B8; until then, leave as posted).
- GET /api/listings (donor's own, ?status=), GET /api/listings/:id (+ timeline; any party to the listing),
  POST /api/listings/:id/cancel (donor, only before picked_up → INVALID_STATE otherwise).
- Expiry scheduler (every 30 s): listings not picked_up by pickup_by → "expired" + event + notify (B10).
- Every status change goes through one function transition(listingId, from[], to, actor) inside a DB
  transaction with a status check (no double transitions).
Tests: validation, kg conversion, pickup-by rejection, cancel rules, expiry, concurrent transition attempts.
```
**Checks:**
- Post with a late pickup-by and it's rejected.
- A listing expires on time.
- Two cancels at once give one result.

---

## B7 · Matching engine
```text
Implement the matching engine for Annapoorna Link as pure TypeScript in server/src/matching/ (no DB access
inside; pass data in), following docs/02-product-spec.md §4.

rankReceivers(listing, receivers, needs, now) → [{ receiver_org_id, score, distance_km, eta_min, reasons }]
- Distance: haversine on area-level coordinates; ETA at 20 km/h average city speed (config) + 10 min handling.
- Eligibility: food type accepted (veg_only respected), open at the ETA, remaining need ≥ 20 meals or ≥ 25% of
  the listing, arrival ≤ pickup_by + travel time with a 15-min buffer.
- score = 0.4·proximity + 0.3·need + 0.2·timeSlack + 0.1·reliability (proximity = 1 − d/10 km clamped;
  need = min(1, remaining/listing meals); timeSlack = min(1, slack minutes/60)); weights in config.
- reasons: the top 3 contributing factors as { en, te }, e.g. { en: "2.1 km away", te: "2.1 కి.మీ దూరం" },
  { en: "Needs 120 meals today", te: "ఈరోజు 120 భోజనాలు అవసరం" }, { en: "Veg accepted", te: "శాకాహారం స్వీకరిస్తారు" }.
pickVolunteer(listing, donor, receiver, volunteers, now) → nearest available volunteer with capacity ≥ meals
  who can reach donor → receiver before pickup_by; null if none.
Unit tests: veg-only exclusion, closed receivers excluded, need filter, ordering by score, reasons content,
volunteer capacity and distance, no eligible receiver → empty list.
```
**Checks:**
- Tests pass.
- Hand-check 2 listings against the seeded receivers. The ranking should make sense.

---

## B8 · Offer cascade
```text
Implement offers for Annapoorna Link (decision D5).
- After a listing is posted: rankReceivers → create an offer to rank 1 (status pending, expires_at = now + 10 min)
  → listing "offered" → notify the receiver (B10).
- GET /api/offers (receiver): pending offers for their org with the full Listing, reasons, distance, ETA.
- POST /api/offers/:id/accept: transaction: offer accepted, listing "claimed" with receiver_org,
  receiver_needs.meals_received += meals (on delivery adjust to actual), then pickVolunteer → create a task
  offer for the volunteer (or leave it in the available tasks list).
- POST /api/offers/:id/decline { reason? } or timeout (scheduler every 30 s) → next ranked receiver; after
  5 offers, open to all eligible receivers ("first to accept" offers to all at once).
- If no receiver accepts before pickup_by, the listing expires (B6).
- Every step writes timeline events.
Tests: accept, decline → next, timeout → next, 5 declines → open to all, two receivers accepting the open
offer at once → only one wins.
```
**Checks:**
- Decline in the receiver UI and the next receiver gets the offer within seconds.

---

## B9 · Volunteer tasks, codes & state machine
```text
Implement volunteer tasks for Annapoorna Link (decisions D3, D4).
- GET /api/tasks (volunteer): available tasks (claimed listings without a volunteer, within 8 km of the
  volunteer's area, capacity fits) + the volunteer's active tasks, with donor/receiver orgs, distance, deadline.
- POST /api/tasks/:id/accept → listing "volunteer_assigned" (only one volunteer can win).
- POST /api/tasks/:id/pickup { code } → must match pickup_code → "picked_up"; WRONG_CODE with remaining
  tries; after 5 wrong tries → CODE_LOCKED (the donor can see a "volunteer is having trouble with the code" note).
- POST /api/tasks/:id/deliver { code, meals_delivered } → must match delivery_code; meals_delivered ≤ total
  → "delivered"; adjust receiver_needs; update the receiver's reliability.
- PUT /api/volunteer/availability.
- All transitions via transition() with timeline events and notifications.
Integration test: the full flow post → offer → accept → task accept → pickup → deliver, plus wrong codes,
locking, and two volunteers accepting the same task.
```
**Checks:**
- The full flow works through the real UI.
- A wrong code is rejected.
- No code ever appears in a volunteer response.

---

## B10 · Realtime (SSE)
```text
Implement realtime events for Annapoorna Link (decision D7).
- GET /api/events: Server-Sent Events, auth via ?token= (validate the JWT); keep-alive comment every 20 s;
  per-user connection registry.
- publish(listingId, eventType) after every transition and offer/task change: send
  { type: "listing_status" | "offer" | "task", listing_id, status, at } to the donor org's users, the relevant
  receiver org's users and the assigned or eligible volunteers.
- Never include codes or personal data in events; clients refetch details.
- Works behind the hosting proxy (disable response buffering; correct headers).
Test: a connected client receives events for its listings only.
```
**Checks:**
- With two browser windows open, one role's action shows in the other within 2 seconds.

---

## B11 · Impact calculator
```text
Implement impact for Annapoorna Link following docs/11-impact-assumptions.md exactly.
- server/src/impact/config.ts: KG_PER_MEAL = 0.4, CO2E_PER_KG = <<< value >>>, CO2E_SOURCE = "<<< citation >>>".
- GET /api/impact?scope=me|city&from&to:
  me (donor org): meals (delivered only), kg, co2e_kg, on_time_rate, median_claim_min, rescue_rate, weekly series.
  city (sponsor): the same totals + by_area and by_donor_type breakdowns.
  assumptions: [{ key, label_en, label_te, value, source? }] always included.
- Only delivered listings count; expired/cancelled = 0.
Unit tests: formulas, kg-entered listings, zero cases, city total = sum of donors, median calculation.
```
**Checks:**
- The numbers look realistic on the seeded data.
- The assumptions match doc 11.

---

## B12 · Voice post (P1)
```text
Implement POST /api/voice-post for Annapoorna Link.
GNANI (key from GNANI_API_KEY only): <<< speech-to-text endpoint, auth, accepted audio formats, language codes
for English and Telugu, response format >>>
AI MODEL (key from AI_API_KEY only): <<< provider and model >>>
- Accept multipart "audio" (webm/ogg/mp4, ≤ 400 KB, ≤ 20 s); convert in memory with ffmpeg if Gnani needs it.
- Transcribe (try the user's language; English or Telugu).
- Ask the model to extract JSON only: { items: [{ name, category, qty_meals | qty_kg }], veg, allergens[],
  storage, cooked_at (ISO, assume today; "9:30" means 9:30 PM if now is evening) }, using our enums.
  Validate with zod; retry once on invalid JSON; then SERVER_BUSY.
- Return { draft, transcript }. Never post automatically. Never store audio; don't log the transcript.
- Empty transcript → STT_EMPTY ("Couldn't hear clearly, please try again" / Telugu).
- Daily cap per donor (e.g., 30) and a global daily cap from env.
Tests with mocked Gnani and model: success, invalid JSON then valid, empty transcript, cap reached.
```
**Checks:**
- Say "150 plates veg biryani and dal, cooked at 9:30, kept hot" and you get a correct draft.

---

## B13 · Demo scenario bots
```text
Implement POST /api/demo/scenario { name: "wedding_night" } for Annapoorna Link (docs/04-sample-data-plan.md §7).
- Creates a fresh listing for Sri Sai Caterers (150 meals: veg biryani + dal, hot, cooked 30 min ago),
  runs matching, then with delays: the bot receiver (Annadanam Community Kitchen) accepts after 20 s,
  bot volunteer Ravi accepts, "picks up" with the real code after 40 s, "delivers" after 60 s.
- Uses the same service functions as real users (no shortcuts), so events, timeline and impact all update.
- Only one scenario at a time; allowed for the sponsor account or when DEMO_MODE=true.
- Also `npm run demo:reset` to restore the seed.
```
**Checks:**
- One tap in the UI shows the whole flow, live, in about 2 minutes.

---

## B14 · Hardening
```text
Do a security, privacy and reliability pass on the Annapoorna Link backend; fix issues and give me a table.
1. Authorization: test every route with every role; codes never leak; no cross-org reads.
2. Secrets: search the repo and git history for keys; .env ignored; nothing secret in responses.
3. Privacy: only synthetic, area-level data; logs have no bodies, transcripts or personal data.
4. Abuse: rate limits; voice-post caps; payload limits; code-guessing lockout works.
5. Reliability: every outgoing call has a timeout; schedulers survive restarts (state in DB, not memory);
   SSE reconnects; /api/health shows each dependency without calling paid APIs.
6. Guardrails: grep all user-facing text for "safe", "certified", "approved", "tax", "legal" and fix it.
7. npm audit: fix high/critical.
```
**Checks:**
- The security table is complete and every item is fixed or explained.

---

## B15 · Metrics for the pitch
```text
Create `npm run metrics` for Annapoorna Link that prints, from the database (seeded + live data):
- median and p90 time from posted → claimed and posted → delivered
- on-time rate, rescue rate, expiry rate
- median posted_in_ms (donor posting time)
- meals and kg by donor type and area
- number of offers per listing before acceptance (cascade depth)
Output a markdown table I can paste into the README, clearly labelled "based on demo data".
```
**Checks:**
- Paste the table into the README's metrics section.

---

## What you deliver to Member A, and when
| Deliverable | From task | A switches from |
|---|---|---|
| Live API URL + stubs | B1–B2 | mocks → real stubs |
| Demo login | B3–B4 | mock accounts → real accounts |
| Guidance + listings | B5–B6 | mock guidance → real |
| Offers + tasks + codes | B7–B9 | mock flow → real flow |
| SSE events | B10 | fake emitter → live updates |
| Impact | B11 | mock numbers → real |
| Voice post | B12 | mock draft → real |
| Demo scenario | B13 | manual demo → one-tap demo |
