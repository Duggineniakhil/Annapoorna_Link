# How we built Annapoorna Link with Codebenders
**Annapoorna Link (అన్నపూర్ణ లింక్)** · ACE Builders Hackathon 2026 · Problem Statement 2: Rescue the Surplus

This file records how the application was developed in the **Codebenders IDE**: the build timeline, the key prompts, the iterations that mattered, and where we used our own judgement to correct or improve the output.

> **How to keep this file:** fill in each row **right after** finishing a task, while the details are fresh:
> - write the prompt and its result
> - note what you changed
> - add a screenshot in `docs/img/codebenders/`
> - add the commit hash
>
> Delete every `<!-- … -->` note and empty row before submitting.

---

## 1. Summary
| | |
|---|---|
| Build window | Sat 21 Nov 2026, 11:30 AM to Sun 22 Nov 2026, 11:59 PM IST (last commit before the window closed) |
| Live app | [annapoorna-link.vercel.app](https://annapoorna-link.vercel.app) (frontend on Vercel, API on Render) |
| Team | **CREED**: Duggineni Akhil (frontend & experience) · Kuchipudi Yokshith (backend, matching & data) |
| Total prompts used | <!-- e.g., 64 --> |
| Major iterations | <!-- e.g., 9 --> |
| Commits during the build window | 41 (36 by Duggineni Akhil, 5 by Kuchipudi Yokshith), first at Sat 13:15, latest at Sun 19:06 IST |
| Codebenders features used | <!-- see section 6 --> |

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

### Member A: Frontend & Experience
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| A1 | Sat 21:12 / 21:16 | PWA skeleton, roles, EN/TE | "Create the frontend skeleton for Annapoorna Link…" | | | | `e7365f3`, `cf0cd7b` |
| A2 | Sun 15:08 | Frontend deploy | | | | | `311bd77`, `742d731` |
| A3 | Sat 21:41 | Demo login & role routing | | | | | `d8aae41` |
| A4 | Sat 22:42 | Donor Quick Post | | | | | `98f5ce7` |
| A5 | Sat 23:30 | Donor listings & detail | | | | | `49acd00` |
| A6 | Sat 23:45 | Safety card | | | | | `fdc2456` |
| A7 | Sun 00:11 | Receiver offers, needs, history | | | | | `045e33a` |
| A8 | Sun 00:41 | Volunteer tasks & stepper | | | | | `7c539be` |
| A9 | Sun 01:03 | Live updates | | | | | `56f8465` |
| A10 | Sun 01:17 | Map | | | | | `97475f0` |
| A11 | Sun 01:40 | Impact dashboards | | | | | `1ff271c` |
| A12 | Sun 01:54 | Voice post UI | | | | | `b0c17aa` |
| A13 | Sun 02:07 | Errors, empty states, settings | | | | | `83a30a7` |
| A14 | Sun 02:23 | Demo mode | | | | | `8b1f1ec` |
| A15 | Sun 15:02 | Performance & accessibility | | | | | `d8141ee` |

### Member B: Backend, Matching & Data
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| B1 | Sun 01:25 | Backend skeleton + stubs | "Create the backend skeleton for Annapoorna Link…" | | | | `825c7de` |
| B2 | Sun 01:25 | Deploy + Postgres | | | | | `825c7de` |
| B3 | Sun 01:25 | Seed data | | | | | `825c7de` |
| B4 | Sun 01:25 | Demo auth & authorization | | | | | `825c7de` |
| B5 | Sun 01:25 | Guidance service | | | | | `825c7de` |
| B6 | Sun 01:25 | Listings API + expiry | | | | | `825c7de` |
| B7 | Sun 01:25 | Matching engine | | | | | `825c7de` |
| B8 | Sun 01:25 / 01:27 | Offer cascade | | | | | `825c7de`, `aa56ca2` |
| B9 | Sun 01:25 / 01:27 | Tasks, codes, state machine | | | | | `825c7de`, `aa56ca2` |
| B10 | Sun 01:25 | Realtime (SSE) | | | | | `825c7de` |
| B11 | Sun 01:25 | Impact calculator | | | | | `825c7de` |
| B12 | Sun 01:59 | Voice post | | | | | `53698ab` |
| B13 | Sun 01:48 | Demo scenario bots | | | | | `b4839cb` |
| B14 | Sun 01:25 | Hardening | | | | | `825c7de` |
| B15 | Sun 01:25 | Metrics | | | | | `825c7de` |

Member B's first tasks (B1–B11, B14, B15) landed together in one commit, `825c7de`, when the backend was pushed to the shared repository.

### Work after the task lists
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| A16 | Sun 15:22 / 15:35 | Frontend against the live API's response shapes | | | | | `084f440`, `91eaa23` |
| A17 | Sun 15:45 | API deploy on Render (blueprint, in memory) | | | | | `cf75099` |
| A18 | Sun 16:04 | Volunteer history, weekly impact, demo kitchens first in DEMO_MODE | | | | | `53fa227` |
| A19 | Sun 16:35 | Redesign: photo homepage, desktop layout, food photos | | | | | `83d53d1` |
| A20 | Sun 16:55 | Redesign: detail screens | | | | | `c6c91ea` |
| A21 | Sun 15:06 / 19:06 | README, screenshots, Lighthouse re-run | | | | | `dc9df3a`, `e899496` |

<!-- Add rows for extra prompts (bug fixes, refactors) like A7.1, B8.2 -->

## 4. Iterations that mattered
<!-- Add the prompt wording you used for each case, and before/after screenshots. -->

### Iteration 1: The app crashed against the real server
- **What we saw:** the frontend was built against mocks. On the live API, listings carried the donor and kitchen as full objects instead of ids, the volunteer as an object instead of a name, and the impact report had no weekly figures, so several screens broke.
- **Fix:** one adapter (`app/src/services/serverShape.ts`) converts the server's shapes into the app's types, with fallbacks for routes the server did not have yet. The missing routes (volunteer history, weekly impact) were then added to the server.
- **Result:** every role works end to end on the live deployment. Commits `084f440`, `91eaa23`, `53fa227`.

### Iteration 2: Voice posts failed on iPhones
- **What we saw:** browsers record in different formats (WebM, Ogg, MP4/AAC), and the speech-to-text service did not accept all of them.
- **Fix:** the app records AAC where the browser can, otherwise converts the recording to WAV in the browser, with a shorter limit for WAV to keep uploads small. Clear error messages in English and Telugu for each failure.
- **Result:** one upload path that works across browsers. Commit `8b1f1ec`.

### Iteration 3: The hand demo found no kitchen during the day
- **What we saw:** the demo kitchens only open from 6 PM to 11 PM, so during daytime judging a donor's post was offered to other kitchens or to none.
- **Fix:** with `DEMO_MODE=true`, posts from demo donors go to the demo kitchens first, ignoring their opening hours. Every other matching rule still applies, and normal matching is unchanged.
- **Result:** checked against the live API at 4:43 PM: post → offer to a demo kitchen → accept → pickup → delivery → volunteer history. Commit `53fa227`.

### Iteration 4: Accessibility on small phones
- **What we saw:** secondary text was below WCAG AA contrast (3.3:1 to 4.46:1), tap targets were 40 px, and Telugu at the largest text size made the offer page 445 px wide on a 360 px screen.
- **Fix:** darker secondary text, 48 px targets, wrapping action buttons.
- **Result:** 6.2:1 contrast, 48 px targets, no horizontal scrolling; Lighthouse accessibility 100. Commit `d8141ee`.

### Iteration 5: The interface looked generic
- **What we saw:** a phone-only layout that wasted desktop screens and had no imagery.
- **Fix:** a dark, photographic public homepage with a video hero; a light app with a desktop sidebar, food photos on cards and two-column detail pages. Letter-spacing turned off for Telugu, where it split letters apart.
- **Result:** Lighthouse mobile performance 96 on the homepage, accessibility 100 on every page measured. Commits `83d53d1`, `c6c91ea`.

## 5. Key design decisions
1. **Under-a-minute posting.** Chips, smart defaults, an auto-suggested pickup time and "repeat last post". The app measures posting time, so the claim is testable. Median: <!-- ___ s -->.
2. **Explainable matching.** A weighted score after eligibility rules (veg-only, open hours, need, arrival before pickup-by). Receivers see the top reasons in English and Telugu. Pure functions, unit-tested, weights in config.
3. **Offer cascade.** 10 minutes per receiver, then the next, then open to all, so food never waits on one phone call.
4. **Handover codes instead of GPS.** A pickup code (donor) and a delivery code (receiver), entered by the volunteer. They prove each step, protect privacy and work on weak networks.
5. **Server-enforced safety windows.** Pickup-by can't exceed the guidance rules, and listings auto-expire. The app never says food is safe and never promises tax or legal benefits.
6. **Honest impact.** Only delivered food counts, and every number shows its assumptions and sources.
7. **Live updates with SSE** plus a polling fallback, simpler than websockets.
8. **Two design moods.** A dark, photographic homepage that explains the idea in seconds, and a light, calm app for getting work done, with a sidebar on desktop and bottom tabs on phones.
9. **Demo without sign-up.** Fictional demo accounts, a one-tap wedding-night demo, and role cards on the homepage that sign straight into an account.

## 6. Codebenders features we used
<!-- Only list what you actually used, with one line on how. -->
| Feature | How we used it |
|---|---|
| <!-- e.g., Nexon chat-to-build with plan approval --> | |
| <!-- e.g., debugging / error explanation --> | |
| <!-- e.g., test generation --> | |

## 7. Where human judgement corrected or improved the output
| Area | What we checked | Examples of changes |
|---|---|---|
| **Matching logic** | Hand-checked rankings against seeded receivers | Demo kitchens' evening-only hours blocked the daytime demo; fixed with `DEMO_MODE` without changing normal matching |
| **Safety wording** | No "safe/certified" claims, no tax or legal promises; guidance checked against published sources | <!-- … --> |
| **Security** | Codes only visible to the right role, keys server-side, rate limits | <!-- … --> |
| **Privacy** | Synthetic, area-level data only | The sponsor map lists recent deliveries by area only, with no lines to individual kitchens |
| **Telugu text** | Reviewed by <!-- name/role --> | Letter-spacing removed for Telugu headings; layout checked at 360 px with the largest text size |
| **Real-phone testing** | <!-- phone model, network --> | <!-- … --> |

## 8. Data and sources
- **Organisations, people and locations:** fictional, synthetic demo data (area-level, Hyderabad).
- **Food-handling guidance:** based on published food-safety guidance. See `docs/10-food-handling-guidance.md` for the sources we checked.
- **Impact factors:** see `docs/11-impact-assumptions.md` for the formulas and sources.

## 9. Evidence
- Screenshots of the Codebenders IDE at key steps: [`docs/img/codebenders/`](docs/img/codebenders/)
- Short screen recordings: <!-- links -->
- Git history, one commit per task: [commits on `main`](https://github.com/Duggineniakhil/Annapoorna_Link/commits/main)
- Test results: 167 frontend tests and 86 API tests passing (`npm test` in `app/` and `server/`) <!-- add screenshots -->
- Lighthouse report (mobile): homepage 96 performance, sign-in 82–87, demo guide 93; accessibility and best practices 100 on all three (see the README) <!-- add screenshot -->
- App screenshots: [`docs/screenshots/`](docs/screenshots/)

## 10. Before submitting: confirm each item
- [ ] All application code was written in the Codebenders IDE during the build window.
- [ ] Every row in section 3 is filled in, or removed if the task was dropped.
- [ ] At least 3 real iterations are documented in section 4.
- [ ] Section 6 lists only features we actually used.
- [ ] No API keys, tokens or personal data appear in this file or its screenshots.
- [ ] All `<!-- … -->` notes are removed.
