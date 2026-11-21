# 15 — Kick-off Session: Official Answers
Source: [ACE Builders Hackathon 2026, Official Kick-off & Participant Orientation](https://youtu.be/8qJwKShc8VE) (Codebenders, 21 Nov 2026, about 98 min). Timestamps are from the recording.

Where this differs from the website, the **website and the WhatsApp channel are the single source of truth**. Re-check there if in doubt.

---

## 1. Rules that affect Vidya Nestham
| Topic | Official answer | Timestamp |
|---|---|---|
| **External AI models inside our app** | Allowed. If the solution needs to call an AI model (bought or free API), we can connect it. Only code generation must use Codebenders' own model. **So Gnani and an AI-model API in the product are fine.** | 1:07:41 |
| **ChatGPT / Gemini outside the IDE** | Allowed for research, planning prompts and writing specs (PRDs). | 1:14:07 |
| **Coding tools** | Codebenders IDE only. No other AI coding tools, no pre-existing code, no ready-made projects. | 51:00 |
| **Existing code** | Not allowed. Everything must be created after the build window opened. Moving a project between teammates' Codebenders accounts is fine. | 1:05:11 |
| **Build window** | Opened **Sat 21 Nov, 11:30 AM IST** (as announced; the website says 12:00 PM). Closes **Sun 22 Nov, 11:59 PM IST**. | 1:16 |
| **Last commit** | Must be **before Sun 22 Nov, 11:59 PM IST**. GitHub commits are tracked. No building or committing during the submission window. | 1:00:40 |
| **Submission deadline** | **Mon 23 Nov, 11:59 PM IST** (shown in the submission portal). Use the extra time only for the video and the form. | 1:33:23 |
| **What to submit** | Public GitHub repo link, demo video link, project name, problem statement, team details. Every link must be accessible. | 1:03:08, 1:25:35 |
| **Deployment** | Optional. Codebenders provides no hosting; free hosting (e.g., Vercel) is fine. Without a live link, the video becomes the main evidence. | 1:03:35, 1:11:40 |
| **Demo video** | **Mandatory.** Recommended even with a live link, because free hosting may be down during judging. **3–6 minutes.** Cover the problem, why you chose it, the solution and a walkthrough. Face cam not needed; voiceover optional. | 1:30:13, 1:31:27 |
| **Problem statements** | Pick **one** only; don't combine two. | 1:06:35 |
| **Web or mobile** | Either; your choice based on the problem. | 1:04:21 |

## 2. Accounts, credits and team
- **Registration:** both members must register through **app.codebenders.ai/hackathon**. Registering on Gigpoint alone doesn't unlock credits. (56:22)
- **Credits:** each registered person gets **8 million credits** to claim from the dashboard. A duo has two allowances. (57:24, 1:02:00)
- **Running low:** credits can't be transferred, but you can move the project to your teammate's account and continue there. (1:02:27)
- **No extra accounts:** one person must not create two accounts to get more credits. (1:09:46)
- **Extra credits:** possible on request, depending on what you've built and how well you've used the platform. (1:12:28)
- **Usage is tracked:** the platform tracks *how well* you use it, and that feeds into the "Build quality & use of Codebenders" score. (1:13:09)
- **Credit use:** credits are spent only when Codebenders' AI makes changes, not when you edit code by hand. (1:10:15)
- **Duo submission:** use the duo form with both members' names, emails and phone numbers. Both must be registered. (57:48, 1:36:26)
- **Certificates:** they appear in the dashboard a few days after the hackathon. (1:10:41)

## 3. How the organisers want you to use the Codebenders IDE
- **Use "Chat to build"** with the **Nexon** agent: describe what you want, Nexon proposes a plan, you approve it, it builds, you preview and refine. (30:41)
- **Read Nexon's plan before approving.** That's where misunderstandings get caught for free. (38:51)
- **One feature at a time.** Build it and test it before asking for the next; never paste the whole app in one giant prompt. (36:14, 40:30)
- **Be specific.** Name the screen, the field and the behaviour, e.g. "add a search bar on the events page that filters by title", not "add search". (38:18)
- **Give success criteria.** Tell it how you'll know the feature works; the platform also writes and runs its own tests. (26:26)
- **If a fix fails twice, step back and re-plan.** Don't resend it. When something breaks, share the exact error and what you expected. (39:09, 40:39)
- **Keep the spec current.** If you change direction, update the spec so the context stays true. (41:25)
- **New chat** when a conversation gets long, to save context. **Skills and agents** can be added. **Settings** let you choose the model, e.g. a lighter one for planning. (45:05–46:06)
- **Commit after each working slice** so you can roll back. (37:06)
- **Their summary:** "Does it know the system? Is there a plan? How will we prove it works?" If any answer is no, you're back to "prompt and pray". (42:02)

**For us:** prompts A1, B1 and B5 are large. If Nexon's plan for one looks huge, split it into two or three smaller prompts. That's better for quality, credits, and the usage log judges see.

## 4. Judging reminders
- **Weights:** Working product 30% · Business viability 25% · Problem & user clarity 20% · Build quality & use of Codebenders 15% · Presentation 10%. (52:08)
- **Business viability isn't only revenue.** Social impact counts too, e.g. helping people access government support. That supports our model of NGO, CSR and state-programme payers. (1:23:01)
- **Before building, answer three questions** (1:23:49):
  1. Who is the user, and do you understand their day?
  2. Can you build something that works for them and is easy to use?
  3. Do you understand the guardrails? For us: minors' data, no copied textbooks, a tutor that stays on the syllabus.
- **Be original.** Existing solutions can be a reference point, but don't copy them. Do research and talk to real users. (1:22:19)

## 5. Still open: ask in the WhatsApp group
- Can **AI-drafted lesson content** (concept cards, questions) be shipped inside the app after human review? Docs 10 and 11 were drafted with an external tool. Planning and specs are allowed (§1), but app content wasn't asked directly.
- The **build-window start**: 11:30 AM (said in the session) vs 12:00 PM (website). It doesn't affect us, since our first commit was after 12:00, but note it.
