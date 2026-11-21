# 02 — Product Specification
**Chaduvu Nestham (చదువు నేస్తం)** — a Telugu-first, voice-first, offline-friendly AI Science tutor for Class 8.

---

## 1. Mandatory requirements → our feature (show this table in the pitch)
| Problem statement "Must Include" | Our feature | Priority |
|---|---|---|
| One regional language end to end: interface, explanations, practice — not just translated English | All UI, lessons, quiz, tutor replies, voice, and parent view in Telugu. Content written natively in Telugu with everyday village examples (bullock cart, borewell, cricket in the field) | P0 |
| One subject from the real state-board syllabus | Telangana SCERT Class 8 Science — 1 chapter complete (2nd if time) mapped to the official chapter/learning outcomes | P0 |
| AI tutor: explains simply, answers doubts, adapts practice to mistakes | **Doubt Tutor** (voice/text/photo → Telugu answer + read-aloud) and **Adaptive Practice** (concept mastery + misconception-based next question) | P0 |
| Light on data, saves progress when connection drops | Offline-first PWA, cached lesson packs, local progress store with background sync, "Data Saver" mode | P0 |
| Voice or photo input | Voice via Gnani STT (Telugu), answer read aloud via Gnani TTS; photo of a textbook question / notebook | P0 voice, P1 photo |
| Progress view for learner and for parent/teacher/volunteer | Learner: stars + concept map. Parent: traffic-light + voice summary. Teacher: weak concepts across sample class | P0 learner+parent, P1 teacher |

## 2. Screens (all Telugu)
| # | Screen | Purpose |
|---|---|---|
| S1 | **Who is studying?** (ఎవరు చదువుతున్నారు?) | Profile picker (avatars), 4-digit PIN, "Add learner" (nickname + class only) |
| S2 | **Home** | Big buttons: 🎤 Ask a doubt · 📖 Lessons · ✏️ Practice · ⭐ My progress. Offline/online badge, data-saver toggle |
| S3 | **Lesson** | Chapter → short concept cards (≤120 words each, 1 low-res diagram), "Listen" button, "I didn't understand → Ask" shortcut |
| S4 | **Ask a doubt (tutor)** | Hold-to-talk mic button; text box; camera button. Shows the transcribed question (editable), then answer in simple Telugu + "Listen" + "Explain more simply" + "Give me an example" + "Ask a practice question on this" |
| S5 | **Practice** | 1 question at a time (MCQ / true-false / fill-in), instant feedback in Telugu explaining *why*, hints. Next question chosen adaptively |
| S6 | **My progress** (learner) | Stars per concept, streak, "Your strong topics / topics to practise" |
| S7 | **Parent view** | PIN-protected (or separate parent PIN). Per-chapter traffic light, days studied this week, 🔊 "Listen to summary" in Telugu |
| S8 | **Teacher/volunteer view** | Sample class of 30 learners: weakest concepts, students needing help (sample data only) |
| S9 | **Settings** | Data saver, download chapter for offline, voice on/off, text size, about & privacy (Telugu) |

## 3. Core user flows

### Flow A — Ask a doubt by voice (demo hero flow)
1. Home → tap 🎤 → hold and speak: *"ఘర్షణ ఎందుకు బలం అవుతుంది?"*
2. Audio (compressed, ≤15 s) → backend → Gnani STT (Telugu) → text shown, editable.
3. Backend sends question + learner's class/chapter context + guardrail prompt → LLM → simple Telugu answer (≤120 words, 1 everyday example, 1 check question).
4. Answer appears as text; "🔊 Listen" → Gnani TTS → audio cached on device.
5. Buttons: "Explain more simply" / "Give an example" / "Practise this" → Flow C on the same concept.
6. **Offline fallback:** if no network, the doubt is saved to an "Ask when online" queue and the app suggests the closest offline concept card.

### Flow B — Learn a lesson offline
1. Lessons → Chapter → concept card sequence. All text + small images pre-cached.
2. Optional pre-generated Telugu audio per card (downloaded only on Wi-Fi or with user consent in data-saver mode).

### Flow C — Adaptive practice
1. Start practice → engine picks the concept with **lowest mastery** that has been seen in a lesson.
2. Wrong answer → feedback explains the specific **misconception** tied to the chosen wrong option → next question targets the same concept at easier difficulty.
3. Right answer ×2 at a level → difficulty steps up. Mastery ≥ 0.8 → concept gets ⭐⭐⭐ and engine moves on.
4. Works fully offline (question bank cached); results queued for sync.

### Flow D — Shared phone
1. App opens on "Who is studying?" every time (or after 10 min idle).
2. Each profile has its own progress store; PIN prevents siblings changing each other's progress.
3. "Switch learner" always visible on Home.

### Flow E — Parent check (10 seconds)
1. Parent taps 👨‍👩‍👧 icon → parent PIN → sees child cards: 🟢 Force · 🟡 Friction · 🔴 Sound, "studied 4 of 7 days".
2. 🔊 Listen → Telugu voice: *"లక్ష్మి ఈ వారం 4 రోజులు చదివింది. బలం పాఠం బాగా అర్థమైంది. ఘర్షణ మీద ఇంకా సాధన అవసరం."* (have a native speaker check wording)

### Flow F — Photo doubt (P1)
1. Camera → photo of a textbook question / notebook → compressed to ≤150 KB on device → backend → vision-capable model extracts question → Flow A step 3.

## 4. Adaptive engine (simple, explainable — judges love explainable)
- Every question is tagged: `chapter`, `concept_id`, `difficulty (1–3)`, and each **wrong option** is tagged with a `misconception_id`.
- Per learner per concept: `mastery` ∈ [0,1], starts 0.3.
  - Correct: `mastery += 0.15 × (1 − mastery)` (bigger gain at higher difficulty)
  - Wrong: `mastery −= 0.2 × mastery`, log misconception
- Next question: concept with lowest mastery among unlocked concepts; difficulty = 1 if mastery < 0.4, 2 if < 0.7, else 3; prefer questions targeting the learner's most frequent misconception.
- Tutor doubts also feed the engine: asking about a concept marks it "needs practice".
- Show the rule in the UI ("You got 2 friction questions wrong, so here's an easier one") — transparency is a build-quality point.

## 5. AI tutor behaviour (system prompt requirements)
- Always reply in simple Telugu (Class 6 reading level), short sentences, ≤120 words unless "explain more" is asked.
- Use one everyday rural/Telangana example. English science terms only in brackets after the Telugu term, e.g. ఘర్షణ (friction).
- Stay within Class 8 Science; for out-of-syllabus questions, answer briefly and say it's beyond the syllabus.
- End with one quick check question.
- Never ask for personal information. Refuse unsafe/inappropriate topics kindly and redirect to studies.
- Ground answers in our own concept cards (send the relevant card text as context) to reduce hallucination.

## 6. Data-light design budget
| Item | Budget |
|---|---|
| First load (app shell) | < 1.5 MB gzipped |
| One chapter pack (text + images + questions) | < 400 KB |
| Doubt round-trip (audio up + text down) | < 150 KB |
| TTS answer audio | < 100 KB (low bitrate), cached |
| Images | WebP, ≤ 40 KB each, lazy-loaded |
| Data Saver mode | Disables auto-audio, images load on tap |

## 7. Out of scope (say this explicitly — shows focus)
Video lessons · other subjects/classes · login with phone/OTP · real student data · payments · native Android app (PWA instead).

## 8. Guardrails checklist (in-product)
- [ ] No personal data beyond nickname, class, avatar, PIN (hashed, stored locally)
- [ ] Privacy note in Telugu on first launch, written for parents
- [ ] Sample profiles only in demo; "Demo data" label on teacher view
- [ ] Original content with sources/attribution page; no textbook copy
- [ ] Tutor safety prompt + basic input/output filter
- [ ] API keys only on the server, never in the browser
