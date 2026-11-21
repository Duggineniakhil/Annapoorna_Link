# 05 — 36-Hour Build Plan
**Product:** Annapoorna Link · **Problem Statement 2: Rescue the Surplus** · Hyderabad
**Build window:** Sat 21 Nov 11:30 AM IST (as announced at the kick-off; the website says 12:00 PM) → Sun 22 Nov 11:59 PM IST.
**Hard cut-off:** the **last commit must be before Sun 22 Nov, 11:59 PM IST**. GitHub commits are tracked, and nothing can be built or committed after that.
**Submission form:** open until **Mon 23 Nov, 11:59 PM IST**. Use that extra time only for the video and the form.
**Rule:** all code is written in the **Codebenders IDE** (chat-to-build with Nexon). Log key prompts as you go (`CODEBENDERS_USAGE.md`). See `15-kickoff-session-notes.md` for every official answer.

Priorities: **P0** = must work in the demo · **P1** = strong plus · **P2** = only if ahead.

---

## Before you start coding (prep)
- [x] External AI-model and voice APIs inside the product: **allowed** (kick-off Q&A, 1:07:41).
- [ ] **Both members** register through app.codebenders.ai/hackathon, claim the coupon (8 million credits each), and sign in to the IDE with the same email.
- [ ] Start a **new Nexon chat** with the Annapoorna Link context message (doc 13 / doc 14).
- [ ] Agree the contracts in `12-team-split.md` §2 (30 min).
- [ ] Make 3–5 quick user calls (doc 01 §7) whenever you're waiting on something.

## Plan (see `12-team-split.md` §5 for who does what)
| When | Goal | Done when |
|---|---|---|
| First 3 h | Skeletons, deploys, seed data, demo login (P0) | Both live URLs work; each demo account lands on its home |
| Next 3 h | Quick Post + guidance + listings (P0) | A real listing is posted in < 60 s with a safety card |
| Next 4 h | Matching + offers + volunteer tasks + codes (P0) | **Full flow by hand: post → offer → claim → pickup → deliver** |
| Sleep | ≥ 5 hours | |
| Sun morning | Live updates + map + impact (P0) | Another role's change appears live; impact shows assumptions |
| Sun midday | Demo scenario bots (P1), voice post (P1) | Wedding-night scenario runs in 2 minutes |
| Sun afternoon | Errors, EN/TE polish, hardening, metrics, Lighthouse | Feature freeze at **5 PM** |
| Sun evening | Joint bug-bash with doc 08 tests; record raw demo footage; README + usage log | Final push **by 11 PM** |
| **Mon 23 Nov** | **Demo video (3–6 min)**, deck, LinkedIn post, **submit form** (duo) | Confirmation saved before 11:59 PM |

## Cut list (if behind schedule, drop in this order)
1. Voice post → mention as roadmap
2. Printable monthly report → keep the on-screen impact view
3. Offer splitting across receivers
4. Demo scenario bots → do the flow by hand with the account switcher
5. Map polish → keep a simple distance + "Navigate" link

**Never cut:** under-a-minute posting, explainable matching, live status with handover codes, safety card on every listing, impact view with assumptions, a working build on video. (A live link is optional per the organisers, but strongly recommended.)

## Git discipline
- Commit after every working slice, at least every 1–2 hours, with clear messages.
- Tag `v0.1-skeleton`, `v0.5-full-flow`, `v1.0-submission`.
- **Nothing after Sun 22 Nov, 11:59 PM IST.**
- If one member runs low on credits, move the project to the teammate's account.
