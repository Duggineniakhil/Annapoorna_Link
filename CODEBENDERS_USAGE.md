# How we built Vidya Nestham with Codebenders
**Vidya Nestham (విద్యా నేస్తం)** · ACE Builders Hackathon 2026 · Problem Statement 3: The Last-Mile Tutor

This file records how the application was developed in the **Codebenders IDE**: the build timeline, the key prompts, the iterations that mattered, and where we used our own judgement to correct or improve the output.

> **How to keep this file:** fill in each row **right after** finishing a task, while the details are fresh:
> - write the prompt and its result
> - note what you changed
> - add a screenshot in `docs/img/codebenders/`
> - add the commit hash
>
> Delete every `<!-- … -->` note and empty row before submitting.

---

## 1. Summary
| | |
|---|---|
| Build window | Sat 21 Nov 2026, 12:00 PM to Sun 22 Nov 2026, 11:59 PM IST |
| Team | <!-- Member A name --> (frontend, offline & content) · <!-- Member B name --> (backend, voice, AI & learning logic) |
| Total prompts used | <!-- e.g., 64 --> |
| Major iterations | <!-- e.g., 9 --> |
| Commits during the build window | <!-- e.g., 48 (see git history) --> |
| Codebenders features used | <!-- see section 6 --> |

## 2. How we worked with Codebenders
1. **Spec first.** Before the build window we wrote planning documents in [`docs/`](docs/): problem and user research, product spec, architecture, and shared contracts between the two members. We gave these to Codebenders as context so its output matched one consistent design.
2. **One task, one prompt.** Each member worked through a numbered task list (A1–A15, B1–B15). Each task started with one detailed prompt ([Member A prompts](docs/13-prompts-member-a.md), [Member B prompts](docs/14-prompts-member-b.md)), followed by short follow-up prompts to fix or refine.
3. **Contracts and mocks.** We agreed the API, data format, engine and sync interfaces up front ([team split §2](docs/12-team-split.md)). That let both members build in parallel in Codebenders, with the frontend running on mocks until the backend was live.
4. **Verify every output.** After every prompt we ran tests and checked the result on a real low-end Android phone, including in airplane mode. We reviewed Telugu text and science facts by hand.
5. **Commit small.** One commit per task, so the git history shows the build step by step.

## 3. Build timeline

### Member A: Frontend, Offline & Content
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| A1 | | PWA skeleton | "Create the frontend skeleton for Vidya Nestham… Telugu-first, offline-friendly…" | | | | |
| A2 | | Frontend deploy | | | | | |
| A3 | | Profiles & PIN | | | | | |
| A4 | | Home screen | | | | | |
| A5 | | Content pack (Force / Friction) | | | | | |
| A6 | | Lessons (offline, audio) | | | | | |
| A7 | | Ask a doubt (voice, text, photo) | | | | | |
| A8 | | Offline doubt experience | | | | | |
| A9 | | Practice screen | | | | | |
| A10 | | Learner progress | | | | | |
| A11 | | Parent view | | | | | |
| A12 | | Teacher view | | | | | |
| A13 | | Settings & error states | | | | | |
| A14 | | Demo data | | | | | |
| A15 | | Performance & accessibility | | | | | |

### Member B: Backend, Voice, AI & Learning Logic
| # | Time (IST) | Task | Key prompt (short) | What Codebenders produced | What we changed / iterated | Screenshot | Commit |
|---|---|---|---|---|---|---|---|
| B1 | | Backend skeleton | "Create the backend skeleton for Vidya Nestham… STUB endpoints that already return the agreed response shapes…" | | | | |
| B2 | | Backend deploy + database | | | | | |
| B3 | | Gnani speech-to-text | | | | | |
| B4 | | Gnani text-to-speech | | | | | |
| B5 | | AI tutor | | | | | |
| B6 | | Content validator | | | | | |
| B7 | | Audio pre-generation | | | | | |
| B8 | | Adaptive engine | | | | | |
| B9 | | Offline sync (client) | | | | | |
| B10 | | Sync endpoint (server) | | | | | |
| B11 | | Queued voice doubts | | | | | |
| B12 | | Photo doubts | | | | | |
| B13 | | Teacher summary | | | | | |
| B14 | | Hardening & credit protection | | | | | |
| B15 | | Data-use measurement | | | | | |

<!-- Add rows for any extra prompts (bug fixes, refactors) with numbers like A7.1, B5.2 -->

## 4. Iterations that mattered
<!-- Pick 3–5 real cases. For each: what you asked, what went wrong, how you changed the prompt or code, and the result. Before/after screenshots are the strongest evidence. -->

### Iteration 1: <!-- title, e.g., "Tutor answers were too long and too formal" -->
- **Prompt v1:** <!-- short quote -->
- **What we saw:** <!-- e.g., 300-word answers in bookish Telugu, no example -->
- **Prompt v2 / fix:** <!-- e.g., added Class 6 reading level, 120-word limit, village-example rule, JSON output -->
- **Result:** <!-- e.g., answers 80–110 words, one example, check question at the end --> · <!-- before/after screenshots -->

### Iteration 2: <!-- title -->
- **Prompt v1:**
- **What we saw:**
- **Prompt v2 / fix:**
- **Result:**

### Iteration 3: <!-- title -->
- **Prompt v1:**
- **What we saw:**
- **Prompt v2 / fix:**
- **Result:**

## 5. Key design decisions

### 5.1 Offline-first, online-enhanced voice
- **Constraint:** Problem Statement 3 asks for a product that is light on data, saves progress when the connection drops, and accepts voice input. Gnani speech runs in the cloud and needs internet.
- **Options considered:**
  - (a) On-device speech models: tens to hundreds of MB to download, weak Telugu support, slow on low-end phones.
  - (b) Cloud voice with offline fallbacks.
- **Decision: (b).** What that means in practice:
  - Lessons, practice, progress and profiles work fully offline.
  - Lesson audio and common-doubt answers are pre-generated once and cached on the phone, so learners can listen offline.
  - New voice doubts are queued offline and answered automatically when the phone reconnects.
  - Live voice uses small compressed clips, and answer audio is downloaded only when the learner taps 🔊.
- **Evidence:** the airplane-mode demo. Lessons, audio and practice work offline; a voice doubt gets queued and is answered after reconnecting. Measured data per voice doubt: <!-- ___ KB -->.

### 5.2 Explainable adaptive practice
- Every wrong option is tagged with a specific misconception, so the next question targets that exact gap.
- The engine shows *why* it chose each question, in Telugu, which builds trust with learners and teachers.
- The engine is pure functions with unit tests. Mastery can be recomputed from the attempt history, so offline sync never conflicts.

### 5.3 Shared-phone design
- Each family member gets a profile with an avatar and a 4-digit PIN.
- The app logs out after 10 minutes idle, and each profile's data is stored separately.
- Only a nickname, avatar and hashed PIN are stored, on the device. No other personal data is collected.

### 5.4 Privacy and cost guardrails
- API keys live only on the server.
- Voice recordings and photos are never stored or logged.
- Personal data is stripped from questions before they reach the AI model.
- The tutor stays within the syllabus and refuses unsafe requests.
- Per-device and daily limits protect API credits.
- TTS and tutor answers are cached, so repeat requests cost nothing.

## 6. Codebenders features we used
<!-- Only list what you actually used, with one line on how. -->
| Feature | How we used it |
|---|---|
| <!-- e.g., code generation from a spec prompt --> | <!-- e.g., scaffolded the PWA and the backend from A1/B1 --> |
| <!-- e.g., debugging / error explanation --> | |
| <!-- e.g., refactoring --> | |
| <!-- e.g., test generation --> | |
| <!-- e.g., deploy / run --> | |

## 7. Where human judgement corrected or improved the output
| Area | What we checked | Examples of changes |
|---|---|---|
| **Telugu language** | Every screen string, concept card, question and tutor answer read by a native speaker <!-- reviewer name/role --> | <!-- e.g., "changed X to Y because learners say Y" --> |
| **Science accuracy** | Content checked against the Telangana SCERT Class 8 Physical Science syllabus | <!-- e.g., fixed an explanation of static friction --> |
| **Syllabus terms** | Telugu terms matched to the Telugu-medium SCERT textbook | <!-- e.g., replaced X with the book's term Y --> |
| **Security** | Keys server-side only, no secrets in the bundle or git history, rate limits | <!-- e.g., moved a key out of the client config --> |
| **Privacy (minors)** | No personal data collected, audio and photos never stored, PII stripped before the AI call | <!-- … --> |
| **Low-end phone testing** | Tested on <!-- phone model, RAM, network --> | <!-- e.g., reduced bundle from X MB to Y MB --> |

## 8. Content sources
- **Syllabus:** Telangana SCERT Class 8 Physical Science, Ch 1 *Force* and Ch 2 *Friction*. See `content/SOURCES.md` for the source URL and the date we checked it.
- **Explanations and questions:** original content aligned to the syllabus chapters; no textbook text was copied. <!-- Describe honestly how the final content was written and reviewed, as confirmed with the organisers. -->
- **Images:** <!-- original, or openly licensed with attribution in content/SOURCES.md -->

## 9. Evidence
- Screenshots of the Codebenders IDE at key steps: [`docs/img/codebenders/`](docs/img/codebenders/)
- Short screen recordings of Codebenders generating or fixing code: <!-- links -->
- Git history, one commit per task: <!-- link to the commits page -->
- Test results: <!-- e.g., screenshot of the passing test runs for app/ and server/ -->
- Lighthouse report: <!-- screenshot -->

## 10. Before submitting: confirm each item
- [ ] All application code was written in the Codebenders IDE during the build window.
- [ ] Every row in section 3 is filled in, or removed if the task was dropped.
- [ ] At least 3 real iterations are documented in section 4.
- [ ] Section 6 lists only features we actually used.
- [ ] Content sources (section 8) are described accurately.
- [ ] No API keys, tokens or personal data appear in this file or its screenshots.
- [ ] All `<!-- … -->` notes are removed.
