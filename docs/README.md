# Vidya Nestham (విద్యా నేస్తం) — Hackathon Docs
ACE Builders Hackathon 2026 · **Problem Statement 3: The Last-Mile Tutor** · Telugu · Class 8 · Science (Telangana State Board)

> These are **planning documents only**, with no code. Under the rules, all code must be written in the **Codebenders IDE** during the build window (Sat 21 Nov 11:30 AM to Sun 22 Nov 11:59 PM IST). The last commit must be before Sunday 11:59 PM, and the submission form closes Mon 23 Nov at 11:59 PM IST. Official answers from the kick-off are in [doc 15](15-kickoff-session-notes.md).

## Documents
| # | File | What it is |
|---|---|---|
| 01 | [01-problem-and-user.md](01-problem-and-user.md) | Persona, pain points, root causes, why existing options fail, success metrics, guardrails |
| 02 | [02-product-spec.md](02-product-spec.md) | Must-Include → feature mapping, screens, user flows, adaptive engine, tutor rules, data budget |
| 03 | [03-architecture.md](03-architecture.md) | Stack, system diagram, data model, offline/sync, Gnani voice pipeline, security, repo layout |
| 04 | [04-content-plan.md](04-content-plan.md) | Syllabus verification, chapter choice, Telugu writing rules, content structure, attribution |
| 05 | [05-build-plan.md](05-build-plan.md) | Hour-by-hour 36 h plan, cut list, duo split, git discipline |
| 06 | [06-business-model.md](06-business-model.md) | Who pays, pricing, unit economics, market size, moat, roadmap, risks |
| 07 | [07-codebenders-usage.md](07-codebenders-usage.md) | Prompt bank to paste into Codebenders + usage-log template |
| 08 | [08-quality-and-testing.md](08-quality-and-testing.md) | Sample profiles, acceptance tests, automated tests, demo-day reliability |
| 09 | [09-pitch-demo-submission.md](09-pitch-demo-submission.md) | Deck outline, 3–6 min demo video script, README outline, LinkedIn post, submission checklist |
| 10 | [10-concept-cards-force-friction.md](10-concept-cards-force-friction.md) | 15 Telugu concept cards (Force ×8, Friction ×7), term list to verify, misconception library. **Reference draft: see the AI-content warning inside** |
| 11 | [11-question-bank-force-friction.md](11-question-bank-force-friction.md) | 55 Telugu practice questions (MCQ, true/false, fill-in) with misconception tags and feedback. **Reference draft: same warning** |
| 12 | [12-team-split.md](12-team-split.md) | Two-member build split: ownership, shared contracts (content pack, API, engine, sync), task lists, timeline with sync points, fallback plan |
| 13 | [13-prompts-member-a.md](13-prompts-member-a.md) | Ready-to-paste Codebenders prompts for Member A (A1–A15), with checks after each and a dependency table |
| 14 | [14-prompts-member-b.md](14-prompts-member-b.md) | Ready-to-paste Codebenders prompts for Member B (B1–B15), with checks after each and a hand-off table to Member A |
| 15 | [15-kickoff-session-notes.md](15-kickoff-session-notes.md) | Official answers from the kick-off session: deadlines, what's allowed, credits, submission, and how to use the Codebenders IDE |

## Judging criteria → where the evidence lives
| Criterion | Weight | What judges must see | Evidence |
|---|---|---|---|
| **Working Product** | 30% | Voice doubt, adaptive practice, offline mode and progress views all working, shown in the mandatory 3–6 min video (a live link is optional but recommended) | Demo video, live URL, acceptance tests (08), Must-Include table (02 §1) |
| **Business Viability** | 25% | Who pays, how much, what it costs, why it scales | 06 (pricing, unit economics, SOM, go-to-market), deck slides 9–10 |
| **Problem & User Clarity** | 20% | One specific learner, real constraints, cited data, real quotes | 01 (persona, pain, root causes, user calls), deck slides 2–4 |
| **Build Quality & Use of Codebenders** | 15% | Clean architecture, tests, security, a documented prompt and iteration history | 03, 08, `CODEBENDERS_USAGE.md` (07), commit history |
| **Presentation** | 10% | A clear story, smooth demo, polished README | 09 (deck, video script, README, LinkedIn) |

## Do these first
1. ✅ Gnani and an AI-model API inside the product are **allowed** (kick-off Q&A). Only code generation must use Codebenders' own model.
2. **Both members** register through app.codebenders.ai/hackathon, claim the coupon (8 million credits each), and log in to the Codebenders IDE with the same email.
3. Ask in the WhatsApp group whether AI-drafted lesson content (docs 10–11) may be shipped in the app after review.
4. Download the SCERT Telangana Class 8 Science (Telugu medium) textbook and pick the chapter.
5. Read the Gnani API docs (Telugu STT/TTS, audio format).
6. ✅ Public GitHub repo created: Vidya_Nestham.
