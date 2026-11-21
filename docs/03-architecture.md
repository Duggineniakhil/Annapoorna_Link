# 03 — Technical Architecture
> Judging criterion: **Build Quality & Use of Codebenders, 15%** (and **Working Product, 30%**).
> All code is built *inside the Codebenders IDE* during the build window. External AI-model and voice APIs may be called *by the product* (kick-off Q&A, doc 15).

---

## 1. Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript, **PWA**, Tailwind CSS | Fast, small, installable from a link |
| i18n | `app/src/i18n/en.ts`, `te.ts`; Noto Sans Telugu (self-hosted subset) | English + Telugu toggle |
| Map | **Leaflet + OpenStreetMap tiles** (with attribution) | Free; no map API key |
| Backend | Node.js + Express + TypeScript | Business logic, matching, keys stay server-side |
| Database | **Postgres (Supabase)** | Relational data, transactions for state changes |
| Realtime | **Server-Sent Events (SSE)** + 15 s polling fallback | Simple live status; works through most networks |
| Voice post (P1) | **Gnani** speech-to-text (English/Telugu) + an AI model to turn speech into a structured listing | Faster posting for busy donors |
| Hosting | Vercel (frontend) + Render/Railway (backend) + Supabase | Free tiers |

## 2. System diagram
```
 ┌───────────── PWA (one app, role-based screens, EN/TE) ─────────────┐
 │ Donor: Quick Post · Listings · Impact                               │
 │ Receiver: Offers · Needs · History                                  │
 │ Volunteer: Tasks · Pickup/Delivery steps                            │
 │ Sponsor: City impact · Map                                          │
 └──────────────┬───────────────────────────────▲──────────────────────┘
                │ HTTPS (REST + JWT)            │ SSE /api/events
        ┌───────▼───────────────────────────────┴──────┐
        │ Backend API (Express)                         │
        │  auth (demo roles) · listings · guidance      │
        │  matching engine · offers cascade             │
        │  pickups state machine · handover codes       │
        │  impact calculator · voice-post (P1)          │── Gnani STT, AI model
        │  scheduler (offer timeouts, expiry)           │
        └───────┬──────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │ Postgres        │
        └────────────────┘
```

## 3. Data model
| Table | Key fields |
|---|---|
| `orgs` | id, type (`donor` \| `receiver`), donor_type (`caterer` \| `wedding_hall` \| `hostel_mess` \| `restaurant`), name (fictional), area, lat, lng (area-level, synthetic), veg_only, open_from, open_to, reliability |
| `users` | id, org_id (nullable for volunteers), role (`donor` \| `receiver` \| `volunteer` \| `sponsor`), display_name, lang, vehicle (`two_wheeler` \| `car` \| null), capacity_meals, available |
| `receiver_needs` | org_id, date, meals_needed, meals_received |
| `listings` | id, donor_org_id, items (JSON: name, category, qty_meals, qty_kg?), total_meals, veg, allergens[], storage (`hot` \| `room` \| `chilled`), cooked_at, pickup_by, status, pickup_code, delivery_code, created_at, posted_in_ms |
| `offers` | id, listing_id, receiver_org_id, rank, score, reasons (JSON en/te), status (`pending` \| `accepted` \| `declined` \| `expired`), expires_at |
| `pickups` | id, listing_id, receiver_org_id, volunteer_user_id, status, meals_delivered, picked_up_at, delivered_at |
| `events` | id, listing_id, type, actor_user_id, data, created_at (the timeline) |
| `guidance_rules` | food_category, storage, max_window_minutes, guidance_en, guidance_te |

## 4. Listing state machine
| From | To | Who / what triggers it |
|---|---|---|
| — | `posted` | donor |
| `posted` | `offered` | matching engine (immediately) |
| `offered` | `claimed` | receiver accepts |
| `offered` | `offered` (next rank) | decline or 10-min timeout (max 5), then open to all nearby |
| `claimed` | `volunteer_assigned` | volunteer accepts (or auto-assigned) |
| `volunteer_assigned` | `picked_up` | volunteer enters the correct **pickup code** |
| `picked_up` | `delivered` | volunteer enters the correct **delivery code** + quantity |
| any before `picked_up` | `expired` | scheduler: pickup_by passed |
| any before `picked_up` | `cancelled` | donor |

Every transition writes an `events` row and publishes an SSE message to the donor, the receiver and the volunteer involved. Transitions run in a DB transaction with a status check, so double-taps can't create two states.

## 5. Realtime
- `GET /api/events` (SSE, JWT in a query token or cookie) streams `{ type, listing_id, status, at }` for listings the user is part of.
- The client falls back to polling `GET /api/listings/:id` every 15 s if SSE drops.

## 6. Voice post pipeline (P1)
1. Donor holds the mic (≤ 20 s); the browser records Opus/webm (mp4 on iOS).
2. `POST /api/voice-post` → Gnani STT (English or Telugu) → the AI model extracts `{ items[], storage, cooked_at, veg, allergens[] }` as JSON, validated with zod.
3. The form is prefilled; the donor confirms or edits, then posts. Nothing is posted without confirmation.
4. Audio is never stored.

## 7. Security & privacy
- API keys (Gnani, AI model) only in backend env vars; `.env` git-ignored.
- JWT with role; every route checks role and org ownership (a receiver can't read another receiver's codes).
- Handover codes are shown only to the donor (pickup code) and the receiver (delivery code); volunteers must enter them.
- Synthetic, area-level locations only. No real names, phones or addresses.
- Rate limits per user; voice-post daily cap to protect credits.

## 8. Quality bar ("Build Quality")
- TypeScript strict, ESLint/Prettier, one schema file for API contracts (zod) shared by tests.
- Unit tests: matching engine, state machine, impact calculator, guidance rules.
- Integration tests: full flow post → offer → claim → pickup → deliver.
- A scripted **demo scenario** (seed + bots) so the full flow can be shown in 2 minutes.
- Lighthouse mobile: PWA ✓, performance ≥ 80.

## 9. Repository layout
```
Vidya_Nestham/            (repo; product name: Annapoorna Link)
  app/        # PWA frontend (Member A)
  server/     # API, matching, state machine, impact (Member B)
  docs/       # these documents
  README.md
  CODEBENDERS_USAGE.md
```
