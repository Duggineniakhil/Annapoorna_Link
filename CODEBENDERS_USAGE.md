# How we built Annapoorna Link with Codebenders
**Annapoorna Link (అన్నపూర్ణ లింక్)** · ACE Builders Hackathon 2026 · Problem Statement 2: Rescue the Surplus

This file records how the application was developed in the **Codebenders IDE**: the build timeline, the key prompts, the iterations that mattered, and where we used our own judgement to correct or improve the output.

---

## 1. Summary
| | |
|---|---|
| Build window | Sat 21 Nov 2026, 11:30 AM to Sun 22 Nov 2026, 11:59 PM IST (last commit before the window closed) |
| Live app | [annapoorna-link.vercel.app](https://annapoorna-link.vercel.app) (frontend on Vercel, API on Render) |
| Team | **CREED**: Duggineni Akhil (frontend & experience) · Kuchipudi Yokshith (backend, matching & data) |
| Total prompts used | 33 prompts in 7 Nexon sessions (Member A's exported chats, Sat 19:12 to Sun 14:45 IST) |
| Major iterations | 9 (section 4) |
| Commits during the build window | 41 (36 by Duggineni Akhil, 5 by Kuchipudi Yokshith), first at Sat 13:15, latest at Sun 19:06 IST |
| Codebenders features used | Nexon chat-to-build, plan-first replies, editor and tester agents, follow-up questions (section 6) |

## 2. How we worked with Codebenders
1. **Spec first.** Right after choosing the problem statement, we wrote planning documents in [`docs/`](docs/): users, product spec, architecture, food-handling rules, impact assumptions, and shared contracts between the two members. We gave these to Codebenders as context so its output matched one consistent design.
2. **Chat to build with Nexon, one task at a time.** Each member worked through a numbered task list (A1–A15, B1–B15).
   - Each task started with one detailed prompt ([Member A prompts](docs/13-prompts-member-a.md), [Member B prompts](docs/14-prompts-member-b.md)).
   - We read Nexon's plan before approving it, and split a prompt when the plan was too large.
   - Short follow-up prompts fixed or refined the result. If a fix failed twice, we re-planned instead of resending it.
3. **Contracts and mocks.** We agreed the types, API and decisions up front ([team split §2](docs/12-team-split.md)). That let both members build in parallel, with the frontend running on mocks until the backend was live.
4. **Verify every output.** After every prompt we ran tests and checked the result on real phones, with donor, receiver and volunteer in separate windows.
5. **Commit small.** One commit per task, so the git history shows the build step by step.

## 3. Build timeline

### Planning sessions
| Time (IST) | Session | What happened |
|---|---|---|
| Sat 19:12 to 20:10 | Context and questions | We first planned a different idea (a Telugu science tutor for Problem Statement 3). Nexon read the planning docs, listed what it understood and asked eight questions; we answered them as build decisions. |
| Sat 20:37 | Switch to Problem Statement 2 | We gave Nexon the Annapoorna Link context and docs. It summarised the product and flagged open items (missing seed-data doc, unreviewed Telugu, emission factor source) before writing any code. |

### Member A: Frontend & Experience
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Commit |
|---|---|---|---|---|---|---|
| A1 | Sat 21:12 / 21:16 | PWA skeleton, roles, EN/TE | Chat Sat 20:39. "Create the frontend skeleton for Annapoorna Link in app/. This task is ONLY the skeleton: routes, layout, i18n and placeholders." | `package.json`, TypeScript and Vite configs, `config.ts` and the shared API types. `npm install` passed after it moved `eslint-plugin-react-hooks` from ^4.6.2 to ^5.2.0. | Deferred the Telugu strings to a second step. The editor agent's write gate then refused new files, so we re-sent the step as small batches ("Write the files yourself, one at a time"). | `e7365f3`, `cf0cd7b` |
| A2 | Sun 15:08 | Frontend deploy | | | | `311bd77`, `742d731` |
| A3 | Sat 21:41 | Demo login & role routing | Chat Sat 21:19. "Implement demo login and role-based routing for Annapoorna Link." | Fetch client with typed EN/TE errors and a 15 s timeout, mock API handlers, auth context, role guards, account switcher; 20 tests (13 redirect cases, 7 error-mapping cases). | A test-library version clash: we told Nexon to pin `@testing-library/jest-dom` to ^6, keep Vitest unchanged and not use `--legacy-peer-deps`. | `d8aae41` |
| A4 | Sat 22:42 | Donor Quick Post | Chat Sat 21:43. "Build the donor Quick Post screen (/donor/post). Goal: a busy caterer posts surplus in under 60 seconds." | Quick Post rules in the mock API: categories, storage, safe pickup windows. Writes to new files under `src/lib/` and `src/services/` were refused by the editor's permission gate. | Code review by Akhil found four issues (per-item veg ignored, weak validation, past pickup accepted, garbled text). Nexon reproduced three, fixed them, and showed the fourth did not reproduce. | `98f5ce7` |
| A5 | Sat 23:30 | Donor listings & detail | Chat Sat 23:14. "Build donor listings for Annapoorna Link." | Donor home with Active and Past tabs, listing detail with timeline, pickup code and cancel; mocks for list, detail and cancel. 69 tests passing. | Kept the pickup countdown on past cards because the spec asked for it; noted the status shown twice on active cards for later. | `49acd00` |
| A6 | Sat 23:45 | Safety card | Chat Sat 23:32. "Build a reusable SafetyCard component (app/src/components/SafetyCard.tsx) used on every listing, offer and task." | `SafetyCard` with full and compact variants (storage, countdown, veg, allergens, guidance, disclaimer) wired into donor, offer and task screens; 8 new tests (81 total). | Nexon flagged two strings near the "no 'safe' claims" rule; we kept them because they describe timing, not food safety. | `fdc2456` |
| A7 | Sun 00:11 | Receiver offers, needs, history | Chat Sat 23:46. "Build the receiver screens for Annapoorna Link." | Offers list with match-reason chips and expiry countdown, offer detail with accept and decline reasons, needs and history screens. 93 tests passing. | Nexon ignored a stray instruction returned by one exploration call because it did not match the request. | `045e33a` |
| A8 | Sun 00:41 | Volunteer tasks & stepper | Chat Sun 00:13. "Build the volunteer screens for Annapoorna Link." | Availability switch, open and active tasks, four-step pickup and delivery stepper with 4-digit codes and a tries-left message, history. 107 tests passing. | Lint fix in the task mapper re-verified by a second run. | `7c539be` |
| A9 | Sun 01:03 | Live updates | Chat Sun 00:42. "Add live updates across Annapoorna Link." | Server-Sent Events client with backoff and a polling fallback, live toasts, status note, tests. | The editor marked the screen wiring as cancelled; we told Nexon to finish it. Every screen now uses one shared `useLiveRefetch` instead of its own 15 s timer. | `56f8465` |
| A10 | Sun 01:17 | Map | | | | `97475f0` |
| A11 | Sun 01:40 | Impact dashboards | | | | `1ff271c` |
| A12 | Sun 01:54 | Voice post UI | | | | `b0c17aa` |
| A13 | Sun 02:07 | Errors, empty states, settings | | | | `83a30a7` |
| A14 | Sun 02:23 | Demo mode | | | | `8b1f1ec` |
| A15 | Sun 15:02 | Performance & accessibility | Chat Sun 14:07. "Do a performance and accessibility pass on Annapoorna Link for mid-range Android phones on 4G/3G." | Measured baseline: 395 KB first load, largest role chunk 27 KB, Leaflet lazy (151 KB), Lighthouse performance 95 to 97. Fixed the colour-contrast failure. | We asked it to continue after the baseline. Lighthouse accessibility went from 96 to 100; the 360 px Telugu check was finished afterwards in commit `d8141ee`. | `d8141ee` |

### Member B: Backend, Matching & Data
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Commit |
|---|---|---|---|---|---|---|
| B1 | Sun 01:25 | Backend skeleton + stubs | "Create the backend skeleton for Annapoorna Link…" | | | `825c7de` |
| B2 | Sun 01:25 | Deploy + Postgres | | | | `825c7de` |
| B3 | Sun 01:25 | Seed data | | | | `825c7de` |
| B4 | Sun 01:25 | Demo auth & authorization | | | | `825c7de` |
| B5 | Sun 01:25 | Guidance service | | | | `825c7de` |
| B6 | Sun 01:25 | Listings API + expiry | | | | `825c7de` |
| B7 | Sun 01:25 | Matching engine | | | | `825c7de` |
| B8 | Sun 01:25 / 01:27 | Offer cascade | | | | `825c7de`, `aa56ca2` |
| B9 | Sun 01:25 / 01:27 | Tasks, codes, state machine | | | | `825c7de`, `aa56ca2` |
| B10 | Sun 01:25 | Realtime (SSE) | | | | `825c7de` |
| B11 | Sun 01:25 | Impact calculator | | | | `825c7de` |
| B12 | Sun 01:59 | Voice post | | | | `53698ab` |
| B13 | Sun 01:48 | Demo scenario bots | | | | `b4839cb` |
| B14 | Sun 01:25 | Hardening | | | | `825c7de` |
| B15 | Sun 01:25 | Metrics | | | | `825c7de` |

Member B's first tasks (B1–B11, B14, B15) landed together in one commit, `825c7de`, when the backend was pushed to the shared repository.

### Work after the task lists
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Commit |
|---|---|---|---|---|---|---|
| A16 | Sun 15:22 / 15:35 | Frontend against the live API's response shapes | | | | `084f440`, `91eaa23` |
| A17 | Sun 15:45 | API deploy on Render (blueprint, in memory) | | | | `cf75099` |
| A18 | Sun 16:04 | Volunteer history, weekly impact, demo kitchens first in DEMO_MODE | | | | `53fa227` |
| A19 | Sun 16:35 | Redesign: photo homepage, desktop layout, food photos | | | | `83d53d1` |
| A20 | Sun 16:55 | Redesign: detail screens | | | | `c6c91ea` |
| A21 | Sun 15:06 / 19:06 | README, screenshots, Lighthouse re-run | | | | `dc9df3a`, `e899496` |

## 4. Iterations that mattered

### Iteration 1: Code review of the Quick Post rules
- **Prompt v1 (Sat 21:43):** "Build the donor Quick Post screen (/donor/post). Goal: a busy caterer posts surplus in under 60 seconds."
- **What we saw:** reading the generated rules, Akhil found four issues: every item took the listing's veg flag instead of its own, invalid categories such as `pizza` were accepted, a pickup time in the past was accepted, and some text looked garbled.
- **Prompt v2 (Sat 22:21):** "Issues I found. Issue 1, incorrect non-veg category handling… Change the item mapping to preserve individual values." with the exact lines for each issue.
- **Result:** Nexon reproduced each issue before changing anything. Three were real and fixed (the stored latest pickup was cooked + 90 min instead of + 60; `pizza` accepted; past pickup accepted). The garbled text did not reproduce. Tests, build and lint passed.

### Iteration 2: Blocked file writes
- **Prompt v1 (Sat 20:39 and 21:43):** the A1 and A4 task prompts.
- **What we saw:** the editor agent's permission gate refused new files, first for the skeleton and then for `src/lib/` and `src/services/`, even after we granted permission. Nexon reported each refusal and checked the disk instead of claiming the files existed.
- **Prompt v2:** "Write the files yourself, one at a time; do not delegate", then "Stop all write attempts for now… Do not bypass editor restrictions using a shell."
- **Result:** no workaround around the permission gate; smaller batches, one location for the Quick Post logic, and an honest status after every attempt.

### Iteration 3: Dependency conflicts
- **What we saw:** `npm install` failed on a peer-dependency clash, and later `@testing-library/jest-dom` clashed with Vitest 3.
- **Fix:** Nexon moved `eslint-plugin-react-hooks` to ^5.2.0; we told it to pin `@testing-library/jest-dom` to ^6, keep Vitest unchanged and not use `--legacy-peer-deps`.
- **Result:** clean installs; 20 tests passing at the end of A3.

### Iteration 4: Live updates left half-wired
- **Prompt v1 (Sun 00:42):** "Add live updates across Annapoorna Link."
- **What we saw:** the shared live layer was built, but the editor marked the screen wiring as cancelled.
- **Prompt v2 (Sun 00:53):** "still available, so do it".
- **Result:** every screen uses one shared `useLiveRefetch` hook; no screen keeps its own 15-second timer.


### Iteration 5: The app crashed against the real server
- **What we saw:** the frontend was built against mocks. On the live API, listings carried the donor and kitchen as full objects instead of ids, the volunteer as an object instead of a name, and the impact report had no weekly figures, so several screens broke.
- **Fix:** one adapter (`app/src/services/serverShape.ts`) converts the server's shapes into the app's types, with fallbacks for routes the server did not have yet. The missing routes (volunteer history, weekly impact) were then added to the server.
- **Result:** every role works end to end on the live deployment. Commits `084f440`, `91eaa23`, `53fa227`.

### Iteration 6: Voice posts failed on iPhones
- **What we saw:** browsers record in different formats (WebM, Ogg, MP4/AAC), and the speech-to-text service did not accept all of them.
- **Fix:** the app records AAC where the browser can, otherwise converts the recording to WAV in the browser, with a shorter limit for WAV to keep uploads small. Clear error messages in English and Telugu for each failure.
- **Result:** one upload path that works across browsers. Commit `8b1f1ec`.

### Iteration 7: The hand demo found no kitchen during the day
- **What we saw:** the demo kitchens only open from 6 PM to 11 PM, so during daytime judging a donor's post was offered to other kitchens or to none.
- **Fix:** with `DEMO_MODE=true`, posts from demo donors go to the demo kitchens first, ignoring their opening hours. Every other matching rule still applies, and normal matching is unchanged.
- **Result:** checked against the live API at 4:43 PM: post → offer to a demo kitchen → accept → pickup → delivery → volunteer history. Commit `53fa227`.

### Iteration 8: Accessibility on small phones
- **What we saw:** secondary text was below WCAG AA contrast (3.3:1 to 4.46:1), tap targets were 40 px, and Telugu at the largest text size made the offer page 445 px wide on a 360 px screen.
- **Prompt (Sun 14:07):** "Do a performance and accessibility pass on Annapoorna Link for mid-range Android phones on 4G/3G." then "continue".
- **Fix:** darker secondary text, 48 px targets, wrapping action buttons.
- **Result:** 6.2:1 contrast, 48 px targets, no horizontal scrolling; Lighthouse accessibility 100. Commit `d8141ee`.

### Iteration 9: The interface looked generic
- **What we saw:** a phone-only layout that wasted desktop screens and had no imagery.
- **Fix:** a dark, photographic public homepage with a video hero; a light app with a desktop sidebar, food photos on cards and two-column detail pages. Letter-spacing turned off for Telugu, where it split letters apart.
- **Result:** Lighthouse mobile performance 96 on the homepage, accessibility 100 on every page measured. Commits `83d53d1`, `c6c91ea`.

## 5. Key design decisions
1. **Under-a-minute posting.** Chips, smart defaults, an auto-suggested pickup time and "repeat last post". The app measures posting time, so the claim is testable.
2. **Explainable matching.** A weighted score after eligibility rules (veg-only, open hours, need, arrival before pickup-by). Receivers see the top reasons in English and Telugu. Pure functions, unit-tested, weights in config.
3. **Offer cascade.** 10 minutes per receiver, then the next, then open to all, so food never waits on one phone call.
4. **Handover codes instead of GPS.** A pickup code (donor) and a delivery code (receiver), entered by the volunteer. They prove each step, protect privacy and work on weak networks.
5. **Server-enforced safety windows.** Pickup-by can't exceed the guidance rules, and listings auto-expire. The app never says food is safe and never promises tax or legal benefits.
6. **Honest impact.** Only delivered food counts, and every number shows its assumptions and sources.
7. **Live updates with SSE** plus a polling fallback, simpler than websockets.
8. **Two design moods.** A dark, photographic homepage that explains the idea in seconds, and a light, calm app for getting work done, with a sidebar on desktop and bottom tabs on phones.
9. **Demo without sign-up.** Fictional demo accounts, a one-tap wedding-night demo, and role cards on the homepage that sign straight into an account.

## 6. Codebenders features we used
| Feature | How we used it |
|---|---|
| Nexon chat-to-build | One detailed prompt per task (A1, A3–A9, A15), then short follow-ups to fix or redirect |
| Context from planning docs | Every session started by pointing Nexon at `docs/01`–`03` and `docs/12`; it summarised its understanding and asked questions before coding |
| Editor agent | Wrote and changed files; its permission gate stopped writes we had not cleared, and Nexon reported each refusal |
| Tester agent (verify mode) | Ran `npm test`, `npm run build`, `npm run lint` and Lighthouse after each task and reported exact results |
| Follow-up questions | Nexon asked before risky steps (where to put files, whether to retry blocked writes) instead of guessing |
| Session export | The seven sessions were exported as JSON for this log |

## 7. Where human judgement corrected or improved the output
| Area | What we checked | Examples of changes |
|---|---|---|
| **Quick Post rules** | Read the generated rules line by line | Four issues reported with exact lines; three real ones fixed (Iteration 1) |
| **Matching logic** | Hand-checked rankings against seeded receivers | Demo kitchens' evening-only hours blocked the daytime demo; fixed with `DEMO_MODE` without changing normal matching |
| **Safety wording** | No "safe/certified" claims, no tax or legal promises; guidance checked against published sources | Two timing strings near the rule reviewed and kept; the disclaimer keeps "does not certify food safety" |
| **Security** | Codes only visible to the right role, keys server-side, rate limits | Pickup code hidden once food is picked up; five wrong code tries lock the step |
| **Privacy** | Synthetic, area-level data only | The sponsor map lists recent deliveries by area only, with no lines to individual kitchens |
| **Telugu text** | Reviewer: Duggineni Akhil; every Telugu string stays a draft until he signs it off | Letter-spacing removed for Telugu headings; layout checked at 360 px with the largest text size |

## 8. Data and sources
- **Organisations, people and locations:** fictional, synthetic demo data (area-level, Hyderabad).
- **Food-handling guidance:** based on published food-safety guidance. See `docs/10-food-handling-guidance.md` for the sources we checked.
- **Impact factors:** see `docs/11-impact-assumptions.md` for the formulas and sources.

## 9. Evidence
- Exported Nexon sessions (JSON), Member A: seven sessions, 33 prompts, Sat 19:12 to Sun 14:45 IST
- Git history, one commit per task: [commits on `main`](https://github.com/Duggineniakhil/Annapoorna_Link/commits/main)
- Test results: 167 frontend tests and 86 API tests passing (`npm test` in `app/` and `server/`)
- Lighthouse report (mobile): homepage 96 performance, sign-in 82–87, demo guide 93; accessibility and best practices 100 on all three (see the README)
- App screenshots: [`docs/screenshots/`](docs/screenshots/)
