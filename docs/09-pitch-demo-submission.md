# 09 — Pitch, Demo & Submission
> **Presentation — 10%**, but the demo is also how judges *see* the other 90%. Structure everything around Lakshmi's story.

---

## 1. Pitch deck (8–10 slides)
| # | Slide | Content | Supports |
|---|---|---|---|
| 1 | Title | Vidya Nestham — విద్యా నేస్తం · "A Telugu learning friend that works on a shared phone with poor data" · Team names | — |
| 2 | Meet Lakshmi | Persona photo (illustration, not a real child), 3 facts: Telugu medium, shared phone, no one to ask | Problem & user |
| 3 | The problem | 3 cited stats (teacher shortage, learning gaps, phone sharing) + 1–2 real quotes from your calls | Problem & user |
| 4 | Why current options fail | The comparison table from `01-problem-and-user.md §5` | Problem & user |
| 5 | Our solution | 4 pillars: Telugu end to end · voice-first doubts · adaptive practice · offline on shared phones | Working product |
| 6 | Live demo | (switch to demo) | Working product |
| 7 | How it works | Architecture diagram + data budget + offline sync + guardrails | Build quality |
| 8 | Built with Codebenders | Timeline, key prompts, 2 before/after iterations, screenshots | Use of Codebenders |
| 9 | Business model | Who pays, pricing, unit-economics table, SOM | Business viability |
| 10 | Impact & roadmap | Metrics we report, pilot plan, more classes/languages | Business viability |

Must-Include mapping table (from `02-product-spec.md §1`) → put in the appendix or on slide 5.

## 2. Demo video script (≈3 minutes)
| Time | Scene | Say (English or Telugu) |
|---|---|---|
| 0:00–0:20 | Lakshmi's evening (slides/illustration) | "Lakshmi studies in Telugu medium, on her father's phone, after 7 PM. When she doesn't understand Science, there's no one to ask." |
| 0:20–0:35 | Open app on a real phone → profile picker | "Three family members, one phone. Each has their own profile and PIN." |
| 0:35–1:10 | **Hold mic, ask in Telugu**: "ఘర్షణ ఎందుకు బలం అవుతుంది?" → transcript → answer → 🔊 plays | "She asks by voice, no typing. The answer is in simple Telugu with an example from her village, and it's read aloud." |
| 1:10–1:40 | Tap "Practise this" → answer wrong → targeted feedback → easier question with reason | "When she gets it wrong, the tutor finds *why* and gives an easier question on that exact misconception." |
| 1:40–2:05 | **Airplane mode ON** → lessons + practice still work → turn it OFF → "Saved ✓" | "No data? Lessons and practice still work, and progress syncs when the network comes back. A 10-minute session used only __ MB." |
| 2:05–2:25 | Parent view → traffic lights → 🔊 voice summary | "Her father can't read dashboards — so he just listens." |
| 2:25–2:40 | Teacher view (demo data) | "Teachers and volunteers see which concepts the class is stuck on." |
| 2:40–3:00 | Business + close | "Free for students, paid by NGOs and CSR at ₹250 per student per year. Built end to end in Codebenders in 36 hours." |

Tips: record on a **real phone** (screen record + voice), show the Telugu clearly, add English subtitles for non-Telugu judges, keep it under the length limit if one is given.

## 3. Repository README (structure)
```markdown
# Vidya Nestham — విద్యా నేస్తం
Telugu, voice-first, offline-friendly AI Science tutor for Class 8 (Telangana State Board).
ACE Builders Hackathon 2026 · Problem Statement 3: The Last-Mile Tutor

🔗 Live app: <url>   🎥 Demo video: <url>   📊 Deck: <url>
Demo: tap "Load demo data" → profile "లక్ష్మి", PIN shown on screen (demo only)

## Problem & user        (summary of 01)
## What it does          (feature list + Must-Include mapping table)
## Screenshots           (5–6 phone screenshots)
## Architecture          (diagram + offline/sync + voice pipeline)
## Data-light design     (budget table + measured numbers)
## Guardrails & privacy  (minors, no PII, no textbook copy, safe tutor)
## Business model        (summary of 06)
## Built with Codebenders → see CODEBENDERS_USAGE.md
## Run locally           (setup, env vars WITHOUT values, scripts)
## Content sources       → content/SOURCES.md
## Team
## License
```

## 4. LinkedIn post (draft; required for submission)
> 🚀 Built **Vidya Nestham (విద్యా నేస్తం)** at the **ACE Builders Hackathon 2026** by @Codebenders!
>
> Millions of students study in Telugu-medium government schools with too few teachers and one shared family phone. Most ed-tech is built for English, personal smartphones and fast data.
>
> So we built a Telugu learning friend for Class 8 Science:
> 🎤 Ask doubts by **voice in Telugu**, hear the answer read aloud
> 🧠 **Adaptive practice** that finds *why* you got it wrong
> 📶 Works **offline** on a shared low-end phone, syncs later
> 👨‍👩‍👧 A **parent view** you can just *listen* to
>
> Built end to end with the Codebenders IDE in 36 hours. Voice powered by Gnani.
> 🔗 Live demo: <link> · 💻 Code: <repo>
>
> #ACEBuilders #Codebenders #Hackathon #EdTech #Telugu #AIForGood

(Check the event's **LinkedIn Post Guidelines** tab for required tags/hashtags and add them.)

## 5. Final submission checklist
- [ ] Project name + description (2–3 lines + feature bullets)
- [ ] Team details (solo/duo, names as registered)
- [ ] **Working, deployed app link** (tested in incognito on a phone; screenshots alone are not accepted)
- [ ] **Public GitHub repo** link (README complete, no secrets, commit history during the build window)
- [ ] `CODEBENDERS_USAGE.md` with key prompts + iterations + screenshots
- [ ] Demo video link (unlisted YouTube / Drive with "anyone with link")
- [ ] LinkedIn post link
- [ ] Deck link (if allowed/required)
- [ ] All links open without login
- [ ] Submitted by **10:30 PM IST Sunday** (deadline 11:59 PM)
- [ ] Confirmation email/screenshot saved
