# చదువు నేస్తం · Chaduvu Nestham

**A Telugu study buddy that works on a shared phone with poor data.**
A voice-first, offline-friendly AI Science tutor for Class 8 students in Telugu-medium government schools (Telangana State Board).

> 🏆 Built for the **ACE Builders Hackathon 2026** by Codebenders
> 📌 **Problem Statement 3: The Last-Mile Tutor** (Education)

| | |
|---|---|
| 🔗 **Live app** | <!-- TODO --> `https://...` |
| 🎥 **Demo video (3 min)** | <!-- TODO --> `https://...` |
| 📊 **Pitch deck** | <!-- TODO --> `https://...` |
| 🛠️ **How we built it** | [CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) |

**Try it in 30 seconds:**
1. Open the live app on a phone.
2. Tap **"డెమో డేటా లోడ్ చేయండి"** (Load demo data).
3. Pick the learner **లక్ష్మి**. The demo PIN is shown on screen.
4. Tap 🎤 and ask a Science doubt in Telugu.

---

## 📖 The problem

Lakshmi is 13. She studies in Class 8 at a Zilla Parishad High School in a Telangana village, in Telugu medium. One Science teacher covers Classes 6–10, so lessons are rushed. In the evening she studies on her **father's phone, which the whole family shares**, on a data pack that runs out by night. Nobody at home can explain Science to her.

Most digital learning is built for a different student: someone who **studies in English, has a personal smartphone, has steady data, and has a parent who can help**. YouTube videos use hundreds of MB. Chatbots expect typed English. Tuition costs ₹300–800 a month, if there's any in the village at all.

**The students who need help the most are the ones ed-tech reaches the least.**

<!-- TODO: add 2–3 cited statistics (UDISE+, ASER, NAS) and 1–2 anonymised quotes from your user calls -->

## 💡 Our solution

Chaduvu Nestham is a **Telugu-first tutor in the phone's browser**, designed around the conditions Lakshmi actually studies in:

| | Feature | What it does |
|---|---|---|
| 🎤 | **Ask doubts by voice, in Telugu** | Hold the mic and speak the doubt. You get a simple Telugu answer with an example from village life, read aloud. No typing needed. |
| 🧠 | **Adaptive practice** | Every wrong answer is linked to a specific misconception. The next question targets that exact gap, and the app explains *why* it chose it. |
| 📶 | **Works offline** | Lessons and practice work in airplane mode. Progress is saved on the phone and syncs when the network returns. |
| 👨‍👩‍👧 | **Built for shared phones** | Each family member gets their own profile with an avatar and a 4-digit PIN, so progress never mixes. |
| 📷 | **Photo doubts** | Take a photo of a textbook question and get it explained. <!-- remove if not shipped --> |
| 🔊 | **A parent view you can *listen* to** | Each chapter gets a green, yellow or red status, plus a spoken Telugu summary for parents who can't read dashboards. |
| 🧑‍🏫 | **Teacher/volunteer view** | Shows which concepts the class is stuck on (demo data). |

### Problem statement requirements → our features
| Required by Problem Statement 3 | How Chaduvu Nestham meets it |
|---|---|
| One regional language end to end, not just translated English | Telugu throughout: interface, lessons, practice, tutor answers, voice and parent view. Content is written natively in Telugu with local examples. |
| One subject from the real state-board syllabus | Telangana SCERT **Class 8 Physical Science**: Ch 1 *Force (బలం)* and Ch 2 *Friction (ఘర్షణ)*, mapped to the official chapter list |
| AI tutor that explains simply, answers doubts, adapts to mistakes | Voice/text/photo doubt tutor plus a misconception-based adaptive practice engine |
| Light on data, saves progress when the connection drops | Offline-first PWA, cached chapter packs, local progress store with idempotent background sync, Data Saver mode |
| Voice or photo input | Telugu speech-to-text and text-to-speech (Gnani), plus photo questions |
| Progress view for learner and parent/teacher/volunteer | Learner stars and concept map, parent traffic lights with voice summary, teacher weak-concept view |

## 📸 Screenshots
<!-- TODO: 5–6 phone screenshots in a row: profile picker · home · voice doubt · practice feedback · offline mode · parent view -->
| Profile picker | Voice doubt | Adaptive practice | Offline | Parent view |
|---|---|---|---|---|
| `docs/img/s1.png` | `docs/img/s4.png` | `docs/img/s5.png` | `docs/img/offline.png` | `docs/img/s7.png` |

## 🏗️ How it works

```
 ┌──────────── Learner's shared phone (PWA) ─────────────┐
 │  Telugu UI · Profiles (PIN) · Lessons · Practice      │
 │  Adaptive engine (runs on device)                     │
 │  IndexedDB per profile + sync queue                   │
 │  Service worker: app shell, chapter packs, audio      │
 └──────────────┬────────────────────────────────────────┘
                │ HTTPS, only when online
       ┌────────▼────────┐
       │   Backend API   │── /api/stt ─────► Gnani speech-to-text (Telugu)
       │ (keys live here)│── /api/tts ─────► Gnani text-to-speech (Telugu)
       │  rate-limited   │── /api/tutor ───► AI model + our concept cards as context
       │                 │── /api/photo ───► Vision model
       │                 │── /api/sync ────► Database (attempts, doubts)
       └─────────────────┘── /api/teacher ─► Class aggregates
```

**Voice doubt flow:**
1. The learner holds the mic button (up to 15 s, compressed audio).
2. Gnani speech-to-text turns it into Telugu text, which the learner can edit.
3. The tutor answers using the matching concept cards as context.
4. The answer comes back in simple Telugu, at most 120 words, with one local example and a check question.
5. Gnani text-to-speech reads it aloud, and the audio is cached on the device.

**Adaptive engine:**
- Every question is tagged with a concept and a difficulty level, and every wrong option is tagged with a misconception.
- The app keeps a mastery score per concept and updates it after each answer.
- The next question comes from the weakest concept, at a difficulty that fits the learner's mastery, and targets their most frequent misconception.
- The logic is pure functions with unit tests.

**Offline and sync:**
- Every attempt and doubt is written to IndexedDB first.
- Unsynced records upload in batches whenever the phone is online.
- The server upserts by record ID, so a dropped connection never creates duplicates.
- Attempts are append-only and mastery is recomputed from them, so there are no sync conflicts.

### Tech stack
<!-- TODO: update to what you actually used -->
| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript, PWA (service worker), Tailwind CSS, Noto Sans Telugu |
| Offline storage | IndexedDB (Dexie) |
| Backend | Node.js + Express |
| Database | <!-- Supabase / Firebase / SQLite --> |
| Voice | Gnani (Telugu speech-to-text and text-to-speech) |
| AI tutor | <!-- model/provider used --> |
| Hosting | <!-- e.g., Vercel + Render --> |
| Built with | **Codebenders IDE** |

## 📶 Designed for low data

| | Budget | Measured |
|---|---|---|
| First load (app shell) | < 1.5 MB | <!-- TODO --> |
| One chapter pack (text, images, questions) | < 400 KB | <!-- TODO --> |
| One voice doubt round-trip | < 150 KB | <!-- TODO --> |
| 10-minute study session (text mode) | < 5 MB | <!-- TODO --> |
| Lighthouse (mobile) | PWA ✓, Performance ≥ 80 | <!-- TODO: screenshot --> |

How we keep it light:
- Lesson audio is generated once and served as static files.
- Repeat doubts are answered from a cache.
- Images are compressed to WebP and load lazily.
- Data Saver mode turns off auto-audio and loads images only on tap.

## 🛡️ Guardrails & privacy

The learners are children, so the app is built to protect them:

- **Minimal data:** we store only a nickname, class, avatar and a hashed PIN. No phone number, school ID, Aadhaar or face photos.
- **Synthetic data only:** all demo learners and the teacher's class are sample profiles.
- **Safe tutor:** it stays within Class 8 Science, never asks for personal information, and politely redirects off-topic or unsafe questions in Telugu.
- **Original content:** all explanations and questions are written for this project, aligned to the syllabus chapters and not copied from textbooks. See [content/SOURCES.md](content/SOURCES.md).
- **Secrets stay on the server:** API keys live only in backend environment variables and are never sent to the browser or committed.
- **No audio retention:** voice recordings are used for transcription and not stored on the server.

## 💰 Business model

**Free for students. Paid by those who fund learning outcomes.**

| Who pays | Why | Price |
|---|---|---|
| CSR programmes | They need measurable, reportable education impact | <!-- ₹___ --> per student per year |
| Education NGOs | Their volunteers can't reach every child every evening | <!-- ₹___ --> per student per year |
| State education programmes (later) | Learning outcomes in government schools, plus the regional-language mandate | District/state licence |

- **Low cost to run:**
  - Lessons and practice run on the device.
  - Lesson audio is generated once.
  - Popular doubts are cached.

  Estimated running cost: <!-- ₹___ --> per student per month.
- **Go-to-market:**
  1. A free 8-week NGO pilot.
  2. CSR-funded district cohorts.
  3. State programme partnerships.
- **What payers get:** concept-level mastery gains, active learners, top confusing concepts, and data used per session.

<!-- TODO: link to the full business doc or deck -->

## 🛠️ Built with Codebenders

The whole application was built in the **Codebenders IDE** during the hackathon build window (21 Nov 12:00 PM to 22 Nov 11:59 PM IST).
[CODEBENDERS_USAGE.md](CODEBENDERS_USAGE.md) documents the build timeline, key prompts, the iterations that mattered, and where human review corrected the output (Telugu wording, science accuracy, security).

## 🚀 Run locally

**Requirements:** Node.js 18+, a Gnani API key, and an API key for the AI tutor model.

```bash
git clone https://github.com/<your-username>/chaduvu-nestham.git
cd chaduvu-nestham

# backend
cd server
cp .env.example .env      # fill in your own keys
npm install
npm run dev

# frontend (new terminal)
cd app
npm install
npm run dev
```

**Environment variables** (`server/.env`; see `.env.example`):
| Variable | Purpose |
|---|---|
| `GNANI_API_KEY` | Gnani speech-to-text / text-to-speech <!-- adjust to Gnani's actual auth fields --> |
| `AI_API_KEY` | AI tutor model |
| `DATABASE_URL` | Progress sync database |
| `ALLOWED_ORIGIN` | Frontend URL for CORS |

> Never commit `.env`. It's listed in `.gitignore`.

**Tests:**
```bash
cd app && npm test     # adaptive engine, sync queue, content validator
```

## 📁 Project structure
```
chaduvu-nestham/
├── app/                 # PWA frontend (Telugu UI, offline, adaptive engine)
├── server/              # API: voice proxy, tutor, sync, teacher aggregates
├── content/             # Chapter packs (concept cards, questions, misconceptions) + SOURCES.md
├── docs/                # Problem research, product spec, architecture, business model
├── CODEBENDERS_USAGE.md # How we built it with Codebenders
└── README.md
```

## 🗺️ Roadmap
- [x] Class 8 Physical Science: Force & Friction (Telugu)
- [ ] All Class 8 Science chapters (Physical + Biological Science)
- [ ] Classes 6–10, Science and Maths
- [ ] More languages: Kannada, Tamil, Marathi…
- [ ] SMS / IVR mode for feature phones
- [ ] NGO pilot with 100–300 learners

## 👥 Team
<!-- TODO -->
| Name | Role | Links |
|---|---|---|
| | | |

## 🙏 Acknowledgements
- **Codebenders**, for the ACE Builders Hackathon and the IDE
- **Gnani**, for Telugu speech technology
- **SCERT Telangana**, for the syllabus the content is aligned to
- <!-- the native Telugu reviewer / teacher who checked the content -->

## 📄 License
<!-- TODO: choose a license (e.g., MIT) after checking the hackathon's ownership/licensing terms -->
