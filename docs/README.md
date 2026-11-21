# Annapoorna Link (అన్నపూర్ణ లింక్): Hackathon Docs
ACE Builders Hackathon 2026 · **Problem Statement 2: Rescue the Surplus** · Hyderabad · Donors: caterers & wedding halls (launch), hostel/college messes, restaurants

> These are **planning documents only**, with no code. Under the rules, all code must be written in the **Codebenders IDE** during the build window (Sat 21 Nov 11:30 AM to Sun 22 Nov 11:59 PM IST). The last commit must be before Sunday 11:59 PM, and the submission form closes Mon 23 Nov at 11:59 PM IST. Official answers from the kick-off are in [doc 15](15-kickoff-session-notes.md).

## Documents
| # | File | What it is |
|---|---|---|
| 01 | [01-problem-and-user.md](01-problem-and-user.md) | Personas (donor, receiver, volunteer), pain, root causes, why existing options fail, success metrics, guardrails |
| 02 | [02-product-spec.md](02-product-spec.md) | Must-Include → feature mapping, roles and screens, flows, matching rules, safety card |
| 03 | [03-architecture.md](03-architecture.md) | Stack, system diagram, data model, state machine, realtime, voice post, security |
| 04 | [04-sample-data-plan.md](04-sample-data-plan.md) | Synthetic Hyderabad data: areas, orgs, demo accounts, history, demo scenario |
| 05 | [05-build-plan.md](05-build-plan.md) | 36-hour plan, cut list, git discipline, deadlines |
| 06 | [06-business-model.md](06-business-model.md) | Who pays, pricing, unit economics, market size, roadmap, risks |
| 07 | [07-codebenders-usage.md](07-codebenders-usage.md) | How we work with Codebenders, prompt rules, design decisions to log |
| 08 | [08-quality-and-testing.md](08-quality-and-testing.md) | Demo accounts, 19 acceptance tests, automated tests, demo-day reliability |
| 09 | [09-pitch-demo-submission.md](09-pitch-demo-submission.md) | Deck outline, 3–6 min demo video script, LinkedIn post, submission checklist |
| 10 | [10-food-handling-guidance.md](10-food-handling-guidance.md) | Storage windows, overrides, safety card text, what the app must never say |
| 11 | [11-impact-assumptions.md](11-impact-assumptions.md) | Formulas and assumptions for meals saved, waste and CO₂e avoided |
| 12 | [12-team-split.md](12-team-split.md) | Two-member split: ownership, shared contracts (types, API, decisions D1–D12), tasks, timeline |
| 13 | [13-prompts-member-a.md](13-prompts-member-a.md) | Context message + Codebenders prompts A1–A15 (frontend & experience) |
| 14 | [14-prompts-member-b.md](14-prompts-member-b.md) | Context message + Codebenders prompts B1–B15 (backend, matching & data) |
| 15 | [15-kickoff-session-notes.md](15-kickoff-session-notes.md) | Official answers from the kick-off session: deadlines, what's allowed, credits, submission, IDE tips |
| 16 | [16-ui-ux-design.md](16-ui-ux-design.md) | UI/UX direction: lessons from Olio and Too Good To Go, what we do better, colours, components, screen patterns |

## Judging criteria → where the evidence lives
| Criterion | Weight | What judges must see | Evidence |
|---|---|---|---|
| **Working Product** | 30% | Post → match → pickup → deliver → impact working end to end, shown in the mandatory 3–6 min video (a live link is optional but recommended) | Demo video, live URL, acceptance tests (08), Must-Include table (02 §1) |
| **Business Viability** | 25% | Who pays (donors, institutions, CSR, city), how much, costs, impact | 06, deck slide 10 |
| **Problem & User Clarity** | 20% | Specific donors, receivers and volunteers, a real night-time scenario, cited data, real quotes | 01, deck slides 2–4 |
| **Build Quality & Use of Codebenders** | 15% | Clean architecture, tested matching and state machine, security, documented prompt history | 03, 08, `CODEBENDERS_USAGE.md`, commit history |
| **Presentation** | 10% | A clear story, smooth demo, polished README | 09 |

## Do these first
1. ✅ External AI-model and voice APIs inside the product are **allowed** (kick-off Q&A). Only code generation must use Codebenders' own model.
2. **Both members** register through app.codebenders.ai/hackathon, claim the coupon (8 million credits each), and sign in to the IDE with the same email.
3. Start a **new Nexon chat** with the context message in doc 13 (Member A) or doc 14 (Member B).
4. Agree the contracts in doc 12 §2 together (30 min).
5. Make 3–5 quick user calls (doc 01 §7) for real quotes.
6. ✅ Public GitHub repo created: Vidya_Nestham. The product name is Annapoorna Link; you can rename the repo in GitHub settings.
