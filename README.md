# అన్నపూర్ణ లింక్ · Annapoorna Link

**Surplus food to people who need it, before it spoils.**
A web app that lets Hyderabad's caterers, wedding halls, hostel messes and restaurants post surplus food in under a minute. It matches the food to the best nearby shelter or community kitchen, coordinates a volunteer pickup with live status, and shows the real impact.

> 🏆 Built for the **ACE Builders Hackathon 2026** by Codebenders
> 📌 **Problem Statement 2: Rescue the Surplus** (Society & Environment)

| | |
|---|---|
| 🔗 **Live app** | <!-- TODO --> `https://...` |
| 🎥 **Demo video (3–6 min)** | <!-- TODO --> `https://...` |
| 📊 **Pitch deck** | <!-- TODO --> `https://...` |
| 🛠️ **How we built it** | [CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) |

**Try it in 60 seconds:**
1. Open the live app and tap a demo account (e.g. **Sri Sai Caterers**).
2. Post surplus food, then switch to **Annadanam Community Kitchen** to accept it.
3. Switch to volunteer **Ravi** to pick it up and deliver it.

Or tap **Run wedding-night demo** to watch the whole flow live. All organisations and people are fictional demo data.

---

## 📖 The problem
It's 10:30 PM and a wedding reception in Kukatpally has just ended. 150 plates of good food are left over.
1. The caterer calls two NGOs. One doesn't answer; the other is too far away to send anyone.
2. By midnight the food is in the bin, and the caterer pays for its disposal.
3. Six kilometres away, a shelter served smaller portions that night.

**Good intentions exist on both sides, but there's no fast, reliable way to connect surplus food with people who need it before it spoils.** Coordination runs on phone calls and WhatsApp groups that fail late at night, with no matching, no status and no record of impact.

<!-- TODO: add 2–3 cited statistics and 1–2 anonymised quotes from your user calls -->

## 💡 Our solution
| | Feature | What it does |
|---|---|---|
| ⏱️ | **Post in under a minute** | Food chips, quantities, storage, allergens. The latest safe pickup time is suggested automatically. "Repeat last post" for regular donors. Optional voice posting in English or Telugu |
| 🎯 | **Explainable matching** | Ranks receivers by distance, today's need, food preferences (veg-only), opening hours and time left; picks the nearest volunteer with enough capacity. Shows *why*: "2.4 km · needs 180 meals · veg accepted" |
| 🔁 | **Offer cascade** | Each receiver gets 10 minutes to accept; then the next one gets the offer. Food never waits on one phone call |
| 🛵 | **Live pickup with handover codes** | Posted → claimed → picked up → delivered, live for donor, receiver and volunteer. 4-digit codes confirm each handover, with no GPS tracking |
| 🛡️ | **Safety card on every listing** | Storage, safe-window countdown, allergens, veg/non-veg, handling guidance. Listings auto-expire. **We never certify food as safe** |
| 📊 | **Impact with assumptions** | Meals saved, kg of waste avoided, CO₂e avoided, for donors and the whole city. Every number shows how it's calculated, and only delivered food counts |
| 🌐 | **English + Telugu** | For owners, NGO staff, kitchen staff and volunteers alike |

### Problem statement requirements → our features
| Required by Problem Statement 2 | How Annapoorna Link meets it |
|---|---|
| A donor flow under a minute: what food, how much, pickup-by time | Quick Post with chips, auto-suggested pickup-by and a built-in timer (median posting time: <!-- TODO --> s) |
| Smart matching by distance, quantity, timing and need | Matching engine with eligibility rules, weighted score and reasons; volunteer selection by distance and capacity |
| Pickup coordination with live status: posted → claimed → collected → delivered | Server-enforced state machine, SSE live updates, handover codes |
| Impact view: meals saved and waste avoided, with assumptions | Donor and city dashboards with a "How we calculate this" panel; printable monthly report |
| Handling and safety info: time window, storage, allergens | Safety card on every listing, offer and task; server-enforced safe windows and auto-expiry |
| Business case for donors and sponsors | Donor Pro, institution plans, CSR area sponsorships (see below) |

## 📸 Screenshots
<!-- TODO: phone screenshots: Quick Post · offer with reasons · volunteer stepper · live timeline · impact dashboard -->

## 🏗️ How it works
```
 PWA (Donor · Receiver · Volunteer · Sponsor, EN/TE)
        │ REST + JWT                 ▲ SSE live events
 Backend API (Express): listings · guidance · matching · offers · tasks/state machine · impact · voice post
        │
 Postgres (Supabase)                 Gnani speech-to-text + AI model (voice post, optional)
```
- **Matching score:** `0.4 × proximity + 0.3 × need + 0.2 × time slack + 0.1 × reliability`, after eligibility checks (veg-only, open hours, need, arrival before pickup-by). Weights are in config and covered by unit tests.
- **State machine:** posted → offered → claimed → volunteer assigned → picked up → delivered (or expired / cancelled). Only the server changes status, one checked transition at a time (double taps get "not possible right now"), and each change is written to Postgres in a single transaction.
- **Offer cascade:** the top kitchen gets 10 minutes to accept, then the next; after 5 offers the food is opened to every eligible kitchen and the first to accept gets it. A scheduler expires food at pickup-by.
- **Safety windows:** from published food-handling guidance (hot / room / chilled, stricter for dairy and non-veg). The donor can choose an earlier pickup, never a later one.

### Tech stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript, PWA, Tailwind CSS, Leaflet + OpenStreetMap |
| Backend | Node.js + Express + TypeScript, zod, helmet, per-user rate limits; Vitest + supertest (80 tests) |
| Database | Postgres (Supabase) via postgres.js, tracked migrations; the API keeps a working copy in memory and writes every change through |
| Realtime | Server-Sent Events, with 15 s polling as a fallback |
| Voice (optional) | Gnani speech-to-text (Prisma v3, English and Telugu) + an AI model that turns the transcript into a draft listing |
| Hosting | Vercel + Render/Railway |
| Built with | **Codebenders IDE** |

## 🛡️ Guardrails & privacy
- **We connect people; we don't certify food safety.** Every listing shows guidance and time limits, and receivers check food before serving.
- **No tax or legal benefit claims** anywhere.
- **Synthetic data only.** Fictional organisations and people, area-level locations, no real addresses or phone numbers.
- **Handover codes** are visible only to the right party.
- **Secrets stay on the server.** Voice recordings are never stored.

## 💰 Business model
**Receivers and volunteers use it free.**
| Who pays | Why | Plan |
|---|---|---|
| Caterers & wedding halls | Lower disposal cost; "zero-waste events" story for clients | Donor Pro: <!-- ₹___ -->/venue/month |
| Hostel & college messes | Routine daily pickups + sustainability reports | Institution plan |
| CSR sponsors | Verified, reportable social and environmental impact | Area sponsorship + dashboard |
| City authorities (later) | Less food waste to landfill | City licence + data |

## 📈 Results (demo data)
From `npm run metrics` on the seeded demo data (30 days, 120 listings). **These are generated, not measured with real users**: replace them with live numbers after a real demo run.

| Metric | Value |
|---|---|
| Time posted to claimed (median / p90) | 5 min / 6 min |
| Time posted to delivered (median / p90) | 23 min / 39 min |
| Rescue rate (delivered, excluding cancelled) | 93.1% |
| Expiry rate (expired, excluding cancelled) | 6.9% |
| Offers sent before delivery (mean / median) | 2.04 / 2 |

Run `cd server && npm run metrics` against the database for the full table (posting time, on-time rate, meals and kg by area and donor type).

## ⚡ Performance & accessibility
Built for mid-range Android phones on 4G/3G. Measured on the production build (`npm run build && npm run preview`).

**Lighthouse (mobile: slow 4G, 4× CPU slowdown)**

| Page | Performance | Accessibility | Best Practices |
|---|---|---|---|
| `/login` | 87 | 100 | 100 |
| `/demo-guide` | 93 | 100 | 100 |

<!-- TODO: add the Lighthouse screenshot -->

**Bundle size** (uncompressed; target: first load under 1.5 MB, each role's screen under 250 KB)

| Part | Size |
|---|---|
| Main app chunk | 349 KB (113 KB gzipped) |
| Fonts (Noto Sans Telugu, self-hosted) | 266 KB |
| Largest role screen (Quick Post) | 28 KB |
| Map (Leaflet), loaded only when a map is shown | 151 KB |

**Accessibility fixes (before → after)**

| Check | Before | After |
|---|---|---|
| Muted text contrast on cream | 3.3:1 to 4.46:1 (below AA) | 6.2:1 |
| Smallest tap target | 40 px | 48 px |
| Telugu, largest text size, 360 px screen | Offer page 445 px wide (scrolls sideways) | Fits in 360 px |
| Icon buttons without a label | 0 | 0 (every label in English and Telugu) |

The app installs as a PWA (Chrome reports no installability errors) and opens offline from its service worker.

## 🛠️ Built with Codebenders
The whole application was built in the **Codebenders IDE** during the hackathon build window (21 Nov 11:30 AM to 22 Nov 11:59 PM IST), using chat-to-build with the Nexon agent. [CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) documents the timeline, key prompts, the iterations that mattered and where we corrected the output.

## 🚀 Run locally
```bash
git clone https://github.com/Duggineniakhil/Annapoorna_Link.git
cd Annapoorna_Link

# backend (without DATABASE_URL it runs in memory on the seeded demo data)
cd server && cp .env.example .env   # fill in your own values
npm install && npm run migrate && npm run seed && npm run dev

# frontend (new terminal)
cd app && npm install && npm run dev
```
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `JWT_SECRET` | Demo auth tokens |
| `ALLOWED_ORIGIN` | Frontend URL for CORS |
| `GNANI_API_KEY`, `AI_API_KEY`, `AI_MODEL` | Optional voice post (without both keys, voice post answers "busy" and nothing else changes) |
| `DEMO_MODE` | `true` lets any signed-in user start the wedding-night demo (default: sponsor only) |
| `VOICE_DAILY_PER_DONOR`, `VOICE_DAILY_GLOBAL` | Daily voice-post caps (30 and 500) |
| `VITE_API_BASE_URL`, `VITE_USE_MOCKS` | Frontend config |

> Never commit `.env`.

## 📁 Project structure
```
app/                  PWA frontend (role-based screens, EN/TE, map, live updates)
server/               API, matching engine, state machine, impact, seed data (see server/README.md)
docs/                 Problem research, spec, architecture, business model, plans
CODEBENDERS_USAGE.md  How we built it with Codebenders
```

## 🗺️ Roadmap
- [x] Hyderabad MVP: post → match → pickup → deliver → impact
- [ ] Pilot with 10 caterers/halls and 5 receivers
- [ ] Scheduled pickups for regular donors
- [ ] WhatsApp notifications
- [ ] More cities; CSR and city partnerships

## 👥 Team
<!-- TODO -->

## 📄 License
<!-- TODO: choose after checking the hackathon's ownership/licensing terms -->
