# 07 — Use of Codebenders (prompt bank + usage log)
> Judging criterion: **Build Quality & Use of Codebenders — 15%**. Rules require: *"Include Codebenders usage details, key prompts, and iterations"* and *"be ready to demonstrate your Codebenders usage and development process."*
> Copy the **log template** (§3) into your repo as `CODEBENDERS_USAGE.md` and fill it in **as you build**. Rebuilding it from memory at 10 PM on Sunday never works.

---

## 1. What judges want to see
- That the app was **built in Codebenders**, from scratch, during the window
- **Good prompting**: clear specs, iteration, fixing what the AI got wrong
- **Your judgement**: where you rejected or corrected AI output (Telugu wording, science facts, security)
- Screenshots / short screen recordings of the IDE at key moments

## 2. Prompt bank (adapt and paste into the Codebenders IDE)
> These are starting prompts. Refer to the spec docs so the IDE has full context. If Codebenders lets you attach files/context, add `02-product-spec.md` and `03-architecture.md`.

**P1 — Skeleton**
> Create a mobile-first PWA called "Vidya Nestham" using React + Vite + TypeScript + Tailwind. All UI text is in Telugu (use Noto Sans Telugu, self-hosted). Screens: profile picker, home, lessons, lesson detail, ask-a-doubt, practice, learner progress, parent view, teacher view, settings. Add a service worker that precaches the app shell. Add an online/offline indicator. Keep the initial bundle under 1.5 MB. Also create a Node/Express backend folder `server/` with a health endpoint, CORS limited to the frontend origin, and env-var based config.

**P2 — Profiles on a shared phone**
> Implement local learner profiles stored in IndexedDB (Dexie): nickname, avatar, class, hashed 4-digit PIN. Each profile's attempts, mastery and doubts are stored separately. The app opens on the profile picker and returns to it after 10 minutes idle. Collect no other personal data.

**P3 — Content pack**
> Define a versioned JSON schema for a chapter pack: chapter, concepts (title_te, card_text_te, example_te, image, audio_url, syllabus_ref), questions (concept_id, type, difficulty 1–3, stem_te, options, correct, explanation_te, option_misconception map) and misconceptions (description_te, fix_hint_te). Add a build-time validator that fails if any question lacks a concept or any wrong option lacks a misconception. Precache chapter packs for offline use.

**P4 — Voice (Gnani STT/TTS): online-enhanced, data-light**
> Gnani runs in the cloud, so live voice needs internet. Design voice as an online-enhanced feature that degrades gracefully offline.
> Add `/api/stt` and `/api/tts` endpoints to the backend that call the Gnani API for Telugu (credentials from env vars only; follow the request format in Gnani's docs: <paste the relevant part of their docs>).
> Frontend: a hold-to-talk button using MediaRecorder, max 15 s, mono Opus at a low bitrate (target ≤ 40 KB per clip). Show the transcript in an editable box.
> Return the tutor answer as text first. Fetch the TTS audio only when the learner taps 🔊, then cache it by a hash of the text so repeat answers cost no data.
> When offline, don't fail: save the recording to IndexedDB in a "doubts to send" queue, show a Telugu message that it will be answered when the network returns, and suggest the closest offline concept card.
> Handle these errors in Telugu: mic permission denied (fall back to the text box), STT failure ("మళ్ళీ చెప్పండి", please say again), server busy.
> In Data Saver mode, audio never auto-plays.

**P4b — Offline voice content (pre-generated audio + common doubts)**
> Add a build script (run once, not at runtime) that calls Gnani TTS for every concept card and saves the audio as small static files referenced by `audio_url` in the chapter pack. The service worker caches them with the chapter, so lessons can be *listened to* offline.
> Add a "common doubts" list per chapter: 10–20 frequent questions with reviewed Telugu answers and pre-generated audio, bundled in the chapter pack. Offline, the learner taps a common doubt instead of speaking and gets the answer and audio instantly.
> Pre-generate the fixed phrases of the parent voice summary too, so the parent view can speak offline.

**P5 — Tutor**
> Add `/api/tutor`. Input: Telugu question, learner class, current chapter id. Find the 2 most relevant concept cards from the chapter pack and include them as context. System rules: reply in simple Telugu (Class 6 reading level), ≤120 words, one everyday Telangana village example, English term in brackets after the Telugu term, end with one check question, stay within Class 8 Science, never ask for personal information, politely refuse unsafe topics. Return JSON {answer_te, concept_id, check_question_te, out_of_syllabus}. Add per-device rate limiting.

**P6 — Adaptive engine**
> Implement an adaptive practice engine as pure TypeScript functions with unit tests. Mastery per concept starts at 0.3; correct: m += 0.15*(1-m) scaled by difficulty; wrong: m -= 0.2*m and log the misconception of the chosen option. Next question: the lowest-mastery unlocked concept; difficulty 1 if m<0.4, 2 if m<0.7, else 3; prefer questions targeting the learner's most frequent misconception; avoid repeats in the last 10. Show the reason for the choice in Telugu on the practice screen.

**P7 — Offline sync**
> Implement an append-only sync queue: every attempt and doubt is written to IndexedDB with a uuid and synced=false. On the online event or app open, POST batches to `/api/sync`; the server upserts by uuid (idempotent) and returns acked ids. Show "last saved" time. Recompute mastery from attempts.
> Also flush the queued voice doubts from P4: upload each recording, run STT → tutor, store the answer locally, mark it answered, and show a badge "మీ జవాబు సిద్ధంగా ఉంది" (your answer is ready). Retry safely if the connection drops halfway.

**P8 — Progress views**
> Learner progress: stars per concept and a list of "strong" and "practise" topics. Parent view (separate PIN): per-chapter traffic light (green ≥0.8, yellow ≥0.5, red <0.5), days studied this week, and a "Listen" button that reads a Telugu summary (built from the pre-generated phrases in P4b, so it works offline; use live TTS only when online and the phrases don't cover the sentence). Teacher view: sample class of 30 synthetic learners showing the weakest concepts and learners needing help, clearly labelled as demo data.

**P9 — Hardening**
> Review the codebase for: API keys exposed to the client, missing error states, accessibility (large tap targets ≥48px, contrast), bundle size, and any personal data being collected. Fix the issues and list what you changed.

## 3. Usage log template (`CODEBENDERS_USAGE.md`)
```markdown
# How we built Vidya Nestham with Codebenders

## Summary
- Total build time: __ h · Prompts used: __ · Major iterations: __
- Everything was built in the Codebenders IDE between 21 Nov 12:00 PM and 22 Nov 11:59 PM IST.

## Build timeline
| # | Time (IST) | Feature | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot |
|---|---|---|---|---|---|---|
| 1 | Sat 12:10 | Skeleton | "Create a mobile-first PWA..." | Scaffold + routes + SW | Fixed Telugu font loading, reduced bundle | img/01.png |
| 2 | ... | | | | | |

## Iterations that mattered
### Iteration: Tutor answers were too long / too formal
- Prompt v1: ...
- Problem: answers were 300+ words in bookish Telugu
- Prompt v2: added reading-level + 120-word limit + village example rule
- Result: ... (before/after screenshot)

## Key design decisions
### Offline-first, online-enhanced voice
- **Constraint:** the problem statement asks for a product that is light on data, saves progress when the connection drops, and accepts voice input. Gnani speech runs in the cloud and needs internet.
- **Options considered:** (a) on-device speech models: tens to hundreds of MB to download, weak Telugu support, slow on low-end phones; (b) cloud voice with offline fallbacks.
- **Decision:** (b).
  - Lessons, practice, progress and profiles work fully offline.
  - Lesson audio and common-doubt answers are pre-generated and cached, so learners can listen offline.
  - New voice doubts are queued offline and answered once the phone is back online.
  - Live voice uses compressed clips of ≤ 40 KB, with audio fetched only on tap.
- **Evidence:** airplane-mode demo (lessons + audio + practice work; voice doubt queued → answered after reconnecting). Measured data per voice doubt: ___ KB.

## Where human judgement corrected AI output
- Telugu wording reviewed by: ___ (e.g., changed __ to __)
- Science facts checked against the SCERT syllabus: ___
- Security: moved keys server-side / added rate limiting

## Codebenders features we used
- (e.g., code generation, debugging, refactoring, test generation, deploy — list what the IDE actually offers)
```

## 4. Capture evidence as you go
- Screenshot the IDE after each major prompt (save to `docs/img/`).
- Record 2–3 short clips (30 s) of Codebenders generating/fixing something — great for the demo video.
- Commit after each prompt cycle with a message referencing the log entry (e.g., `feat(voice): Gnani STT proxy [log #4]`).
