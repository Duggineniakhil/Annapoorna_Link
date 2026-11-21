# 13 — Codebenders Prompts: Member A (Frontend & Experience)
**Annapoorna Link (అన్నపూర్ణ లింక్)** · tasks A1–A15 from `12-team-split.md`

## How to use this file
1. **Start a new Nexon chat** and send the context message below first. If you used Nexon for an earlier idea, don't continue that chat.
2. Paste **one prompt at a time**, in order. Each assumes the earlier ones are done.
3. After each prompt:
   - **read Nexon's plan before approving it**
   - run the **checks** listed under the prompt
   - fix issues with short follow-ups (exact error + what you expected)
   - commit
   - add a row to `CODEBENDERS_USAGE.md`
4. **You own `app/`.** Member B owns `server/`. Never edit B's folder.
5. **Never wait for B.** Use mocks (`VITE_USE_MOCKS=true`) matching `12-team-split.md` §2 until B's endpoints are live.
6. **Strings:** every visible string lives in `app/src/i18n/en.ts` and `te.ts`. Have the Telugu checked by a native speaker.
7. **Use the IDE the way the organisers recommend** (doc 15 §3):
   - one feature at a time
   - if a plan looks huge, split it into 2–3 prompts
   - re-plan after two failed fixes
   - start a new chat when the history gets long
8. **Hard cut-off:** last commit before **Sun 22 Nov, 11:59 PM IST**.

### Context message (send first, in a new chat)
```text
We are building "Annapoorna Link" (అన్నపూర్ణ లింక్), a web app (PWA) for the ACE Builders Hackathon 2026,
Problem Statement 2: Rescue the Surplus. In Hyderabad, it connects surplus food from caterers, wedding halls,
hostel/college messes and restaurants to nearby shelters, community kitchens and NGOs, with volunteers doing
the pickup, before the food spoils. English + Telugu interface.

Read these files for context: docs/01-problem-and-user.md, docs/02-product-spec.md, docs/03-architecture.md,
docs/10-food-handling-guidance.md, docs/11-impact-assumptions.md, docs/12-team-split.md.

I am Member A (Frontend & Experience). I own app/. Member B owns server/; never create or edit files there.
Until B's API is live, I use mocks in app/src/mocks/ that follow the contracts in docs/12-team-split.md §2
(types, API table, decisions D1–D12).

Don't write code yet. Reply with a short summary of the product, the four roles, my responsibilities and the
listing status flow, then wait for task A1.
```

---

## A1 · PWA skeleton with roles and EN/TE
```text
Create the frontend skeleton for Annapoorna Link in app/. This task is ONLY the skeleton: routes, layout,
i18n and placeholders. No API calls yet.

TECH: React + Vite + TypeScript (strict), Tailwind CSS, React Router, vite-plugin-pwa (app shell precache,
manifest: name "Annapoorna Link", short_name "Annapoorna", theme color, placeholder icons 192/512).
Self-host Noto Sans Telugu (Telugu + Latin subsets, font-display: swap). ESLint + Prettier. No UI library.

STRUCTURE (app/src/)
  screens/donor/, screens/receiver/, screens/volunteer/, screens/sponsor/, screens/common/
  components/   (AppShell, TopBar, BottomNav, LanguageToggle, DemoDataBadge, StatusBadge, EmptyState)
  i18n/en.ts, i18n/te.ts, i18n/index.ts   (useT() hook; language saved in localStorage)
  types/api.ts  (mirror the types in docs/12-team-split.md §2.1 exactly)
  services/     (empty for now)
  mocks/        (empty for now, .gitkeep)
  config.ts     (VITE_API_BASE_URL, VITE_USE_MOCKS default true)

ROUTES (placeholders, every visible string from i18n)
/login                    Demo login (placeholder list of accounts)
/donor                    Donor home: active listings + big "Post surplus" button
/donor/post               Quick Post (placeholder)
/donor/listings/:id       Listing detail (placeholder timeline)
/donor/impact             My impact (placeholder)
/receiver                 Incoming offers
/receiver/offers/:id      Offer detail
/receiver/needs           Today's needs
/receiver/history         Received history
/volunteer                Available tasks
/volunteer/tasks/:id      Active task stepper
/volunteer/history        My deliveries
/sponsor                  City impact dashboard
/sponsor/map              Activity map
/about                    About & food-safety note (doc 10 §3 disclaimer in EN and TE)
*                         Not found

LAYOUT
- AppShell with TopBar (title, LanguageToggle "EN | తెలుగు", account menu) and a role-specific BottomNav.
- DemoDataBadge: small "Demo data / డెమో డేటా" label, used on screens with sample data.
- Mobile-first (360 px), tap targets ≥ 48 px, base font 16–18 px, high contrast.

BUDGET: initial JS + CSS + fonts < 1.5 MB uncompressed; lazy-load every role's screens.

ALSO: npm scripts dev/build/preview/lint; app/.env.example; app/README.md (run, env vars, folder ownership).
When done, list the files created and the build size.
```
**Checks:**
- Every route opens.
- The language toggle switches all visible text and is remembered after reload.
- The build is under budget.

> If Nexon's plan is large, split it into A1a (routes, layout, types) and A1b (i18n, PWA, font, budget).

---

## A2 · Frontend deploy (Vercel)
```text
Make app/ deployable on Vercel and give me the steps.
- SPA fallback so React Router routes work on refresh.
- Cache headers: hashed assets immutable for 1 year; index.html, manifest and the service worker no-cache.
- Env vars VITE_API_BASE_URL and VITE_USE_MOCKS set in the Vercel dashboard (no secrets in the frontend).
- A "new version available, tap to refresh" banner when a new service worker is waiting
  (EN + TE strings), never interrupting an in-progress form.
- A version line (build date + short git hash) on /about.
Update app/README.md with deploy steps and a checklist to verify the live site on a phone.
```
**Checks:**
- The live URL opens in incognito on your phone.
- Refreshing on `/donor/post` works.
- **Send the URL to Member B** for `ALLOWED_ORIGIN`.

---

## A3 · Demo login & role routing
```text
Implement demo login and role-based routing for Annapoorna Link.

- services/api.ts: a fetch client with base URL from config, JSON handling, Authorization: Bearer <token>,
  and typed errors from { error_code, message, message_te } (show message_te when the language is Telugu).
  Timeouts: 15 s → a friendly "server busy" error with retry.
- Mocks (VITE_USE_MOCKS=true): app/src/mocks/ with handlers for GET /api/demo/accounts,
  POST /api/auth/demo-login and GET /api/me, using the demo accounts in docs/04-sample-data-plan.md §4
  (fictional names, area-level). Mock responses must match docs/12-team-split.md §2.1 exactly.
- /login: list demo accounts grouped by role (Donor, Receiver, Volunteer, Sponsor) with name and area;
  one tap logs in. Store the token and user in localStorage; DemoDataBadge on this screen.
- AuthContext + useAuth(); route guards: each role can open only its own section; others redirect to the
  user's home. Logout in the account menu. If a token expires (401), go back to /login.
- Role homes show "Hello, <display_name>" and the org name.
- A quick account switcher in the account menu (demo only) to jump between roles for the demo video.
Write unit tests for the route guards and the API error mapping.
```
**Checks:**
- Each demo account lands on its own home.
- Typing another role's URL redirects you.
- Switching accounts works in one tap.

---

## A4 · Donor Quick Post (under a minute)
```text
Build the donor Quick Post screen (/donor/post). Goal: a busy caterer posts surplus in under 60 seconds.

FORM (big, thumb-friendly, EN/TE)
1. Food items: chips for common dishes grouped by category (rice_dish, curry, bread, dry_snack, sweet,
   dairy_based, salad_cut_fruit), e.g. Veg biryani, Chicken biryani, Dal, Sambar, Curd rice, Chapati,
   Gulab jamun. Tapping a chip adds an item with a quantity stepper in meals (±10 buttons and direct entry);
   an optional "enter kg instead" toggle per item. "+ Other dish" lets them type a name and pick a category.
2. Storage: three big buttons Hot 🔥 / Room temperature 🌡️ / Chilled ❄️.
3. Cooked at: defaults to "now − 30 min"; quick buttons (now, −30 min, −1 h, −2 h) + time picker.
4. Pickup by: call GET /api/guidance with the item categories, storage and cooked_at; pre-fill pickup_by with
   max_pickup_by and show "Latest safe pickup: 11:45 PM". The donor can choose earlier, never later
   (disable later times; the server also rejects with PICKUP_BY_TOO_LATE).
5. Veg / Non-veg toggle (auto-set to non-veg if any chicken/mutton/egg/fish item is chosen).
6. Allergens: chips (nuts, peanuts, dairy, gluten, egg, seafood, soy, sesame), with smart defaults
   (e.g., curd rice → dairy, chapati → gluten), editable.
7. A live summary card ("150 meals · Veg · Hot · pickup by 11:45 PM") and the safety card preview (A6).
8. "Post surplus" button → POST /api/listings with posted_in_ms (time since the form opened) → go to the
   listing detail with a success toast "Posted in 42 s".
- "Repeat last post" button at the top: prefills items, storage and allergens from the last listing.
- The donor's venue is taken from their org (no address entry).
- Mocks: /api/guidance using docs/10-food-handling-guidance.md rules; POST /api/listings returns a Listing.
Write tests for: pickup-by can't exceed max, veg auto-detection, allergen defaults, posted_in_ms.
```
**Checks:**
- Time yourself posting on a phone. It should take under 60 s.
- Later pickup-by times can't be chosen.
- "Repeat last post" fills the form.

---

## A5 · Donor listings & detail
```text
Build donor listings for Annapoorna Link.

/donor (home): "Active" (posted → picked_up) and "Past" (delivered, expired, cancelled) tabs; each card shows
items summary, meals, status badge, pickup-by countdown, and the matched receiver's name and area if any.

/donor/listings/:id:
- Status timeline (posted, offered to <receiver>, claimed, volunteer assigned, picked up, delivered), each with
  a time, from GET /api/listings/:id → timeline.
- Matched receiver (name, area, distance) and volunteer (first name, vehicle) when assigned.
- **Pickup code**: big 4-digit code with "Show this to the volunteer at pickup" (only visible to the donor;
  hidden after pickup).
- Safety card (A6).
- Cancel button (only before pickup) with a confirm step → POST /api/listings/:id/cancel.
- Expired state: red banner "Not picked up in time. Do not use this food." (from doc 10).
- Refetch every 15 s for now (A9 adds live updates).
Mocks for list, detail, timeline and cancel, with listings in different statuses.
```
**Checks:**
- Every status shows correctly.
- The pickup code is visible only to the donor, and hidden after pickup.
- Cancel works only before pickup.

---

## A6 · Safety card component
```text
Build a reusable SafetyCard component (app/src/components/SafetyCard.tsx) used on every listing, offer and task.
Show (EN/TE):
- Storage icon + label (Hot 🔥 / Room temperature 🌡️ / Chilled ❄️)
- Countdown to pickup_by (before pickup) or to serve_by (after pickup); turns amber under 30 min, red under 10 min
- Veg 🥗 / Non-veg 🍗
- Allergen chips
- guidance_en / guidance_te from the listing's safety object
- The disclaimer from docs/10-food-handling-guidance.md §3, always visible
- Expired state: red, "Do not use. The safe window has passed."
Never show words like "safe", "certified", "approved" or any tax/legal benefit.
Add a compact variant for list cards. Unit-test the countdown colour thresholds and the expired state.
```
**Checks:**
- It appears on donor, receiver and volunteer screens.
- The disclaimer is always visible.
- The colours change at the right times.

---

## A7 · Receiver: offers, needs, history
```text
Build the receiver screens for Annapoorna Link.

/receiver (incoming offers): cards from GET /api/offers with items, meals, distance, ETA, pickup-by, compact
SafetyCard, the **match reasons** (reasons[].en/te as small chips, e.g. "2.1 km away", "Needs 120 meals today",
"Veg accepted"), and a countdown to expires_at (10 min). Accept / Decline buttons (decline asks an optional
reason: too far, can't accept type, no space, closing).

/receiver/offers/:id: full detail, map placeholder (A10 adds the map), timeline, and after accepting, the big
**delivery code** "Show this to the volunteer at delivery" (only for this receiver), and the volunteer's first
name and ETA once assigned.

/receiver/needs: today's meals needed, veg-only toggle, intake hours (open_from/open_to) → PUT /api/receiver/needs.
/receiver/history: received listings with meals and dates.

Empty state for offers: "No offers right now. We'll notify you when food is available nearby."
Mocks for all endpoints, including an offer that expires while open.
```
**Checks:**
- Accepting shows the delivery code.
- An expired offer disappears with a message.
- Saved needs survive a reload.

---

## A8 · Volunteer: tasks & pickup/delivery stepper
```text
Build the volunteer screens for Annapoorna Link.

/volunteer: availability toggle (PUT /api/volunteer/availability); list of available tasks from GET /api/tasks
(donor area → receiver area, meals, distance, deadline countdown, vehicle fit) and my active task at the top.
Accept → POST /api/tasks/:id/accept.

/volunteer/tasks/:id: a 4-step stepper with big buttons:
 1. "Go to pickup": donor name + area, "Navigate" (opens a Google Maps URL with the lat/lng), SafetyCard.
 2. "Enter pickup code": 4 big digit boxes → POST /api/tasks/:id/pickup { code }. WRONG_CODE shows the
    remaining tries; after 5 wrong tries, show "Ask the donor to check the code".
 3. "Go to delivery": receiver name + area, Navigate, countdown to serve_by.
 4. "Enter delivery code + meals delivered" (prefilled with total meals, editable down) →
    POST /api/tasks/:id/deliver → a success screen "Delivered 150 meals 🎉".
- If the network fails while submitting a code, keep the entered code and show a Retry button
  (don't lose progress).
/volunteer/history: deliveries with meals and dates.
Mocks for every step, including WRONG_CODE.
```
**Checks:**
- Do the full flow on a phone.
- A wrong code shows the tries left.
- Navigate opens maps.

---

## A9 · Live updates
```text
Add live updates across Annapoorna Link.
- hooks/useLiveEvents.ts: connect to GET /api/events (SSE, token as ?token=); on each event
  { type, listing_id, status, at }, invalidate/refetch the affected data (listing detail, lists, offers, tasks).
- Auto-reconnect with backoff; if SSE fails 3 times, fall back to polling every 15 s and show a small
  "Live updates paused, refreshing every 15 s" note.
- Toasts in EN/TE for important events: donor ("Annapoorna Community Kitchen accepted your food",
  "Picked up", "Delivered"); receiver ("New food offer nearby", "Volunteer on the way"); volunteer
  ("New task nearby").
- Remove the per-screen 15 s refetch from A5 when SSE is connected.
- Mock mode: a fake event emitter that advances a listing through statuses every 10 s for testing.
```
**Checks:**
- Open the donor and receiver in two browser windows. An accept in one shows in the other within seconds.

---

## A10 · Map (Leaflet + OpenStreetMap)
```text
Add maps to Annapoorna Link using Leaflet + OpenStreetMap tiles (show the required attribution). No API keys.
- components/AreaMap.tsx: lazy-loaded (don't add Leaflet to the initial bundle); markers for donor (🍲) and
  receiver (🏠) at area-level coordinates; a straight line between them for an active listing/task; distance label.
- Use it on: donor listing detail (receiver location once claimed), receiver offer detail, volunteer task
  steps 1 and 3.
- /sponsor/map: activity map from GET /api/map: donors and receivers as markers, recent deliveries as lines
  (last 24 h), with a filter by donor type; DemoDataBadge.
- Show a simple text fallback (area names + distance) if tiles fail to load or the device is slow.
```
**Checks:**
- Maps load on mobile without slowing the first screen.
- The attribution is visible.
- The fallback text works when you're offline.

---

## A11 · Impact dashboards
```text
Build the impact views for Annapoorna Link from GET /api/impact.

/donor/impact (scope=me): big counters (meals saved, kg of food waste avoided, CO₂e avoided), this week /
this month toggle, a simple bar chart of meals per week (lightweight SVG, no heavy chart library), and
the on-time rate.
/sponsor (scope=city): the same counters for the city + breakdown by area and by donor type (caterer,
wedding hall, hostel mess, restaurant), median time to claim, on-time rate, rescue rate; DemoDataBadge.

"How we calculate this" panel on both: list every item of impact.assumptions (label, value, source) and the
note "Only delivered food counts. Expired or cancelled listings count as zero." (docs/11-impact-assumptions.md).

Printable monthly report (donor): a print-friendly page /donor/impact/report?month=YYYY-MM with the counters,
weekly chart, assumptions and "Generated by Annapoorna Link. Figures based on confirmed deliveries."
Use window.print() with print CSS. No tax or legal claims.
```
**Checks:**
- The counters match the API.
- The assumptions panel shows the sources.
- The printed report fits one A4 page.

---

## A12 · Voice post UI (P1)
```text
Add a voice option to Quick Post.
- A 🎤 button: press and hold to record (max 20 s, countdown ring), release to send. MediaRecorder with
  audio/webm;codecs=opus, falling back to audio/ogg;codecs=opus, then audio/mp4; send with the right Content-Type.
- POST /api/voice-post (multipart "audio") → { draft, transcript }. Show the transcript, then prefill the
  form with the draft (items, veg, allergens, storage, cooked_at). The donor must review and tap Post;
  never auto-post.
- Mic permission explanation (EN/TE) before the first request; if denied, hide the button and keep the form.
- Errors (STT_EMPTY, SERVER_BUSY) show message/message_te with a retry.
- Mock: return a draft for "150 plates veg biryani and dal, cooked at 9:30, kept hot".
```
**Checks:**
- A spoken English or Telugu description fills the form correctly.
- Nothing gets posted without a tap.

---

## A13 · Errors, empty states, settings, about
```text
Polish Annapoorna Link's resilience and copy.
- Top-level error boundary with a friendly EN/TE screen and "Try again".
- Toast system for non-blocking messages; map every error_code to message/message_te.
- Empty states for every list (no listings, no offers, no tasks, no history) with a helpful next action.
- Offline banner when navigator.onLine is false: "You're offline. Some actions will retry when you're back."
- Settings (account menu): language, notification sound on/off, text size (3 steps).
- /about: what the app does, how matching works (one paragraph), the food-safety disclaimer, the data note
  ("All organisations and people shown are fictional demo data"), version line.
- Search the code for any hard-coded user-facing text and move it to i18n/en.ts and te.ts.
```
**Checks:**
- Trigger each error once. There's no raw error text and no blank screen.
- Every visible string switches language.

---

## A14 · Demo mode
```text
Make Annapoorna Link easy to demo to judges and in the video.
- On /login and in the sponsor dashboard: a "Run wedding-night demo" button → POST /api/demo/scenario
  { name: "wedding_night" }, then show a small floating "Demo running" panel with the steps
  (posted → offered → claimed → picked up → delivered) ticking live from SSE events.
- Quick account switcher: one-tap switch between the six demo accounts (docs/04 §4), keeping the language.
- A /demo-guide page: how to show the full flow by hand in two browser windows (donor + receiver) and on a
  phone (volunteer), with the demo accounts and codes explained.
- DemoDataBadge on every screen that shows seeded data.
```
**Checks:**
- One tap runs the whole flow in about 2 minutes.
- Judges can follow `/demo-guide` without help.

---

## A15 · Performance & accessibility pass
```text
Do a performance and accessibility pass on Annapoorna Link for mid-range Android phones on 4G/3G.
1. Report chunk sizes; initial load < 1.5 MB uncompressed; each role's chunk < 250 KB; Leaflet lazy-loaded.
2. Lighthouse mobile (slow 4G, 4× CPU): PWA installable, Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90.
3. Every icon button has an aria-label in the current language; focus order is logical; colour contrast passes;
   tap targets ≥ 48 px; the Telugu text fits at 360 px without overflow at the largest text size.
4. Measure Quick Post time on a real phone 5 times and report the median (for the README).
Give me a before/after table.
```
**Checks:**
- Save the Lighthouse screenshot and the median posting time for the README.

---

## Order and dependencies
| Prompt | Needs from Member B | Works without B? |
|---|---|---|
| A1–A2 | none | ✅ |
| A3–A8 | B1 stubs → B4–B9 real endpoints | ✅ with mocks |
| A9 | B10 (SSE) | ✅ with the fake event emitter |
| A10 | B3 (map data) | ✅ with mocks |
| A11 | B11 (impact) | ✅ with mocks |
| A12 | B12 (voice post) | ✅ with mocks |
| A14 | B13 (demo scenario) | ✅ by hand with the account switcher |
| A13, A15 | none | ✅ |
