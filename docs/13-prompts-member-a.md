# 13 — Codebenders Prompts: Member A (Frontend, Offline & Content)
**Vidya Nestham (విద్యా నేస్తం)** · tasks A1–A15 from `12-team-split.md`

## How to use this file
1. Paste **one prompt at a time** into the Codebenders IDE, in order. Each prompt assumes the earlier ones are done.
2. If the IDE accepts context files, attach `02-product-spec.md`, `03-architecture.md` and `12-team-split.md` (it holds the shared contracts).
3. After each prompt:
   - run the **checks** listed under it
   - fix what's wrong with follow-up prompts
   - commit
   - add an entry to `CODEBENDERS_USAGE.md` with the prompt, the result, what you changed, and a screenshot
4. **You own:** `app/` (except `app/src/engine/` and `app/src/sync/`) and `content/`. Member B owns `server/`, `app/src/engine/`, `app/src/sync/` and `scripts/`.
5. **Never wait for B.** Until B's piece is ready, use mocks (`USE_MOCKS=true`) or the local stand-ins these prompts ask for.
6. **Telugu strings:** all user-facing text lives in `app/src/i18n/te.ts`. Have the wording reviewed by a native speaker; changing it later takes minutes.

---

## A1 · PWA skeleton
```text
Create the frontend skeleton for "Vidya Nestham" (విద్యా నేస్తం), a Telugu-first, offline-friendly
learning app for Class 8 students who use a shared, low-end Android phone with poor mobile data.
This task is ONLY the frontend skeleton. Do not build a backend, do not call any external API,
and do not add real features yet. Every screen should be a working placeholder.

TECH
- React + Vite + TypeScript (strict mode), Tailwind CSS, React Router.
- PWA with vite-plugin-pwa (Workbox): precache the app shell, offline fallback page,
  web app manifest (name "Vidya Nestham", short_name "విద్యా నేస్తం", lang "te",
  display "standalone", portrait, theme color + background color, placeholder icons 192/512).
- Self-host the Noto Sans Telugu font (e.g., @fontsource/noto-sans-telugu), Telugu + Latin
  subsets only, font-display: swap. No Google Fonts CDN.
- ESLint + Prettier configured. No UI component library (keep the bundle small).

FOLDER STRUCTURE (inside app/)
src/
  screens/       one file per screen below
  components/    shared UI (TopBar, BigButton, OnlineBadge, ScreenLayout)
  i18n/te.ts     ALL user-facing strings live here, in Telugu. No hard-coded text in components.
  config.ts      API_BASE_URL and USE_MOCKS (default true), read from Vite env vars
  mocks/         empty for now (add .gitkeep)
  engine/        leave EMPTY with .gitkeep (owned by the other team member)
  sync/          leave EMPTY with .gitkeep (owned by the other team member)
  hooks/useOnlineStatus.ts

ROUTES AND SCREENS (all text in Telugu, taken from i18n/te.ts)
/                         ProfilePicker   "ఎవరు చదువుతున్నారు?" (Who is studying?), placeholder avatars + "కొత్త విద్యార్థి" (new learner) button
/home                     Home            4 big buttons: 🎤 "సందేహం అడగండి" (Ask a doubt), 📖 "పాఠాలు" (Lessons),
                                          ✏️ "సాధన" (Practice), ⭐ "నా ప్రగతి" (My progress); a "మార్చు" (Switch learner) link
/lessons                  Lessons         placeholder chapter list: "బలం" (Force), "ఘర్షణ" (Friction)
/lessons/:chapterId       ChapterDetail   placeholder concept list
/lessons/:chapterId/:conceptId  ConceptCard  placeholder card with a 🔊 button (does nothing yet)
/ask                      AskDoubt        placeholder: big mic button, text box, camera button
/practice                 Practice        placeholder question card with 4 options
/progress                 Progress        placeholder stars per concept
/parent                   ParentView      "తల్లిదండ్రుల కోసం" (For parents), placeholder traffic-light rows
/teacher                  TeacherView     "ఉపాధ్యాయుల కోసం" (For teachers), with a visible "డెమో డేటా" (Demo data) label
/settings                 Settings        placeholder toggles: "డేటా సేవర్" (Data Saver), text size, voice on/off
*                         NotFound        Telugu message + button back to home

SHARED LAYOUT
- TopBar on every screen except ProfilePicker: back button, screen title, OnlineBadge, settings icon.
- OnlineBadge uses navigator.onLine + online/offline events:
  online  -> "ఆన్‌లైన్" (green dot)
  offline -> "ఆఫ్‌లైన్ · మీ పని ఫోన్‌లో సేవ్ అవుతుంది" (grey dot; "Offline · your work is saved on the phone")

DESIGN RULES (low-end phone, young learner)
- Mobile-first for a 360 × 640 screen; looks fine up to tablet width.
- Tap targets at least 48 × 48 px; base font size at least 18 px for Telugu text; high contrast.
- Big icon + short Telugu label on every main button (assume slow readers).
- No images over 40 KB; no animations that block on slow CPUs.

PERFORMANCE BUDGET
- Initial JS + CSS + font under 1.5 MB uncompressed total; lazy-load every screen except
  ProfilePicker and Home with React.lazy.
- After the first visit, the app must open and navigate between all screens in airplane mode.

ALSO
- npm scripts: dev, build, preview, lint.
- app/.env.example with VITE_API_BASE_URL and VITE_USE_MOCKS=true (no secrets in the frontend, ever).
- app/README.md: how to run, the folder ownership note (engine/ and sync/ belong to the other member),
  and how to test offline (build + preview, load once, then turn on airplane mode / DevTools offline).

When done, list: the files you created, the final bundle size from `npm run build`,
and anything you could not do.
```
**Checks:**
- `npm run build` and `npm run preview` work.
- Every screen opens.
- After going to airplane mode and reloading, the app still opens and you can move between screens.
- All visible text is Telugu.
- The online/offline badge switches when you toggle airplane mode.
- `engine/` and `sync/` are empty.

---

## A2 · Frontend deploy
```text
Make the Vidya Nestham frontend (app/) deployable and deploy it.

1. Add hosting config for <Vercel | Netlify> (pick the one I name here: ______):
   - SPA fallback: every unknown path serves index.html (React Router routes must work on refresh).
   - Cache headers: hashed assets (JS/CSS/fonts/images) cached for 1 year, immutable;
     index.html, manifest and the service worker file served with no-cache so updates reach users.
   - Build command and output directory for a Vite app inside the app/ folder.
2. Environment variables: VITE_API_BASE_URL and VITE_USE_MOCKS are read at build time;
   document how to set them in the hosting dashboard. No secrets in the frontend.
3. Service worker updates: when a new version is deployed, show a small Telugu banner
   "కొత్త వెర్షన్ వచ్చింది · నొక్కండి" (A new version is available · tap) that reloads the app when tapped.
   Never auto-reload while the learner is in the middle of a practice question.
4. Add a tiny "version" line (build date + short git hash) on the Settings screen so we can
   confirm which build is live.
5. Update app/README.md with the deploy steps.

When done, give me the exact steps I must click in the hosting dashboard, and a checklist to verify
the live site works offline on a phone.
```
**Checks:**
- The live URL opens in incognito on your phone.
- Refreshing on `/lessons` doesn't show a 404.
- Load the page once, switch to airplane mode, and it still opens.
- A redeploy shows the "new version" banner.
- Share the URL with Member B.

---

## A3 · Profiles & PIN (shared-phone support)
```text
Implement learner profiles for a phone shared by a family, in the Vidya Nestham frontend.

LOCAL DATABASE
- Create app/src/db/schema.ts using Dexie (IndexedDB) with the agreed tables:
  profiles, attempts, doubts, mastery, audioCache, meta.
  I own `profiles` and `meta`. The other member owns attempts, doubts, mastery and the sync logic.
  Define all tables now (so the schema version is shared), but only write code for profiles and meta.
  Every learner-owned row includes learner_id.
- meta stores: deviceId (random uuid created on first launch), dataSaver, textSize, voiceEnabled,
  activeLearnerId, lastActiveAt.

PROFILE DATA (nothing else may be collected)
- id (uuid), nickname (1–12 characters, Telugu or English letters), avatar (one of 12 emoji animals),
  class (fixed to 8 for now, with a note that only Class 8 Science is available),
  pinHash, pinSalt, createdAt.
- Max 5 profiles per device.
- PIN: exactly 4 digits. Store only a salted SHA-256 hash via the Web Crypto API, never the PIN itself.

SCREENS
- ProfilePicker (/): grid of avatar + nickname cards; tap → PIN pad (big digits, 3 × 4 layout);
  "కొత్త విద్యార్థి" (new learner) opens a 3-step flow: choose avatar → type nickname → set PIN twice.
- Wrong PIN: show "PIN తప్పు. మళ్ళీ ప్రయత్నించండి." (Wrong PIN, try again); after 3 wrong tries,
  lock that profile for 30 seconds with a visible countdown.
- Long-press a profile → "తొలగించు" (delete), which needs that profile's PIN and a confirm step.
- A one-line privacy note under the picker, in Telugu: we store only a nickname, an avatar and a PIN, on this phone.

SESSION RULES
- After a correct PIN, set activeLearnerId and go to /home.
- Every screen except ProfilePicker requires an active learner; otherwise redirect to /.
- After 10 minutes with no interaction, clear the active learner and return to the picker
  (so a sibling doesn't continue on someone else's profile).
- A "మార్చు" (switch learner) link on Home returns to the picker immediately.
- Provide a hook useActiveLearner() that returns the active profile (or null) for other screens.

Write unit tests for: PIN hashing/verification, the 3-try lock, the 10-minute idle logout, and the
5-profile limit. All user-facing text goes in i18n/te.ts.
```
**Checks:**
- Create two profiles, and confirm a wrong PIN locks after 3 tries.
- After 10 minutes idle, the app returns to the picker.
- In DevTools → Application → IndexedDB, there's no plain PIN anywhere.

---

## A4 · Home screen
```text
Build the real Home screen (/home) for Vidya Nestham.

- Greeting at the top with the active learner's avatar and nickname: "నమస్తే, {nickname}!"
- 4 big buttons (icon + Telugu label, each at least 25% of the screen width, 48 px+ tall):
  🎤 సందేహం అడగండి → /ask, 📖 పాఠాలు → /lessons, ✏️ సాధన → /practice, ⭐ నా ప్రగతి → /progress.
- A "today's suggestion" card under the buttons. For now, show the first concept of the first chapter
  ("ఈరోజు నేర్చుకుందాం: బలం అంటే ఏమిటి?"). Later it will come from the learning engine, so read it
  through a function getTodaySuggestion(learnerId) in app/src/services/suggestions.ts that I can swap.
- A small footer row: 👨‍👩‍👧 తల్లిదండ్రులు → /parent, 🧑‍🏫 ఉపాధ్యాయులు → /teacher, "మార్చు" (switch learner).
- A Data Saver quick toggle (reads/writes meta.dataSaver) with a one-line Telugu explanation:
  "డేటా సేవర్: ఆడియో ఆటోమేటిక్‌గా ప్లే కాదు, చిత్రాలు నొక్కితేనే లోడ్ అవుతాయి."
- Everything works offline. No network calls on this screen.
```
**Checks:**
- Every button goes to the right screen.
- The Data Saver toggle survives a reload.
- The screen works in airplane mode.

---

## A5 · Content pack (Force, then Friction)
```text
Create the content pipeline for Vidya Nestham.

1. TypeScript types in app/src/content/types.ts that exactly match the agreed chapter pack format:
   chapter { id, title_te, order, syllabus_ref }
   concepts[] { id, chapter_id, title_te, card_text_te, example_te, check_question_te, check_answer_te,
                image, audio_url, syllabus_ref }
   questions[] { id, concept_id, type: "mcq" | "tf" | "fill", difficulty: 1 | 2 | 3, stem_te, options[],
                 correct, explanation_te, option_misconception: { [optionKey]: misconception_id } }
   misconceptions[] { id, concept_id, description_te, fix_hint_te }
   common_doubts[] { id, concept_id, question_te, answer_te, audio_url }
   version: "1"
2. Create content/chapter-force-v1.json from the reviewed content I paste below.
   Keep every Telugu string exactly as I give it; do not rewrite or translate it.
   Use concept ids F1…F8 → force-what-is, force-contact, force-field, force-net, force-effects-motion,
   force-effects-shape, pressure-what-is, pressure-fluids, and question ids like F1-Q1.
   For true/false questions use options ["ఒప్పు", "తప్పు"]; for fill-in use options [] and put the
   accepted answers in `correct` as an array.
   Leave audio_url empty (""); another script fills it later. Use image: "" for now.
3. Common doubts: add 10 entries for the Force chapter, using the questions learners are most likely
   to ask (e.g., "బలం అంటే ఏమిటి?"). Mark each drafted answer with "review": true so I can review
   it before release; the app must hide items with review: true in production builds.
4. A loader app/src/content/loader.ts:
   - loadChapter(chapterId) fetches /content/chapter-<id>-v1.json, validates the shape at runtime
     (fail with a clear developer error, show a Telugu "content not available" message to users),
     and caches it in memory.
   - listChapters() returns the available chapters in order.
   - Serve the content folder as static files from the frontend build, and make sure the service
     worker caches packs after first use.
5. A script `npm run content:check` that runs the shared validator (owned by the other member,
   at scripts/validate-content) if it exists, and otherwise prints a reminder.

REVIEWED CONTENT (paste the cards from doc 10 and the questions from doc 11 here, after review):
<<< paste here >>>

When done, show me the count of concepts, questions per concept and difficulty, misconceptions, and
common doubts, and list any question whose wrong options are missing a misconception id.
```
**Checks:**
- `content:check` passes once B's validator exists.
- The counts match doc 11 (29 Force questions).
- No Telugu text was changed.
- Repeat this prompt for `chapter-friction-v1.json` (R1–R7) on Sunday.

> ⚠️ The pasted content comes from docs 10 and 11. Confirm with the organisers that AI-drafted content is allowed, or write the final content yourself inside Codebenders first.

---

## A6 · Lessons (offline, with audio)
```text
Build the lesson screens for Vidya Nestham using the content loader from the previous task.

/lessons (chapter list)
- One card per chapter: Telugu title, number of concepts, a progress ring (concepts opened / total,
  stored per learner in meta or a small `lessonProgress` key), and a "ఆఫ్‌లైన్ కోసం డౌన్‌లోడ్"
  (Download for offline) button showing the download size in KB/MB.
- Download for offline: fetch the chapter pack, all its images and all audio_url files into the
  Cache API, with a progress bar; afterwards show "✓ ఆఫ్‌లైన్‌లో అందుబాటులో ఉంది" (available offline).
  Skip empty URLs. If Data Saver is on, ask before downloading audio.

/lessons/:chapterId (concept list)
- Ordered concept list with a ✓ for concepts this learner has opened.

/lessons/:chapterId/:conceptId (concept card)
- Title, card text (respect the text size setting), example in a highlighted box, image
  (if Data Saver is on: show a "చిత్రం చూడండి" (show picture) button instead of loading it).
- 🔊 button plays audio_url with play/pause; hide it if audio_url is empty. Never auto-play
  when Data Saver is on.
- "చెక్ ప్రశ్న" (check question): show check_question_te; tapping "జవాబు చూడండి" (see answer)
  reveals check_answer_te.
- "అర్థం కాలేదు · అడుగుతాను" (I didn't understand · I'll ask) → /ask?concept=<conceptId>.
- "సాధన చేయండి" (practise this) → /practice?concept=<conceptId>.
- Previous / next concept buttons; swipe left/right also works.
- Mark the concept as opened for the active learner.

Everything must work in airplane mode after the chapter has been downloaded (or opened once).
Show a Telugu message if a chapter was never downloaded and the phone is offline.
```
**Checks:**
- Download the Force chapter, switch to airplane mode, and confirm every card, image and audio clip still works.
- Data Saver stops audio from auto-playing.

---

## A7 · Ask-a-doubt screen (voice, text, photo)
```text
Build the Ask-a-doubt screen (/ask) for Vidya Nestham. It talks to the backend through an API client;
while USE_MOCKS=true it must work fully with mocks.

API CLIENT (app/src/services/api.ts)
- Base URL from config; every request sends header "X-Device-Id: <meta.deviceId>".
- Functions matching the agreed contract:
  stt(audioBlob) -> { text_te }             POST /api/stt (multipart "audio")
  tts(text_te) -> audio Blob                 POST /api/tts
  tutor({ question_te, class, chapter_id, concept_hint? }) -> { answer_te, concept_id, check_question_te, out_of_syllabus }
  photo(imageBlob) -> { question_te }        POST /api/photo (multipart "image")
- Errors arrive as { error_code, message_te }; throw a typed ApiError and show message_te to the user.
- Timeouts: stt/photo 20 s, tutor 25 s, tts 15 s → Telugu "సర్వర్ బిజీగా ఉంది" message with a retry button.
- Mocks in app/src/mocks/ returning realistic Telugu responses with a 600 ms delay.

VOICE INPUT
- Big round mic button: press and hold to record, release to send; a ✕ button cancels.
- MediaRecorder with audio/webm;codecs=opus (fall back to audio/ogg if needed), mono,
  audioBitsPerSecond 16000–24000, hard stop at 15 seconds with a visible countdown ring.
- First use: explain in Telugu why we need the mic, then request permission. If denied: show how to
  allow it, and focus the text box instead.
- After recording: show "వింటున్నాను…" (listening…) → call stt → put the text in an editable box
  so the learner can fix mistakes → "పంపు" (send).
- Show the size of the recording in KB in dev mode only (we report data usage later).

TEXT INPUT
- A text box with a Telugu placeholder "మీ సందేహం ఇక్కడ రాయండి…" and a send button.

PHOTO INPUT
- Camera button → <input type="file" accept="image/*" capture="environment">.
- Compress on the device with a canvas: max 1024 px on the long side, WebP or JPEG, ≤ 150 KB.
- Call photo() → show the extracted question in the editable box → send.

ANSWER
- Call tutor with the active chapter (from ?concept= or the last opened lesson) and concept_hint.
- Answer card: answer_te (respect text size), then check_question_te in a separate box.
- If out_of_syllabus: show a gentle Telugu note that this is beyond Class 8 Science.
- 🔊 button: fetch tts(answer_te) only when tapped; cache the audio in audioCache (and/or the
  Cache API) keyed by a SHA-256 hash of the text, so the same answer never downloads twice.
  Never auto-play when Data Saver is on.
- Follow-up buttons that call tutor again with the same question plus an instruction in Telugu:
  "ఇంకా సులభంగా చెప్పండి" (explain more simply), "ఒక ఉదాహరణ ఇవ్వండి" (give an example).
  A third button "దీనిపై సాధన" (practise this) → /practice?concept=<concept_id>.
- Keep the last 20 doubts with answers for this learner in a "నా సందేహాలు" (my doubts) list on this screen.

LOGGING FOR SYNC
- After each answered doubt, call recordDoubt(...) from app/src/services/syncAdapter.ts.
  Create that adapter now: if the other member's module at app/src/sync/ exports queueRecord, call it;
  otherwise do nothing. This keeps my code working before their sync module exists.

All text in i18n/te.ts. The screen must never show English error messages.
```
**Checks:**
- With mocks on, voice → transcript → answer → 🔊 works.
- Switch `USE_MOCKS=false` and repeat against B's deployed backend.
- Test on a real Android phone in Chrome, since mic behaviour differs from desktop.

---

## A8 · Offline doubt experience
```text
Make the Ask-a-doubt screen work gracefully with no internet, for Vidya Nestham.

WHEN OFFLINE (navigator.onLine is false, or a request fails with a network error)
- Voice: still record. Instead of calling stt, call queueDoubt(audioBlob, { learner_id, chapter_id,
  concept_hint, created_at }) through syncAdapter.ts (add queueDoubt + onDoubtAnswered there; if the
  other member's sync module isn't ready, store the blob in the `doubts` table with status "queued"
  as a temporary stand-in and log a developer warning).
- Text: queue the typed question the same way.
- Show a friendly Telugu card: "ఇంటర్నెట్ లేదు. మీ సందేహం దాచాను · నెట్ వచ్చాక జవాబు వస్తుంది."
  (No internet. I saved your doubt · the answer comes when the network returns.)
- Suggest help that works offline right now:
  1. "ఈ పాఠం చూడండి" (look at this lesson): the concept card for concept_hint, or the last opened concept.
  2. The common doubts list for the current chapter (from the chapter pack, excluding review: true items):
     tappable chips; tapping shows answer_te and a 🔊 button that plays the pre-generated audio_url
     offline.

MY DOUBTS LIST
- Show every doubt with a status pill: "వేచి ఉంది" (waiting), "జవాబు సిద్ధం" (answer ready), "చూశారు" (seen).
- Subscribe to onDoubtAnswered: when a queued doubt gets its answer, update the list and show a badge
  on the Home screen's ask button: "మీ జవాబు సిద్ధంగా ఉంది" (your answer is ready).

ALWAYS
- The common doubts chips are also shown when online, above the mic, as a quick way to ask.
- Nothing on this screen may throw an unhandled error when offline.
```
**Checks:**
- In airplane mode, record a doubt and see the "saved" card.
- Common doubts play their audio while offline.
- Go back online. Once B's sync is ready, the badge appears.

---

## A9 · Practice screen
```text
Build the Practice screen (/practice) for Vidya Nestham. The learning logic is owned by the other
member and lives in app/src/engine/ with this agreed interface:
  recordAttempt(learnerState, question, chosenOption) -> { learnerState, correct, misconception_id?, feedback_te }
  nextQuestion(learnerState, chapterPack)            -> { question, reason_te }
  masteryByConcept(learnerState)                     -> { [concept_id]: 0..1 }
  chapterStatus(learnerState, chapterPack)           -> "green" | "yellow" | "red"

1. Create app/src/services/engineAdapter.ts: if the real engine exists, use it; otherwise use a
   simple stand-in in app/src/mocks/engineStub.ts (random unanswered question, mastery = share of
   correct answers) so this screen works today. Same interface either way.
2. Learner state: load/save it per learner through the adapter (the engine owner decides storage;
   the stand-in may use the `mastery` table).

SCREEN FLOW
- Entry: /practice?concept=<id> practises one concept; /practice alone lets the learner pick a chapter.
- A session is 10 questions. Show "ప్రశ్న 3/10" and a thin progress bar.
- Above the question, show reason_te in a small grey line (e.g., why this question was chosen).
- Question types:
  mcq: shuffle the options every time they're shown (keep each option's original key for grading);
       big full-width option buttons.
  tf: two big buttons "ఒప్పు" / "తప్పు".
  fill: a text box; normalise before comparing (trim, Unicode NFC, collapse spaces, accept digits
        and the units N / న్యూటన్ as equivalent where `correct` lists them).
- After answering: lock the options, colour the chosen one (green/red), show:
  ✅ "సరైన జవాబు!" or ❌ "అయ్యో! సరైన జవాబు: …", then explanation_te, and if a misconception was
  detected, its fix_hint_te in a highlighted box.
- "తదుపరి" (next) → nextQuestion.
- End of session: a summary card (correct out of 10, concepts that improved, one concept to practise
  next) with buttons "మళ్ళీ సాధన" (practise again) and "ముఖ్య పేజీ" (home).

DATA
- Every answer goes through recordAttempt, and also to recordAttempt logging in syncAdapter.ts
  (call queueRecord({ type: "attempt", … }) if the sync module exists).
- The whole screen works offline (packs are cached; the engine runs on the device).
```
**Checks:**
- A full 10-question session works offline.
- MCQ options are in a different order each time.
- A wrong answer shows the fix hint for that misconception.
- Once B's engine lands, `reason_te` changes to the real reason.

---

## A10 · Learner progress
```text
Build the learner's progress screen (/progress) for Vidya Nestham, using masteryByConcept and
chapterStatus from engineAdapter.ts.

- Per chapter: Telugu title, the chapter's traffic-light colour, and every concept with stars:
  mastery < 0.5 → ★☆☆, 0.5–0.79 → ★★☆, ≥ 0.8 → ★★★ (never-practised concepts show "ఇంకా మొదలు పెట్టలేదు").
- Two short lists: "బాగా వచ్చినవి" (strong topics: mastery ≥ 0.8) and
  "ఇంకా సాధన చేయాల్సినవి" (practise more: mastery < 0.5), each item linking to /practice?concept=<id>.
- Study streak: number of consecutive days with at least one attempt or opened lesson, with a 🔥 icon.
- "ఈ వారం" (this week): a 7-dot row for the days studied.
- Big, simple, encouraging, no percentages. Works offline. Updates immediately after a practice session.
- Also replace getTodaySuggestion on Home: suggest the lowest-mastery concept that has been opened
  in a lesson, or the next unopened concept if none.
```
**Checks:**
- Practise wrong on purpose and the stars drop; practise right and they rise.
- The Home suggestion changes to match.

---

## A11 · Parent view
```text
Build the parent view (/parent) for Vidya Nestham, for a parent who may not read well.

ACCESS
- A separate parent PIN (4 digits, salted SHA-256, stored in meta as a guardian record linked to
  the learners on this device). First visit: set the parent PIN. Later visits: enter it.
- This screen is reachable without an active learner (from the picker footer too).

CONTENT (very visual, very little text)
- One card per learner: avatar + nickname, then one row per chapter with a big coloured circle
  (🟢 / 🟡 / 🔴 from chapterStatus) and the chapter title.
- "ఈ వారం {n} రోజులు చదివారు" (studied n days this week) with 7 dots.
- A huge 🔊 "వినండి" (listen) button per learner that plays a spoken Telugu summary.

SPOKEN SUMMARY (must work offline)
- Build it by playing a sequence of short pre-generated audio phrases (made by the other member's
  audio script). Use these phrase keys and look up their files in /content/audio/phrases/<key>.ogg:
    summary_intro
    days_0 … days_7                   ("this week they studied N days")
    chapter_<chapterId>_green | _yellow | _red
    summary_outro
  Do not speak the child's name (names can't be pre-generated); say "మీ పిల్లలు" (your child) instead
  and show the name on screen.
- If a phrase file is missing and the phone is online, fall back to tts() for that sentence;
  if offline, skip it silently.
- Put the list of phrase keys and their Telugu text in content/phrases.json so the audio script can
  generate them.

Works offline. Never shows question-level details, only the simple summary.
```
**Checks:**
- Set the parent PIN and see both demo learners.
- 🔊 plays the summary in airplane mode once B has generated the phrases.

---

## A12 · Teacher / volunteer view
```text
Build the teacher/volunteer view (/teacher) for Vidya Nestham.

- Clear banner at the top: "డెమో డేటా · ఇవి నిజమైన విద్యార్థులు కాదు" (Demo data · these are not real students).
- Fetch GET /api/teacher/summary via the API client (mock while USE_MOCKS=true):
  { class_size, weakest_concepts: [{ concept_id, avg_mastery }], learners_needing_help: [{ nickname, weak_concepts }] }.
- Section 1 "తరగతికి కష్టంగా ఉన్న అంశాలు" (topics the class finds hard): horizontal bars per concept,
  sorted weakest first, with the concept's Telugu title from the chapter pack (not the raw id).
- Section 2 "సహాయం కావాల్సిన విద్యార్థులు" (learners who need help): list of nicknames with their
  weak concepts as small chips.
- Cache the last successful response; when offline, show it with "చివరిగా నవీకరించింది: <time>"
  (last updated).
- Loading skeletons, an empty state, and the Telugu error message from the API on failure.
```
**Checks:**
- It works with mocks, then with B's endpoint.
- Offline, it shows the cached data with the "last updated" time.

---

## A13 · Settings & error states
```text
Finish Settings (/settings) and make error handling consistent across Vidya Nestham.

SETTINGS (persist in meta)
- డేటా సేవర్ (Data Saver) on/off, with the one-line explanation.
- అక్షరాల పరిమాణం (text size): 3 steps, applied app-wide through a CSS variable.
- గొంతు (voice) on/off: when off, hide mic buttons and 🔊 buttons everywhere.
- ఆఫ్‌లైన్ కంటెంట్ (offline content): list downloaded chapters with their size, and a
  "తొలగించు" (remove) button per chapter.
- గోప్యత (privacy): a short Telugu note for parents: only nickname, avatar and PIN are stored, on this
  phone; voice recordings are used only to understand the question and are not kept; no phone number,
  no Aadhaar, no photos of faces.
- About: app version line, content sources note ("All explanations and questions are original content
  aligned to the Telangana SCERT Class 8 syllabus"), and team names placeholder.

ERRORS
- A top-level React error boundary with a Telugu "ఏదో తప్పు జరిగింది" screen and a "మళ్ళీ ప్రయత్నించండి"
  (try again) button that reloads safely.
- A small toast system for non-blocking messages.
- Map every API error_code to its message_te (show message_te from the server when present).
- Handle and test, with Telugu messages: mic permission denied, camera denied, offline, server busy,
  rate limited, storage full (QuotaExceededError → suggest removing a downloaded chapter),
  content pack missing.
- Search the codebase and move any remaining hard-coded English user-facing text into i18n/te.ts.
```
**Checks:**
- Each setting works and survives a reload.
- Trigger each error case once; there's no English text and no blank screen.

---

## A14 · Demo data
```text
Add a "load demo data" feature to Vidya Nestham so judges can try the full app in one tap.

- On the ProfilePicker, a small button "డెమో డేటా లోడ్ చేయండి" (load demo data).
- It creates (or recreates) these sample profiles. They're synthetic, not real children:
  లక్ష్మి (🦚, class 8, PIN 1111): practised over the last 6 days; strong on force basics
     (force-what-is, force-contact ≥ 0.8), weak on friction concepts with repeated misconceptions
     friction-is-not-a-force and no-friction-at-rest; one queued doubt and two answered doubts.
  రవి (🐯, class 8, PIN 2222): a few sessions, mid-level mastery (different from Lakshmi's).
  చిన్ను (🐘, class 8, PIN 3333): brand new, no history.
  Parent PIN: 9999.
- Write the history through the same tables the app uses, with every seeded row marked
  demo: true and synced: true so it is never uploaded to the server.
- After loading, show a card listing the demo profiles and PINs (demo only), and a
  "డెమో డేటా తొలగించు" (remove demo data) button that deletes only demo: true rows.
- The button only appears when there are no real (non-demo) profiles, or in a build with
  VITE_DEMO=true.
```
**Checks:**
- In a fresh incognito window, one tap gives you Lakshmi with a believable history.
- Her parent view shows green for Force and red for Friction.
- Removing the demo data leaves any real profiles untouched.

---

## A15 · Performance & accessibility pass
```text
Do a performance and accessibility pass on Vidya Nestham for a low-end Android phone on 2G/3G.

1. Run a production build and report the size of every chunk, the font files and the precache list.
   Target: initial load under 1.5 MB uncompressed; every lazy screen chunk under 200 KB.
   Remove unused dependencies; make sure each screen is code-split.
2. Images: convert to WebP, max 40 KB each, explicit width/height to avoid layout shifts, lazy-load.
3. Font: confirm only Telugu + Latin subsets of Noto Sans Telugu ship, with font-display: swap.
4. Run Lighthouse in mobile mode (simulated slow 4G + 4× CPU slowdown) and fix issues until:
   PWA installable ✓, Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90.
5. Accessibility: every icon button has a Telugu aria-label; focus order is logical; colour contrast
   passes; tap targets ≥ 48 px; text size setting scales everything without overflow at 360 px width.
6. Measure and print (dev tool page or console script): the size of each chapter pack, the total size
   of a downloaded chapter (pack + images + audio), and the average voice clip size from recent
   recordings. I'll put these numbers in the README.
7. Test with DevTools "Slow 3G" and offline; list anything that feels slow and fix the worst three.

Give me a before/after table of the numbers.
```
**Checks:**
- Take a screenshot of the Lighthouse results for the README and submission.
- Record the measured sizes in the README's "Measured" column.

---

## Order and dependencies at a glance
| Prompt | Needs from Member B | Works without B? |
|---|---|---|
| A1–A4 | none | ✅ |
| A5 | validator script (B6) for the final check | ✅ (runs the check later) |
| A6 | pre-generated audio (B7) for 🔊 | ✅ (🔊 hidden until audio exists) |
| A7 | `/api/stt`, `/api/tts`, `/api/tutor`, `/api/photo` (B3–B5, B12) | ✅ with mocks |
| A8 | sync module + queued doubts (B9, B11) | ✅ with stand-in storage |
| A9, A10 | engine (B8) | ✅ with the stand-in engine |
| A11 | phrase audio (B7) | ✅ (falls back or skips) |
| A12 | `/api/teacher/summary` (B13) | ✅ with mocks |
| A13–A15 | none | ✅ |
