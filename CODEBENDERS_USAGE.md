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
| Team | <!-- Member A name --> (frontend & experience) · <!-- Member B name --> (backend, matching & data) |
| Total prompts used | <!-- e.g., 64 --> |
| Major iterations | <!-- e.g., 9 --> |
| Commits during the build window | <!-- e.g., 48 --> |
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
| A1 | | PWA skeleton, roles, EN/TE | "Create the frontend skeleton for Annapoorna Link…" | | | | |
| A2 | | Frontend deploy | | | | | |
| A3 | | Demo login & role routing | | | | | |
| A4 | | Donor Quick Post | | | | | |
| A5 | | Donor listings & detail | | | | | |
| A6 | | Safety card | | | | | |
| A7 | | Receiver offers, needs, history | | | | | |
| A8 | | Volunteer tasks & stepper | | | | | |
| A9 | | Live updates | | | | | |
| A10 | | Map | | | | | |
| A11 | | Impact dashboards | | | | | |
| A12 | | Voice post UI | | | | | |
| A13 | | Errors, empty states, settings | | | | | |
| A14 | | Demo mode | | | | | |
| A15 | | Performance & accessibility | | | | | |

### Member B: Backend, Matching & Data
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| B1 | | Backend skeleton + stubs | "Create the backend skeleton for Annapoorna Link…" | | | | |
| B2 | | Deploy + Postgres | | | | | |
| B3 | | Seed data | | | | | |
| B4 | | Demo auth & authorization | | | | | |
| B5 | | Guidance service | | | | | |
| B6 | | Listings API + expiry | | | | | |
| B7 | | Matching engine | | | | | |
| B8 | | Offer cascade | | | | | |
| B9 | | Tasks, codes, state machine | | | | | |
| B10 | | Realtime (SSE) | | | | | |
| B11 | | Impact calculator | | | | | |
| B12 | | Voice post | | | | | |
| B13 | | Demo scenario bots | | | | | |
| B14 | | Hardening | | | | | |
| B15 | | Metrics | | | | | |

<!-- Add rows for extra prompts (bug fixes, refactors) like A7.1, B8.2 -->

## 4. Iterations that mattered
<!-- Pick 3–5 real cases: what you asked, what went wrong, how you changed the prompt or code, the result. Before/after screenshots are the strongest evidence. -->

### Iteration 1: <!-- e.g., "Matching offered non-veg food to a veg-only shelter" -->
- **Prompt v1:**
- **What we saw:**
- **Prompt v2 / fix:**
- **Result:**

### Iteration 2: <!-- title -->
- **Prompt v1:**
- **What we saw:**
- **Prompt v2 / fix:**
- **Result:**

### Iteration 3: <!-- title -->
- **Prompt v1:**
- **What we saw:**
- **Prompt v2 / fix:**
- **Result:**

## 5. Key design decisions
1. **Under-a-minute posting.** Chips, smart defaults, an auto-suggested pickup time and "repeat last post". The app measures posting time, so the claim is testable. Median: <!-- ___ s -->.
2. **Explainable matching.** A weighted score after eligibility rules (veg-only, open hours, need, arrival before pickup-by). Receivers see the top reasons in English and Telugu. Pure functions, unit-tested, weights in config.
3. **Offer cascade.** 10 minutes per receiver, then the next, then open to all, so food never waits on one phone call.
4. **Handover codes instead of GPS.** A pickup code (donor) and a delivery code (receiver), entered by the volunteer. They prove each step, protect privacy and work on weak networks.
5. **Server-enforced safety windows.** Pickup-by can't exceed the guidance rules, and listings auto-expire. The app never says food is safe and never promises tax or legal benefits.
6. **Honest impact.** Only delivered food counts, and every number shows its assumptions and sources.
7. **Live updates with SSE** plus a polling fallback, simpler than websockets.

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
| **Matching logic** | Hand-checked rankings against seeded receivers | <!-- … --> |
| **Safety wording** | No "safe/certified" claims, no tax or legal promises; guidance checked against published sources | <!-- … --> |
| **Security** | Codes only visible to the right role, keys server-side, rate limits | <!-- … --> |
| **Privacy** | Synthetic, area-level data only | <!-- … --> |
| **Telugu text** | Reviewed by <!-- name/role --> | <!-- … --> |
| **Real-phone testing** | <!-- phone model, network --> | <!-- … --> |

## 8. Data and sources
- **Organisations, people and locations:** fictional, synthetic demo data (area-level, Hyderabad).
- **Food-handling guidance:** based on published food-safety guidance. See `docs/10-food-handling-guidance.md` for the sources we checked.
- **Impact factors:** see `docs/11-impact-assumptions.md` for the formulas and sources.

## 9. Evidence
- Screenshots of the Codebenders IDE at key steps: [`docs/img/codebenders/`](docs/img/codebenders/)
- Short screen recordings: <!-- links -->
- Git history, one commit per task: <!-- link -->
- Test results: <!-- screenshots -->
- Lighthouse report: <!-- screenshot -->

## 10. Before submitting: confirm each item
- [ ] All application code was written in the Codebenders IDE during the build window.
- [ ] Every row in section 3 is filled in, or removed if the task was dropped.
- [ ] At least 3 real iterations are documented in section 4.
- [ ] Section 6 lists only features we actually used.
- [ ] No API keys, tokens or personal data appear in this file or its screenshots.
- [ ] All `<!-- … -->` notes are removed.
