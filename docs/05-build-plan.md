# 05 — 36-Hour Build Plan
**Build window:** Sat 21 Nov 11:30 AM IST (as announced at the kick-off; the website says 12:00 PM) → Sun 22 Nov 11:59 PM IST.
**Hard cut-off:** the **last commit must be before Sun 22 Nov, 11:59 PM IST**. GitHub commits are tracked, and no building or committing is allowed after that.
**Submission form:** open until **Mon 23 Nov, 11:59 PM IST**. Use that extra time only for the video and the form.
**Rule:** all code is written in the **Codebenders IDE** (chat-to-build with Nexon). Log your key prompts as you go (`07-codebenders-usage.md`); it's part of the score. See `15-kickoff-session-notes.md` for every official answer.

Priorities: **P0** = must work in the demo · **P1** = strong plus · **P2** = only if ahead.

---

## Before you start coding (prep)
- [x] Gnani and an AI-model API inside the product: **allowed** (kick-off Q&A, 1:07:41). Only code generation must use Codebenders.
- [ ] **Both members** register through app.codebenders.ai/hackathon (Gigpoint alone isn't enough), claim the coupon and the **8 million credits each**, and log in to the Codebenders IDE with the same email.
- [ ] Ask in the WhatsApp group whether AI-drafted lesson content (docs 10–11) may be shipped in the app after review.
- [ ] Download the SCERT Class 8 Science Telugu textbook, pick the chapter (`04-content-plan.md`).
- [ ] Read Gnani's API docs: Telugu STT/TTS endpoints, audio format, auth, rate limits.
- [ ] Create a public GitHub repo (empty) + accounts on the hosting provider.

## Day 1 — Saturday
| Time (IST) | Goal | Done when |
|---|---|---|
| 12:00–1:30 | **Skeleton + deploy** (P0): PWA scaffold, Telugu font, routing for S1–S9, backend hello-world, both deployed | Public URL opens on your phone |
| 1:30–3:30 | **Profiles + Home** (P0): profile picker, PIN, IndexedDB per profile, Home buttons, online/offline badge | Two profiles keep separate data |
| 3:30–5:30 | **Content pack + Lessons** (P0): chapter JSON schema, 6–8 concept cards, lesson screens, offline caching | Lessons work in airplane mode |
| 5:30–6:00 | Break + commit + update usage log | |
| 6:00–8:30 | **Voice doubt** (P0): mic recording → `/api/stt` (Gnani) → transcript → `/api/tutor` (LLM) → Telugu answer | Spoken Telugu question gets a Telugu answer |
| 8:30–10:00 | **TTS + caching** (P0): `/api/tts` (Gnani), audio cache, "Explain simpler / example" buttons | Answer is read aloud; repeat answer plays instantly |
| 10:00–12:00 | **Question bank** (P0): write/review 30+ questions with misconception tags | Content pack validates |
| 12:00–1:00 AM | Commit, deploy, test on real phone, sleep plan | |

**Sleep at least 5 hours.** Bugs written at 4 AM cost more than they save.

## Day 2 — Sunday
| Time (IST) | Goal | Done when |
|---|---|---|
| 7:00–9:30 | **Adaptive practice** (P0): engine (mastery + misconceptions), practice screen, feedback in Telugu, unit tests | Wrong answers lead to targeted easier questions |
| 9:30–11:00 | **Sync** (P0): offline queue, `/api/sync`, idempotent upload, "last saved" indicator | Do practice offline → go online → server has the data |
| 11:00–12:30 | **Progress views** (P0): learner stars + parent traffic light + parent voice summary | Parent view understandable in 10 s |
| 12:30–1:00 | Lunch, commit | |
| 1:00–2:30 | **Photo doubt** (P1) + **Teacher view** with sample class (P1) | |
| 2:30–4:00 | **Polish & hardening**: error states in Telugu, data-saver mode, rate limits, Lighthouse run, keys check | No console errors; Lighthouse screenshot |
| 4:00–5:00 | **Pre-generate lesson audio**, seed demo profiles (`08-quality-and-testing.md`) | Demo account ready |
| 5:00–7:00 | **README, CODEBENDERS_USAGE.md, business doc in repo**, architecture diagram | Repo self-explanatory |
| 7:00–9:00 | Final bug fixes, final deploy, test the live link on a phone + incognito | Live app works end to end |
| 9:00–10:30 | **Record raw demo footage** of the final build on a real phone (backup in case hosting is down later) | Footage saved |
| **by 11:00 PM** | **Final commit + push** (target 11 PM; the hard cut-off is 11:59 PM) | `main` on GitHub = final build |
| 11:00–11:59 | Buffer. **No commits after 11:59 PM.** | |

## Monday 23 Nov (submission window: no code changes)
| Goal | Done when |
|---|---|
| **Demo video, 3–6 min** (`09-pitch-demo-submission.md`): problem, why we chose it, solution, walkthrough. Voiceover optional, no face cam needed | Uploaded; link opens without login |
| Pitch deck (if used), LinkedIn post | Links ready |
| **Submit the form** (duo form: both members' names, emails, phones) well before **11:59 PM IST** | Confirmation saved |

## Cut list (if behind schedule, drop in this order)
1. Teacher view → show a static mockup in the deck instead
2. Photo input → mention as roadmap (but voice must stay — it's required)
3. 2nd chapter
4. Parent voice summary → keep the text traffic-light view
5. Advanced sync → keep local progress + simple "sync now" button

**Never cut:** Telugu end-to-end, voice doubt, adaptive practice, offline lessons, a progress view, a working build recorded on video. (A live link is optional per the organisers, but strongly recommended for a voice + offline app.)

## Duo split (if you have a teammate)
| Person A (frontend/content) | Person B (backend/AI) |
|---|---|
| PWA, screens, offline cache, profiles | Gnani STT/TTS proxy, tutor prompt, sync API, DB |
| Concept cards + questions (Telugu) | Adaptive engine + tests, rate limits, deploy |
| Demo video + deck | README + Codebenders usage log |

## Git discipline
- Commit after every working slice, at least every 1–2 hours, with clear messages. Judges check the history to see it was built during the window.
- Tag `v0.1-skeleton`, `v0.5-voice`, `v1.0-submission`.
- **Nothing after Sun 22 Nov, 11:59 PM IST.** Organisers track commit times.
- If one member runs low on Codebenders credits, move the project to the teammate's account. Credits can't be transferred.
