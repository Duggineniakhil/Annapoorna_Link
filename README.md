# Annapoorna Link

**Surplus food to people who need it, before it spoils.**

Annapoorna Link is a mobile-first web app for food rescue in Hyderabad. Caterers, wedding halls, hostel messes and restaurants post surplus food in under a minute. The platform matches it to the best nearby shelter or community kitchen, coordinates a volunteer pickup with live status at every step, and reports the impact with transparent assumptions.

Built for the **ACE Builders Hackathon 2026** by team **Codebenders**, for **Problem Statement 2: Rescue the Surplus** (Society & Environment).

| Resource | Link |
|---|---|
| Live app | [annapoorna-link.vercel.app](https://annapoorna-link.vercel.app) (demo mode, no sign-up) |
| Demo video (3–6 min) | <!-- TODO --> _coming soon_ |
| Pitch deck | <!-- TODO --> _coming soon_ |
| Build log | [CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) |

---

## Contents

- [Quick start for reviewers](#quick-start-for-reviewers)
- [The problem](#the-problem)
- [The solution](#the-solution)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Safety, privacy and guardrails](#safety-privacy-and-guardrails)
- [Business model](#business-model)
- [Results](#results)
- [Performance and accessibility](#performance-and-accessibility)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [How it was built](#how-it-was-built)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

---

## Quick start for reviewers

No sign-up is needed. The app ships with fictional demo accounts.

**One tap.** On the sign-in screen, tap **Run wedding-night demo**. A caterer posts 150 plates, a kitchen accepts, and a volunteer picks up and delivers. A progress panel follows each step live, and the whole run takes about a minute.

**By hand.** Use three screens to see each role:

1. **Donor:** sign in as **Sri Sai Caterers** and post surplus food.
2. **Receiver:** in a second window, sign in as **Annadanam Community Kitchen** and accept the offer.
3. **Volunteer:** on a phone, sign in as **Ravi K.**, accept the pickup, and confirm both handovers with the 4-digit codes.

The in-app **Demo guide** (`/demo-guide`) walks through this flow and explains the handover codes. All organisations, people and numbers are fictional.

---

## The problem

It is 10:30 PM and a wedding reception in Kukatpally has just ended, with 150 plates of good food left over.

1. The caterer calls two NGOs. One does not answer; the other is too far away to send anyone.
2. By midnight the food is in the bin, and the caterer pays for its disposal.
3. Six kilometres away, a shelter served smaller portions that night.

Both sides want to help, but there is no fast, reliable way to connect surplus food with the people who need it before it spoils. Coordination runs on phone calls and messaging groups that break down late at night, with no matching, no status and no record of impact.

<!-- TODO: add 2–3 cited statistics and 1–2 anonymised quotes from user interviews -->

---

## The solution

| Capability | What it does |
|---|---|
| **Post in under a minute** | Food chips, quantities, storage and allergens, with the latest safe pickup time suggested automatically. Regular donors can repeat their last post. Optional voice posting in English or Telugu. |
| **Explainable matching** | Ranks receivers by distance, today's need, food preferences (such as veg-only), opening hours and time remaining, then picks the nearest volunteer with enough vehicle capacity. Every match shows its reasons, for example "2.4 km · needs 180 meals · veg accepted". |
| **Offer cascade** | Each receiver has 10 minutes to accept before the offer moves to the next one, so food never waits on a single phone call. |
| **Live pickup with handover codes** | Posted → claimed → picked up → delivered, updated live for the donor, receiver and volunteer. 4-digit codes confirm each handover without GPS tracking. |
| **Safety card on every listing** | Storage, safe-window countdown, allergens, veg/non-veg and handling guidance. Listings expire automatically. The platform never certifies food as safe. |
| **Impact with stated assumptions** | Meals delivered, kilograms of waste avoided and CO₂e avoided, for each donor and for the city. Every figure explains how it is calculated, and only delivered food counts. |
| **Bilingual** | Full English and Telugu interface for business owners, NGO staff, kitchen staff and volunteers. |

### Requirements coverage

| Problem Statement 2 requirement | How Annapoorna Link meets it |
|---|---|
| Donor flow under a minute: what food, how much, pickup-by time | Quick Post with food chips, an auto-suggested pickup-by time and a built-in timer (median posting time: <!-- TODO --> s) |
| Smart matching by distance, quantity, timing and need | Matching engine with eligibility rules, a weighted score and stated reasons; volunteer selection by distance and capacity |
| Pickup coordination with live status: posted → claimed → collected → delivered | Server-enforced state machine, live updates over Server-Sent Events, handover codes |
| Impact view: meals saved and waste avoided, with assumptions | Donor and city dashboards with a "How we calculate this" panel and a printable monthly report |
| Handling and safety information: time window, storage, allergens | Safety card on every listing, offer and task; server-enforced safe windows and automatic expiry |
| Business case for donors and sponsors | Donor Pro, institution plans and CSR area sponsorships (see [Business model](#business-model)) |

---

## Screenshots

<!-- TODO: phone screenshots: Quick Post · offer with reasons · volunteer steps · live timeline · impact dashboard -->

---

## Architecture

```
 Progressive Web App (donor · receiver · volunteer · sponsor; English and Telugu)
        │  REST + JWT                         ▲  Server-Sent Events
        ▼                                     │
 Backend API (Express): listings · safety guidance · matching · offers · tasks · impact · voice post
        │
        ▼
 PostgreSQL (Supabase)               Speech-to-text + AI model (voice post, optional)
```

- **Matching score:** `0.4 × proximity + 0.3 × need + 0.2 × time slack + 0.1 × reliability`, applied after eligibility checks (veg-only, opening hours, remaining need, arrival before the pickup-by time). Weights live in configuration and are covered by unit tests.
- **State machine:** posted → offered → claimed → volunteer assigned → picked up → delivered, or expired / cancelled. Only the server changes status, one validated transition at a time; duplicate taps are rejected, and every change is written to the database in a single transaction.
- **Offer cascade:** the top-ranked kitchen gets 10 minutes to accept, then the next. After 5 offers the food opens to every eligible kitchen, and the first to accept receives it. A scheduler expires food at its pickup-by time.
- **Safety windows:** derived from published food-handling guidance for hot, room-temperature and chilled food, with stricter limits for dairy and non-veg. Donors may choose an earlier pickup, never a later one.

### Technology

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, PWA (Workbox), Leaflet with OpenStreetMap |
| Backend | Node.js, Express, TypeScript, Zod validation, Helmet, per-user rate limits |
| Database | PostgreSQL (Supabase) with tracked migrations; the API keeps a working copy in memory and writes every change through |
| Realtime | Server-Sent Events, with 15-second polling as a fallback |
| Voice (optional) | Gnani speech-to-text (English and Telugu) and an AI model that turns the transcript into a draft listing |
| Testing | Vitest on both sides (163 frontend tests), Supertest for the API |
| Hosting | Vercel (frontend), Render or Railway (API) |

---

## Safety, privacy and guardrails

- **Connection, not certification.** Every listing shows handling guidance and time limits; receivers check food before serving it.
- **No tax or legal claims** are made anywhere in the product.
- **Synthetic data only.** Fictional organisations and people, area-level locations, and no real addresses or phone numbers.
- **Handover codes** are visible only to the party who needs them: the pickup code to the donor, the delivery code to the receiving kitchen.
- **Secrets stay on the server**, and voice recordings are never stored.

---

## Business model

Receivers and volunteers use the platform free of charge.

| Customer | Value | Plan |
|---|---|---|
| Caterers and wedding halls | Lower disposal costs and a "zero-waste events" story for their clients | Donor Pro, per venue per month <!-- TODO: price --> |
| Hostel and college messes | Routine daily pickups and sustainability reports | Institution plan |
| CSR sponsors | Verified, reportable social and environmental impact | Area sponsorship with dashboard |
| City authorities (later) | Less food waste sent to landfill | City licence and data |

Details: [docs/06-business-model.md](docs/06-business-model.md).

---

## Results

Generated by `npm run metrics` on the seeded demo data (30 days, 120 listings). **These figures come from synthetic data, not real users**, and will be replaced with live numbers after a real pilot.

| Metric | Value |
|---|---|
| Time from posting to claim (median / p90) | 5 min / 6 min |
| Time from posting to delivery (median / p90) | 23 min / 39 min |
| Rescue rate (delivered, excluding cancelled) | 93.1% |
| Expiry rate (expired, excluding cancelled) | 6.9% |
| Offers sent before delivery (mean / median) | 2.04 / 2 |

Run `cd server && npm run metrics` against the database for the full report, including posting time, on-time rate, and meals and kilograms by area and donor type. Impact assumptions are documented in [docs/11-impact-assumptions.md](docs/11-impact-assumptions.md).

---

## Performance and accessibility

Designed for mid-range Android phones on 4G and 3G networks. All figures were measured on the production build (`npm run build && npm run preview`).

**Lighthouse, mobile profile (slow 4G, 4× CPU slowdown)**

| Page | Performance | Accessibility | Best Practices |
|---|---|---|---|
| `/login` | 87 | 100 | 100 |
| `/demo-guide` | 93 | 100 | 100 |

<!-- TODO: add the Lighthouse screenshot -->

**Bundle size** (uncompressed; budget: first load under 1.5 MB, each role's screen under 250 KB)

| Asset | Size |
|---|---|
| Main application chunk | 349 KB (113 KB gzipped) |
| Fonts (Noto Sans Telugu, self-hosted) | 266 KB |
| Largest role screen (Quick Post) | 28 KB |
| Map library (Leaflet), loaded only when a map is shown | 151 KB |

**Accessibility improvements**

| Check | Before | After |
|---|---|---|
| Secondary text contrast on the cream background | 3.3:1 to 4.46:1 (below WCAG AA) | 6.2:1 |
| Smallest tap target | 40 px | 48 px |
| Telugu at the largest text size on a 360 px screen | Offer page 445 px wide (horizontal scrolling) | Fits within 360 px |
| Icon buttons without an accessible label | 0 | 0 (all labels translated) |

The app is installable as a PWA (Chrome reports no installability errors) and opens offline from its service worker.

---

## Getting started

**Prerequisites:** Node.js 18 or later and npm. PostgreSQL is optional: without `DATABASE_URL`, the API runs in memory on the seeded demo data.

```bash
git clone https://github.com/Duggineniakhil/Annapoorna_Link.git
cd Annapoorna_Link

# API
cd server
cp .env.example .env        # then fill in your own values
npm install
npm run migrate && npm run seed
npm run dev

# Frontend (in a second terminal)
cd app
npm install
npm run dev
```

The frontend can also run on its own with a built-in mock API (`VITE_USE_MOCKS=true`, the default), which is useful for UI work without the server.

### Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key for demo auth tokens |
| `ALLOWED_ORIGIN` | Frontend URL allowed by CORS |
| `GNANI_API_KEY`, `AI_API_KEY`, `AI_MODEL` | Optional voice posting; without both keys, voice posting reports "busy" and everything else works |
| `DEMO_MODE` | `true` lets any signed-in user start the wedding-night demo (default: sponsor account only) |
| `VOICE_DAILY_PER_DONOR`, `VOICE_DAILY_GLOBAL` | Daily voice-posting limits (defaults 30 and 500) |
| `VITE_API_BASE_URL`, `VITE_USE_MOCKS` | Frontend API address and mock mode |

> Never commit `.env` files.

### Useful commands

| Command | Where | What it does |
|---|---|---|
| `npm test` | `app/`, `server/` | Run the test suite |
| `npm run lint` | `app/`, `server/` | Lint the code |
| `npm run build` | `app/`, `server/` | Production build |
| `npm run demo:reset` | `server/` | Restore the seeded demo data |
| `npm run metrics` | `server/` | Print the results report |

---

## Project structure

```
app/                  Progressive Web App: role-based screens, English/Telugu, maps, live updates
server/               API, matching engine, state machine, impact, seed data (see server/README.md)
docs/                 Problem research, product spec, architecture, business model and plans
CODEBENDERS_USAGE.md  How the project was built with Codebenders
```

---

## How it was built

The application was built in the **Codebenders IDE** during the hackathon build window (21 November, 11:30 AM to 22 November, 11:59 PM IST), using chat-to-build with the Nexon agent. [CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) records the timeline, key prompts, the iterations that mattered and where the output was corrected.

---

## Roadmap

- [x] Hyderabad MVP: post → match → pickup → deliver → impact
- [ ] Pilot with 10 caterers or wedding halls and 5 receivers
- [ ] Scheduled pickups for regular donors
- [ ] WhatsApp notifications
- [ ] Expansion to more cities; CSR and city partnerships

---

## Team

<!-- TODO: names and roles -->

---

## License

<!-- TODO: choose a license after checking the hackathon's ownership and licensing terms -->
