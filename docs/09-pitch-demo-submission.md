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

## 2. Demo video script (3–6 minutes; mandatory)
The organisers require a demo video. Aim for **3–6 minutes** and cover the problem, why you chose it, the solution, and a walkthrough. A face cam isn't needed and a voiceover is optional. The core script below runs about 3 minutes. Add 1–2 minutes on the build: the architecture slide plus a short clip of Codebenders' Nexon planning a feature. Record it during the Monday submission window, from footage of the final build captured before the Sunday commit cut-off.
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

Tips: record on a **real phone** (screen record + voice), show the Telugu clearly, add English subtitles for non-Telugu judges, and stay within 3–6 minutes. Make the video complete on its own: if the free hosting is asleep or down when judges look, the video is the main evidence of a working product.

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
**Two deadlines:**
- **Code:** last commit before **Sun 22 Nov, 11:59 PM IST**. Commit times are tracked.
- **Form:** submit through the Codebenders dashboard by **Mon 23 Nov, 11:59 PM IST**. No code changes after Sunday.

- [ ] Final code pushed before Sunday 11:59 PM IST
- [ ] Project name + description (2–3 lines + feature bullets)
- [ ] Problem statement selected: **PS3, The Last-Mile Tutor** (only one)
- [ ] **Duo form:** both members' names, emails and phone numbers (both registered on app.codebenders.ai/hackathon)
- [ ] **Public GitHub repo** link (README complete, no secrets, commit history during the build window)
- [ ] **Demo video link, 3–6 min, mandatory** (unlisted YouTube / Drive with "anyone with link")
- [ ] Live app link: optional per the organisers but strongly recommended (tested in incognito on a phone; screenshots alone are not accepted)
- [ ] `CODEBENDERS_USAGE.md` with key prompts + iterations + screenshots
- [ ] LinkedIn post link (use the hashtags from the event's LinkedIn Post Guidelines tab)
- [ ] Deck link (if used)
- [ ] All links open without login (check in an incognito window)
- [ ] Optional feedback for Codebenders in the form
- [ ] Confirmation email/screenshot saved
