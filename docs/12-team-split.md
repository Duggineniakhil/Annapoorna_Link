# 12 — Team Split: Build Work for Two Members
**Annapoorna Link (అన్నపూర్ణ లింక్)** · build work only. Submission, deck, video and README writing are not covered here.

Both members build in the **Codebenders IDE** and log their own key prompts in `CODEBENDERS_USAGE.md`.

**Before you start (from the kick-off, doc 15):**
- Both of you register through **app.codebenders.ai/hackathon**, claim the coupon (**8 million credits each**), and sign in to the IDE with that same email.
- Work in **chat-to-build** mode with the **Nexon** agent. Read Nexon's plan before approving it, and build one feature at a time.
- If one of you runs low on credits, move the project to the other's account. Credits can't be transferred.
- **Last commit before Sun 22 Nov, 11:59 PM IST.** Commits are tracked, and nothing can be built or committed after that.

---

## 1. Who owns what
| | **Member A: Frontend & Experience** | **Member B: Backend, Matching & Data** |
|---|---|---|
| Owns folders | `app/` | `server/` |
| Core job | Every screen for donors, receivers, volunteers and sponsors; EN/TE; map; live updates on screen | API, database, auth, matching engine, offers cascade, state machine, realtime events, impact maths, seed data, voice post |
| Deploys | Frontend (Vercel) | Backend (Render/Railway) + Postgres (Supabase) |

**Rule:** you never edit each other's folders. If you need a change there, ask. This avoids merge conflicts at 2 AM.

## 2. Agree these first (30 min together, before splitting)
These are the shared contracts. Member A uses **mocks** until B's endpoints are live.

### 2.1 Core types (TypeScript; B defines them in `server/src/schemas.ts`, A mirrors them in `app/src/types/api.ts`)
```
Role        = "donor" | "receiver" | "volunteer" | "sponsor"
DonorType   = "caterer" | "wedding_hall" | "hostel_mess" | "restaurant"
Storage     = "hot" | "room" | "chilled"
Category    = "rice_dish" | "curry" | "bread" | "dry_snack" | "sweet" | "dairy_based" | "salad_cut_fruit"
Allergen    = "nuts" | "peanuts" | "dairy" | "gluten" | "egg" | "seafood" | "soy" | "sesame"
Status      = "posted" | "offered" | "claimed" | "volunteer_assigned" | "picked_up" | "delivered" | "expired" | "cancelled"

Org         { id, type: "donor"|"receiver", donor_type?, name, area, lat, lng, veg_only?, open_from?, open_to? }
User        { id, role, display_name, org_id?, lang: "en"|"te", vehicle?, capacity_meals?, available? }
ListingItem { name, category, qty_meals, qty_kg? }
Listing     { id, donor_org, items: ListingItem[], total_meals, veg, allergens: Allergen[], storage, cooked_at,
              pickup_by, status, created_at, posted_in_ms,
              receiver_org?, volunteer?, pickup_code?, delivery_code?,   // codes only for the right role
              matched_receiver?: { name, area, distance_km? },          // added in A5 (B to confirm)
              volunteer_vehicle?,                                        // added in A5 (B to confirm)
              timeline?: TimelineEvent[],                                // on GET /api/listings/:id
              safety: { max_pickup_by, serve_by, guidance_en, guidance_te } }
Offer       { id, listing: Listing, rank, score, reasons: [{ en, te }], expires_at, distance_km, eta_min,
              status: "open"|"accepted"|"declined"|"expired",                  // "open" = awaiting the receiver
              volunteer_first_name?: string|null, volunteer_eta_min?: number|null }  // assigned volunteer, else best candidate
Task        { id, listing: Listing, donor_org, receiver_org, distance_km, deadline,
              status: "open"|"accepted"|"picked_up"|"delivered", meals, vehicle_fit,
              pickup: { name, area, lat, lng }, delivery: { name, area, lat, lng, serve_by },
              volunteer_id? }
TimelineEvent { type, status, at, actor_role, note? }
Impact      { meals, kg, co2e_kg, on_time_rate, median_claim_min, rescue_rate, assumptions: [{ key, label_en, label_te, value, source? }],
              from, to, weekly: [{ week_start, meals }],             // added in A11 (B to confirm); first bar starts at `from`
              by_area?: [{ key, meals }], by_donor_type?: [{ key, meals }] }  // city only, meals delivered, largest first
```

### 2.2 API (B builds, A calls). Every request except login sends `Authorization: Bearer <jwt>`
| Endpoint | Request | Response |
|---|---|---|
| `POST /api/auth/demo-login` | `{ account_id }` | `{ token, user, org? }` |
| `GET /api/demo/accounts` | none | `[{ account_id, role, label, area }]` |
| `GET /api/me` | none | `{ user, org? }` |
| `GET /api/guidance` | `?categories=&storage=&cooked_at=` | `{ max_pickup_by, serve_by, guidance_en, guidance_te }` |
| `POST /api/listings` | donor: `{ items, veg, allergens, storage, cooked_at, pickup_by, posted_in_ms }` | `Listing` |
| `GET /api/listings` | donor: own; `?status=` | `Listing[]` |
| `GET /api/listings/:id` | party to the listing | `Listing` + `timeline: TimelineEvent[]` |
| `POST /api/listings/:id/cancel` | donor | `Listing` |
| `GET /api/offers` | receiver: pending offers | `Offer[]` |
| `GET /api/offers/:id` | receiver: own offer, any status | `Offer` |
| `POST /api/offers/:id/accept` · `/decline` | receiver | `Listing` (includes the receiver's `delivery_code`, never `pickup_code`; the donor never gets the delivery code) / `{ ok }` |
| `GET /api/receiver/history` | receiver: past offers, newest first (max 50) | `[{ offer_id, offer_status, listing: Listing, meals_delivered \| null, at }]` |
| `GET /api/receiver/needs` · `PUT /api/receiver/needs` | receiver: `{ meals_needed, veg_only, open_from, open_to }` | needs |
| `GET /api/tasks` | volunteer: available + mine | `Task[]` |
| `POST /api/tasks/:id/accept` | volunteer | `Task` |
| `POST /api/tasks/:id/pickup` | volunteer: `{ code }` | `Listing` |
| `POST /api/tasks/:id/deliver` | volunteer: `{ code, meals_delivered }` | `Listing` |
| `PUT /api/volunteer/availability` | `{ available }` | `{ ok }` |
| `GET /api/tasks/:id` (added in A8, B to confirm) | volunteer: open task or own task; never sends codes | `Task` |
| `GET /api/volunteer/availability` (added in A8, B to confirm) | volunteer | `{ available }` |
| `GET /api/volunteer/history` (added in A8, B to confirm) | volunteer: own delivered tasks | `[{ id, items_title, meals, delivered_at, donor_area, receiver_area }]` |
| `GET /api/listings` for receivers (added in A8, B to confirm) | receiver: own claimed / volunteer_assigned / picked_up listings, with `delivery_code`, no `pickup_code` | `Listing[]` |

Task errors (added in A8, B to confirm): accepting while unavailable or with a task already active is 409 (`VOLUNTEER_UNAVAILABLE`, `TASK_ALREADY_ACTIVE`). A wrong pickup or delivery code is 422 `WRONG_CODE` with `tries_left`; after 5 wrong tries the code is locked, 423 `CODE_LOCKED`. The pickup code is the donor's `listing.pickup_code`; the delivery code is the receiver's `listing.delivery_code`.

Live events (added in A9, B to confirm): `GET /api/events` sends `{ type: "listing_status", listing_id, status, at }` only to the parties of the listing: the donor org, the receiver org that claimed it, kitchens that were offered it (only for `claimed` / `cancelled` / `expired`, so their offer closes), and volunteers (every status from `claimed` on, since claimed food is a task). Events carry no names; the app looks up the listing when it needs one. The app falls back to polling every 15 s after 3 failed connections.
| `GET /api/impact` | `?scope=me|city&from=&to=` (ISO dates; default this month); `me` = donor, `city` = sponsor | `Impact` (+ `by_area`, `by_donor_type` for city) |
| `GET /api/map` | sponsor/city: area-level points | `{ donors: Org[], receivers: Org[], recent: [{ listing_id, area, meals, at }] }`; `recent` = the 10 newest deliveries, newest first; `area` is the donor's area (no receiver, so the app draws no lines) |
| `POST /api/voice-post` (P1) | donor: multipart `audio` (part has the recording's own type: `audio/webm;codecs=opus`, `audio/ogg;codecs=opus` or `audio/mp4`; ≤ 20 s); optional `lang` = `en`\|`te` STT hint (added in A12, B to confirm) | `{ draft: { items, veg, allergens, storage, cooked_at }, transcript }`; nothing heard → 422 `STT_EMPTY` with `message`/`message_te` (added in A12, B to confirm) |
| `GET /api/events` | SSE; token as `?token=` | stream of `{ type: "listing_status"\|"offer"\|"task", listing_id, status, at }` |
| `POST /api/demo/scenario` | sponsor/demo: `{ name: "wedding_night" }` | `{ started: true }` |
| `GET /api/health` | none | `{ ok, db, version }` |

**Errors everywhere:** `{ error_code, message, message_te }` (e.g., `VALIDATION_FAILED`, `PICKUP_BY_TOO_LATE`, `WRONG_CODE`, `INVALID_STATE`, `FORBIDDEN`, `RATE_LIMITED`, `SERVER_BUSY`).

### 2.3 Decisions (these override anything above that differs)
| # | Topic | Decision |
|---|---|---|
| D1 | **Locations** | Synthetic, area-level coordinates only (doc 04). No real addresses, names or phones. "Demo data" label on screens with sample data. |
| D2 | **Quantities** | Stored as meals (integer). kg is optional; meals = kg ÷ 0.4 when only kg is given (doc 11). |
| D3 | **Status machine** | As in doc 03 §4. Only the server changes status; clients never send a status directly, only actions (accept, pickup with code, deliver with code, cancel). |
| D4 | **Handover codes** | 4-digit pickup code shown **only to the donor**; 4-digit delivery code shown **only to the claiming receiver**. The volunteer enters each code. 5 wrong tries → locked, ask the other party. |
| D5 | **Offer cascade** | Offer to the top receiver with a **10-minute** window; on decline or timeout, the next one; max 5; then open to all eligible receivers ("first to accept"). |
| D6 | **Pickup-by** | The server computes `max_pickup_by` from doc 10. The donor may pick earlier, never later (`PICKUP_BY_TOO_LATE`). Listings auto-expire at pickup-by if not picked up. |
| D7 | **Realtime** | SSE at `/api/events` + 15 s polling fallback. Events carry ids and status; clients refetch details. |
| D8 | **Languages** | All UI strings in `app/src/i18n/en.ts` and `te.ts`; the server returns `message` and `message_te`; reasons and guidance come in both. Language choice is saved per user. |
| D9 | **Map** | Leaflet + OpenStreetMap tiles with attribution. "Navigate" opens a Google Maps URL with the area coordinates. No map API keys. |
| D10 | **Auth (demo)** | Demo login by account id → JWT (12 h) with role and org. No passwords or phone numbers in the demo. |
| D11 | **Config** | Frontend env vars: `VITE_API_BASE_URL`, `VITE_USE_MOCKS` (default `true`). After A2, A gives B the frontend URL for `ALLOWED_ORIGIN`. |
| D12 | **Hosting** | Vercel (frontend), Render/Railway (backend), Supabase (Postgres). Codebenders provides no hosting. |

## 3. Member A: Frontend & Experience
| # | Task | Done when |
|---|---|---|
| A1 | **PWA skeleton**: React + Vite + TS + Tailwind, routes per role, EN/TE i18n with toggle, layout, "Demo data" label component | App opens on a phone; language toggle switches every visible string |
| A2 | **Frontend deploy** (Vercel), redeployed after every feature | Public URL works in incognito |
| A3 | **Demo login & role routing**: account picker from `/api/demo/accounts`, JWT storage, route guards per role, role home screens | Each demo account lands on its own home |
| A4 | **Donor Quick Post** (D2): food chips + quantity, storage, cooked-at, pickup-by suggested from `/api/guidance`, veg/allergens, post timer, "repeat last post" | A post takes < 60 s; a late pickup-by is blocked with a clear message |
| A5 | **Donor listings & detail**: active and past listings, status timeline, matched receiver/volunteer, **pickup code**, cancel | Timeline updates without reload |
| A6 | **Safety card component** (doc 10): storage, countdown, allergens, veg flag, guidance, disclaimer | Shown on every listing, offer and task |
| A7 | **Receiver**: incoming offers with countdown + match reasons, accept/decline, offer detail with **delivery code**, today's needs settings, history | Accepting an offer assigns it and shows the delivery code |
| A8 | **Volunteer**: availability toggle, available tasks (distance, deadline), active-task stepper (navigate → enter pickup code → navigate → enter delivery code + meals) | Full pickup and delivery works on a phone |
| A9 | **Live updates**: SSE hook with polling fallback, toasts, status badges everywhere | A change by one role appears for the others within seconds |
| A10 | **Map** (Leaflet/OSM): donor and receiver area markers, route line for an active task, city activity map for sponsors | Map loads fast on mobile; attribution shown |
| A11 | **Impact dashboards**: donor "My impact" and sponsor city dashboard, "How we calculate this" panel, printable monthly report | Numbers match `/api/impact`; assumptions visible |
| A12 | **Voice post UI** (P1): hold-to-talk, send to `/api/voice-post`, prefilled form to confirm | Spoken English or Telugu fills the form |
| A13 | **Errors, empty states, settings, about/safety page** in EN/TE | No raw error text anywhere |
| A14 | **Demo mode**: "Run demo scenario" button, quick account switcher, split-screen tips for the video | Full flow shown in 2 minutes |
| A15 | **Performance & accessibility pass** | Lighthouse PWA ✓, Performance ≥ 80, Accessibility ≥ 90 |

## 4. Member B: Backend, Matching & Data
| # | Task | Done when |
|---|---|---|
| B1 | **Backend skeleton**: Express + TS, zod schemas (§2.1), error format, security, **stub endpoints** returning contract shapes | Tests pass; A can call every endpoint |
| B2 | **Deploy + Postgres + migrations** (tables in doc 03 §3) | Live `/api/health` shows `db: ok`; URL shared with A |
| B3 | **Seed data** (doc 04): areas, orgs, volunteers, demo accounts, 30 days of history, guidance rules (doc 10) | Dashboards have realistic data |
| B4 | **Demo auth**: `/api/demo/accounts`, `/api/auth/demo-login`, JWT, role + org checks middleware, `/api/me` | Each role can access only its own data |
| B5 | **Guidance service** (doc 10): `/api/guidance`, pickup-by validation | Late pickup-by rejected with `PICKUP_BY_TOO_LATE` |
| B6 | **Listings API** + expiry scheduler | Listings expire automatically at pickup-by |
| B7 | **Matching engine** (pure TS, `server/src/matching/`) + unit tests: eligibility, score, reasons EN/TE, volunteer choice | Tests pass; reasons make sense |
| B8 | **Offer cascade**: offers API, accept/decline, 10-min timeout, cascade to 5, then open to all | Declining moves the offer to the next receiver |
| B9 | **Tasks & state machine**: volunteer assignment, pickup/delivery with codes, timeline events, transactional transitions | Wrong codes rejected; double-taps safe |
| B10 | **Realtime**: SSE `/api/events`, publish on every transition to the right users | All parties see updates live |
| B11 | **Impact calculator** (doc 11): `/api/impact` me/city, by area and donor type, assumptions list | Unit tests pass; city = sum of donors |
| B12 | **Voice post** (P1): `/api/voice-post` (Gnani STT → AI model → validated draft) | Spoken post returns a correct draft |
| B13 | **Demo scenario bots**: `POST /api/demo/scenario` runs the timed wedding-night flow (doc 04 §7) | One tap shows the whole flow |
| B14 | **Hardening**: authorization on every route, rate limits, voice credit cap, no secrets, privacy checks | Security checklist passes |
| B15 | **Metrics for the pitch**: median time to claim/deliver, on-time rate, posting time, from seeded + live data | Numbers ready for the README |

## 5. Timeline (both members in parallel)
| Block (IST) | Member A | Member B | Sync point ✋ |
|---|---|---|---|
| **First 30 min** | Agree contracts (§2) together | | ✋ Contracts frozen |
| **→ +3 h** | A1, A2, A3 | B1, B2, B3 | ✋ Both deployed URLs shared; demo login works |
| **→ +6 h** | A4, A6, A5 | B4, B5, B6 | ✋ A donor can post a real listing |
| **→ +10 h** | A7, A8 | B7, B8, B9 | ✋ **Full flow by hand: post → offer → claim → pickup → deliver** |
| **Sleep** | at least 5 hours each | | |
| **Sun morning** | A9, A10 | B10, B11 | ✋ Live updates + impact numbers on screen |
| **Sun midday** | A11, A12 | B12, B13 | ✋ Demo scenario runs end to end |
| **Sun afternoon** | A13, A14, A15 | B14, B15 | ✋ **Feature freeze 5 PM**: bug fixes only |
| **Sun evening** | Joint bug-bash with the acceptance tests in doc 08; final push **by 11 PM** (hard cut-off 11:59 PM) | | |

## 6. If one member falls behind
| Behind | The other member takes | Drop first |
|---|---|---|
| A | B builds a simple sponsor dashboard page in A's style only if A agrees; A focuses on donor/receiver/volunteer flows | Voice post (A12/B12), map polish, printable report |
| B | A uses mocks for impact and a simplified client-side match display | Offer splitting, voice post, demo bots (do the flow by hand instead) |

**Never drop:** under-a-minute posting, matching with reasons, live status from posted to delivered with handover codes, safety card on every listing, impact view with assumptions, a working build recorded on video.

## 7. Working rules
- **Branches:** `a/<feature>` and `b/<feature>`, merged into `main` at least every 2 hours. `main` must always run.
- **Commits:** small, clear, under your own name.
- **Mocks first:** A never waits for B. Put mock data in `app/src/mocks/` matching §2, and switch with `VITE_USE_MOCKS`.
- **Contract changes:** tell the other member first, then update this doc.
- **Secrets:** only B holds the Gnani and AI-model keys, and only on the backend.
- **Check-ins:** 5-minute call at every ✋.
- **Codebenders log:** each member logs their own prompts and iterations right after each task.
