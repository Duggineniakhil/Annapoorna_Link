# 12 — Team Split: Build Work for Two Members
**Vidya Nestham (విద్యా నేస్తం)** · build work only. Submission, deck, video and README writing are not covered here.

Both members build in the **Codebenders IDE** and log their own key prompts in `CODEBENDERS_USAGE.md` (doc 07).

---

## 1. Who owns what
| | **Member A: Frontend, Offline & Content** | **Member B: Backend, Voice, AI & Learning Logic** |
|---|---|---|
| Owns folders | `app/` (except `app/src/engine/` and `app/src/sync/`), `content/` | `server/`, `app/src/engine/`, `app/src/sync/`, `scripts/` |
| Core job | Everything the learner sees and touches, and making it work offline | Everything that thinks, talks, or syncs |
| Deploys | Frontend (e.g., Vercel/Netlify) | Backend (e.g., Render/Railway) + database |

**Rule:** you never edit each other's folders. If you need a change there, ask. This avoids merge conflicts at 2 AM.

## 2. Agree these first (30 min together, before splitting)
These are the shared contracts. Once agreed, both can work in parallel; Member A uses **mock data** until B's endpoints are live.

### 2.1 Chapter pack format (`content/chapter-force-v1.json`)
```
chapter:        { id, title_te, order, syllabus_ref }
concepts[]:     { id, chapter_id, title_te, card_text_te, example_te, check_question_te, check_answer_te, image, audio_url, syllabus_ref }
questions[]:    { id, concept_id, type: "mcq"|"tf"|"fill", difficulty: 1|2|3, stem_te, options[], correct, explanation_te, option_misconception: { optionKey: misconception_id } }
misconceptions[]: { id, concept_id, description_te, fix_hint_te }
common_doubts[]:  { id, concept_id, question_te, answer_te, audio_url }
version:        "1"
```

### 2.2 API contract (B builds, A calls)
| Endpoint | Request | Response |
|---|---|---|
| `POST /api/stt` | audio file (multipart, Opus/webm, ≤ 15 s) | `{ text_te }` |
| `POST /api/tts` | `{ text_te }` | audio file (small, cacheable) |
| `POST /api/tutor` | `{ question_te, class, chapter_id, concept_hint? }` | `{ answer_te, concept_id, check_question_te, out_of_syllabus }` |
| `POST /api/photo` | image (≤ 150 KB, compressed on device) | `{ question_te }` |
| `POST /api/sync` | `{ device_id, records: [ { uuid, type: "attempt"\|"doubt", learner_id, payload, created_at } ] }` | `{ acked: [uuid] }` |
| `GET /api/teacher/summary` | none | `{ class_size, weakest_concepts: [{ concept_id, avg_mastery }], learners_needing_help: [{ nickname, weak_concepts }] }` |
| `GET /api/health` | none | `{ ok: true }` |

Errors everywhere: `{ error_code, message_te }` (e.g., `STT_FAILED`, `RATE_LIMITED`, `SERVER_BUSY`).

### 2.3 Engine interface (B builds, A calls from the practice screen)
```
recordAttempt(learnerState, question, chosenOption) -> { learnerState, correct, misconception_id?, feedback_te }
nextQuestion(learnerState, chapterPack)            -> { question, reason_te }
masteryByConcept(learnerState)                     -> { [concept_id]: 0..1 }
chapterStatus(learnerState, chapterPack)           -> "green" | "yellow" | "red"
```

### 2.4 Sync interface (B builds, A calls)
```
queueRecord(record)        // write to IndexedDB with synced=false
queueDoubt(audioBlob, meta) // offline voice doubt
syncNow() -> { sent, failed, lastSavedAt }
onDoubtAnswered(callback)  // fires when a queued doubt gets its answer
```

### 2.5 Local database tables (IndexedDB / Dexie): agree on names
`profiles`, `attempts`, `doubts`, `mastery`, `audioCache`, `meta` (lastSavedAt, deviceId).
A owns `profiles`; B owns `attempts`, `doubts`, `mastery`, and the sync logic over them.

## 3. Member A: Frontend, Offline & Content

| # | Task | Done when |
|---|---|---|
| A1 | **PWA skeleton**: React + Vite + TS + Tailwind, Noto Sans Telugu (self-hosted subset), routing for all screens, service worker for the app shell, online/offline badge | App opens on a phone from the deployed link and installs as a PWA |
| A2 | **Frontend deploy**, redeployed after every feature | Public URL works in incognito on a phone |
| A3 | **Profiles & PIN** (S1): avatar picker, nickname + class only, hashed 4-digit PIN, auto-return to the picker after 10 min idle, "Switch learner" | Two profiles on one phone never mix data |
| A4 | **Home screen** (S2): 🎤 Ask · 📖 Lessons · ✏️ Practice · ⭐ Progress, Data Saver toggle | All buttons route correctly; works offline |
| A5 | **Content pack entry**: convert the reviewed Force concept cards + questions + misconceptions + common doubts into the agreed JSON format; then Friction | Pack passes B's validator (B6) |
| A6 | **Lessons** (S3): chapter list → concept cards, 🔊 play pre-generated audio, "I didn't understand → Ask" shortcut, "Download chapter for offline" | Lessons + audio work in airplane mode |
| A7 | **Ask-a-doubt screen** (S4): hold-to-talk mic (MediaRecorder, ≤ 15 s, Opus, low bitrate), editable transcript, answer card, 🔊 tap-to-play, "Explain simpler / Example / Practise this" buttons, camera button | Works end to end against mocks, then against B's real API |
| A8 | **Offline doubt UX**: when offline, call `queueDoubt`, show the Telugu message, suggest the closest concept card, show the "common doubts" list (tap to see the answer + audio), and a badge when a queued answer arrives | Full flow demonstrable with airplane mode on → off |
| A9 | **Practice screen** (S5): one question at a time (MCQ shuffled / true-false / fill-in), instant Telugu feedback, shows the engine's `reason_te` | Calls B's engine; feedback matches the misconception |
| A10 | **Learner progress** (S6): stars per concept, strong / practise lists | Updates right after practice |
| A11 | **Parent view** (S7): parent PIN, per-chapter traffic lights, days studied this week, 🔊 summary | Understandable in 10 seconds |
| A12 | **Teacher view** (S8): weakest concepts + learners needing help, "Demo data" label | Shows B's summary endpoint data |
| A13 | **Settings & error states** (S9): Data Saver, text size, voice on/off, privacy note in Telugu; Telugu messages for mic denied, no network, server busy | No English error text anywhere |
| A14 | **"Load demo data" button**: seeds Lakshmi, Ravi and Chinnu profiles + a parent PIN + sample history | A fresh browser can be demo-ready in one tap |
| A15 | **Performance pass**: lazy-load images (WebP), bundle size check, Lighthouse mobile, tap targets ≥ 48 px | Lighthouse PWA ✓, performance ≥ 80 |

## 4. Member B: Backend, Voice, AI & Learning Logic

| # | Task | Done when |
|---|---|---|
| B1 | **Backend skeleton**: Node + Express, `/api/health`, env-var config, CORS locked to the frontend URL, `.env.example`, `.gitignore` | Health check works on the deployed URL |
| B2 | **Backend deploy + database** (Supabase / Firebase / SQLite) | Deployed URL shared with A on day 1 |
| B3 | **Gnani speech-to-text** `/api/stt` (Telugu): accept Opus/webm, convert if Gnani needs another format, return `text_te` | A spoken Telugu question returns correct text |
| B4 | **Gnani text-to-speech** `/api/tts` (Telugu): low-bitrate audio, server-side cache by text hash | Same text never hits Gnani twice |
| B5 | **AI tutor** `/api/tutor`: pick the 2 most relevant concept cards as context, tutor rules (simple Telugu, ≤ 120 words, village example, check question, stay on syllabus, refuse unsafe topics, never ask for personal info), JSON output, answer cache for repeat questions | 10 test doubts give correct, short Telugu answers |
| B6 | **Content validator** (script): checks the chapter pack schema; every question has a concept; every wrong MCQ option has a misconception; no empty Telugu strings | Fails loudly on a bad pack; A runs it before every content commit |
| B7 | **Audio pre-generation script** (run once, not at runtime): Gnani TTS for every concept card, common doubt and fixed parent-summary phrase → static files → fills `audio_url` | Lesson + common-doubt audio play offline in A's screens |
| B8 | **Adaptive engine** (`app/src/engine/`, pure TypeScript) + **unit tests**: mastery update, misconception logging, next-question choice, difficulty steps, no repeats in the last 10, Telugu `reason_te` | All tests pass; wrong answers lead to targeted easier questions |
| B9 | **Sync module** (`app/src/sync/`): IndexedDB queue, batch upload on `online` / app open, idempotent by uuid, retry on failure, `lastSavedAt` | Practice offline → reconnect → server has every record exactly once |
| B10 | **`/api/sync` server side**: upsert by uuid, store attempts and doubts, return acked ids | Sending the same batch twice creates no duplicates |
| B11 | **Queued voice doubts**: on sync, upload queued recordings → STT → tutor → store answer → trigger `onDoubtAnswered` | Doubt asked in airplane mode gets answered after reconnecting |
| B12 | **Photo doubt** `/api/photo`: vision model extracts the question from a textbook photo → hands it to the tutor | A printed question photo gets answered |
| B13 | **Teacher summary** `/api/teacher/summary`: aggregates for a generated sample class of 30 synthetic learners | A's teacher view shows realistic numbers |
| B14 | **Hardening**: rate limits per device (protect Gnani/AI credits), input filter that strips phone numbers etc., no keys in the browser bundle, audio not stored after transcription, Telugu error codes | Network tab and bundle show no secrets; spam requests get `RATE_LIMITED` |
| B15 | **Measure data use**: bytes per voice doubt, per chapter pack, per 10-min session | Numbers recorded for the README's "Measured" column |

## 5. Timeline (both members in parallel)
| Block (IST) | Member A | Member B | Sync point ✋ |
|---|---|---|---|
| **Sat, first 30 min** | Agree contracts (§2) together | | ✋ Contracts frozen |
| **Sat → 3:30 PM** | A1, A2, A3, A4 | B1, B2, B6 (validator), start B8 (engine + tests) | ✋ Both deployed URLs shared |
| **Sat 3:30 → 8 PM** | A5 (Force pack), A6 (lessons) | B3, B4 (Gnani STT/TTS), B8 finished | ✋ A's pack passes B's validator |
| **Sat 8 PM → 1 AM** | A7 (ask screen against mocks → real API), A9 (practice screen) | B5 (tutor), B7 (pre-generate audio for the Force pack) | ✋ **Voice doubt works end to end on a real phone** |
| **Sleep** | at least 5 hours each | | |
| **Sun 7 → 11 AM** | A8 (offline doubt UX), A10 (learner progress) | B9, B10, B11 (sync + queued doubts) | ✋ **Airplane-mode test passes** (lessons, audio, practice, queued doubt answered after reconnect) |
| **Sun 11 AM → 2 PM** | A11 (parent), A12 (teacher), A5 (Friction pack) | B12 (photo), B13 (teacher summary), B7 again for Friction | ✋ All screens wired to real data |
| **Sun 2 → 5 PM** | A13, A14, A15 | B14, B15 | ✋ **Feature freeze at 5 PM**: only bug fixes after this |
| **Sun 5 PM →** | Joint bug-bash on real low-end phones using the acceptance tests in doc 08 | | Then hand over to submission work |

## 6. If one member falls behind
| Behind | The other member takes | Drop first (from the build plan cut list) |
|---|---|---|
| A (frontend) | B builds A12 teacher view (simple table) and A14 demo-data button | Teacher view → static mockup; Friction chapter |
| B (backend) | A wires the common-doubts list as the voice fallback; A builds the parent summary from text only | Photo doubt (B12); teacher endpoint (B13) |

**Never drop:** Telugu end to end, voice doubt (B3–B5 + A7), adaptive practice (B8 + A9), offline lessons and progress (A6, B9), at least one progress view, deployed links.

## 7. Working rules
- **Branches:** `a/<feature>` and `b/<feature>`, merged into `main` often (at least every 2 hours). `main` must always deploy.
- **Commits:** small, clear messages, under your own name (e.g., `feat(practice): show engine reason in Telugu`).
- **Mocks first:** A never waits for B. Put fake responses in `app/src/mocks/` matching §2.2, and switch to the real API with one config flag.
- **Contract changes:** if anything in §2 must change, tell the other member first, then update this doc.
- **Secrets:** only B holds the Gnani and AI keys, only on the backend. Never paste keys in chat, code, or commits.
- **Check-ins:** a 5-minute call at every ✋ sync point. Say what's done, what's blocked, and what's next.
- **Codebenders log:** each member logs their own prompts and iterations right after each task. Note who did what in `CODEBENDERS_USAGE.md`, because judges may ask either of you to demo your process.
