# 03 — Technical Architecture
> Judging criterion: **Build Quality & Use of Codebenders — 15%** (and **Working Product — 30%**).
> Everything here must be built *inside the Codebenders IDE*, from scratch, during the build window. This doc is the plan, not code.

---

## 1. Recommended stack (simple, deployable in 36 h)
| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript, as a **PWA** | Fast, small bundle, installable from browser, no Play Store download |
| Offline | Service worker (Workbox / vite-plugin-pwa) + **IndexedDB** (Dexie) | Cache app shell + chapter packs; store progress locally |
| Styling | Tailwind CSS, Noto Sans Telugu font (subset, self-hosted) | Readable Telugu, small font file |
| Backend | Node.js (Express or serverless functions) | Holds API keys; proxies Gnani + LLM; sync endpoint |
| Database | Supabase (Postgres) or Firebase — or SQLite on Render if simpler | Synced progress, teacher view aggregates |
| Voice | **Gnani** STT (Telugu) + TTS (Telugu) | Indian-language voice; you have credits |
| LLM | Whatever is permitted by organisers (confirm!) | Tutor answers, photo-question extraction |
| Hosting | Vercel/Netlify (frontend) + Render/Railway/Vercel functions (backend) | Free tiers, public URL quickly |

> If Codebenders IDE has its own preferred stack / deploy target, **use that instead** — it scores better on "Use of Codebenders".

## 2. System diagram
```
 ┌─────────────── Learner's shared phone (PWA) ───────────────┐
 │  UI (Telugu)  →  Profile store ─┐                           │
 │  Lessons / Practice (offline)   ├─ IndexedDB (per profile)  │
 │  Adaptive engine (runs locally) ┘   + sync queue            │
 │  Service worker: app shell + chapter packs + TTS audio      │
 └───────────────┬─────────────────────────────────────────────┘
                 │ HTTPS (only when online)
        ┌────────▼─────────┐
        │  Backend API      │── /api/stt ───► Gnani STT (te-IN)
        │  (keys live here) │── /api/tts ───► Gnani TTS (te-IN)
        │  rate limiting    │── /api/tutor ─► LLM (+ concept-card context, guardrails)
        │                   │── /api/photo ─► Vision model
        │                   │── /api/sync ──► Database (progress, attempts)
        └───────────────────┘── /api/teacher ► aggregates (sample class)
```

## 3. Data model (logical)
| Entity | Key fields | Stored where |
|---|---|---|
| `LearnerProfile` | id (uuid), nickname, avatar, class, pin_hash, created_at | Device; synced (no PII) |
| `Chapter` | id, title_te, order, syllabus_ref | Bundled JSON pack |
| `Concept` | id, chapter_id, title_te, card_text_te, image, audio_url | Bundled JSON pack |
| `Question` | id, concept_id, type, difficulty, stem_te, options[], correct, explanation_te, option_misconception{} | Bundled JSON pack |
| `Misconception` | id, concept_id, description_te, fix_hint_te | Bundled JSON pack |
| `Attempt` | id, learner_id, question_id, chosen, correct, time_ms, created_at, synced | Device → server |
| `Mastery` | learner_id, concept_id, value, last_seen | Device (derived), mirrored on server |
| `Doubt` | id, learner_id, input_type (voice/text/photo), text_te, answer_te, concept_id, created_at, status (queued/answered) | Device → server |
| `Guardian` | id, learner_ids[], pin_hash | Device |

Content packs are versioned JSON (`chapter-<id>-v1.json`) so content can be updated without an app release.

## 4. Offline & sync strategy
- **App shell + chapter packs:** precached by service worker on first load ("Download for offline" button per chapter).
- **Writes:** every attempt/doubt goes to IndexedDB first with `synced=false`.
- **Sync:** on `online` event or app open → POST batched unsynced records → server returns ack → mark synced. Idempotent by record uuid (safe if connection drops mid-sync).
- **Queued doubts:** voice recordings stored locally (compressed), sent when back online; learner gets a badge "Your answer is ready".
- **Conflict rule:** attempts are append-only; mastery is recomputed from attempts → no conflicts.
- Show a clear **online/offline indicator** and "last saved" time — demonstrable in the demo by toggling airplane mode.

## 5. Voice pipeline (Gnani)
1. Browser `MediaRecorder` → record ≤ 15 s, mono, low bitrate (Opus/webm, or convert to the format Gnani expects — **check Gnani's docs** for sample rate/encoding and Telugu language code).
2. Upload to `/api/stt` → backend calls Gnani STT → returns Telugu text.
3. Show transcript, editable (handles STT errors gracefully).
4. Answer text → `/api/tts` → Gnani TTS → small audio file → cached by hash of text (same answer never synthesised twice → saves credits).
5. **Pre-generate** TTS for all lesson concept cards once (build script) → served as static files → zero runtime cost.
6. Fallbacks: if STT fails → "మళ్ళీ చెప్పండి" (please say again) + text box; if TTS fails → browser `speechSynthesis` (if Telugu voice available) else text only.

## 6. Tutor pipeline (LLM)
1. Input: question text (Telugu), learner class, current chapter, top-matching concept cards (simple keyword/embedding match over our own cards).
2. System prompt = tutor rules from `02-product-spec.md §5`.
3. Output JSON: `{ answer_te, concept_id, check_question_te, out_of_syllabus: bool }` → `concept_id` updates mastery ("needs practice").
4. Cache answers for frequent questions (normalised text hash) → cheaper and works for repeat doubts offline.
5. Safety: input filter for personal data (phone numbers etc. stripped), output length cap, refusal template in Telugu.

## 7. Security & privacy
- API keys (Gnani, LLM) only in backend env vars; `.env` in `.gitignore`; **never commit keys to the public repo**.
- Rate-limit `/api/stt`, `/api/tutor` per device id (protect credits during judging).
- PINs hashed (not plain) on device. No PII collected. HTTPS only.
- Audio not stored on server after transcription (state this in privacy note).

## 8. Quality bar ("Build Quality")
- TypeScript, ESLint/Prettier, consistent folder structure (`/app`, `/server`, `/content`).
- Content packs validated against a schema at build time (every question has a concept, every wrong option has a misconception).
- Unit tests for the adaptive engine and sync queue (they're pure logic — easy to test).
- Lighthouse run on mobile profile: target PWA ✓, performance ≥ 80 — screenshot it for the submission.
- Error states designed in Telugu (no network, mic denied, STT failed, server busy).
- README with setup, env vars, architecture diagram, and how Codebenders was used.

## 9. Repository layout (suggested)
```
chaduvu-nestham/
  app/          # PWA frontend
  server/       # API (proxy for Gnani + LLM, sync)
  content/      # chapter packs (JSON) + content sources/attribution
  docs/         # these documents (copy in)
  README.md
  CODEBENDERS_USAGE.md
  LICENSE
```
