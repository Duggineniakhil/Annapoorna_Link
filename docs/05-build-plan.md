# 05 — 36-Hour Build Plan
**Build window:** Sat 21 Nov 12:00 PM IST → Sun 22 Nov 11:59 PM IST (extra submission window 23–24 Nov — don't rely on it).
**Rule:** all code is written in the **Codebenders IDE**. Log your key prompts as you go (`07-codebenders-usage.md`) — it's part of the score.

Priorities: **P0** = must work in the demo · **P1** = strong plus · **P2** = only if ahead.

---

## Before 12:00 PM (prep — no coding)
- [ ] Confirm with organisers (WhatsApp/Q&A): using the **Gnani API** and an **LLM API** inside the product is allowed. Save the reply (screenshot).
- [ ] Claim coupon, log in to the Codebenders IDE, check that it can create, run and deploy a project.
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
| 7:00–9:00 | **Demo video** (3 min) + **pitch deck** (`09-pitch-demo-submission.md`) | Video uploaded (unlisted) |
| 9:00–10:00 | LinkedIn post, final deploy, test the live link on a phone + incognito | |
| 10:00–11:00 | **SUBMIT** (target 10:30 PM — not 11:58 PM) | Confirmation received |
| 11:00–11:59 | Buffer | |

## Cut list (if behind schedule, drop in this order)
1. Teacher view → show a static mockup in the deck instead
2. Photo input → mention as roadmap (but voice must stay — it's required)
3. 2nd chapter
4. Parent voice summary → keep the text traffic-light view
5. Advanced sync → keep local progress + simple "sync now" button

**Never cut:** Telugu end-to-end, voice doubt, adaptive practice, offline lessons, a progress view, deployed link.

## Duo split (if you have a teammate)
| Person A (frontend/content) | Person B (backend/AI) |
|---|---|
| PWA, screens, offline cache, profiles | Gnani STT/TTS proxy, tutor prompt, sync API, DB |
| Concept cards + questions (Telugu) | Adaptive engine + tests, rate limits, deploy |
| Demo video + deck | README + Codebenders usage log |

## Git discipline
- Commit at least every 1–2 hours with clear messages (judges look at history to see it was built during the window).
- Tag `v0.1-skeleton`, `v0.5-voice`, `v1.0-submission`.
