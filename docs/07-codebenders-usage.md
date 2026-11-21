# 07 — Use of Codebenders (how we work + what to log)
> Judging criterion: **Build Quality & Use of Codebenders, 15%**. The rules require: *"Include Codebenders usage details, key prompts, and iterations"* and *"be ready to demonstrate your Codebenders usage and development process."*
> We keep the log in `CODEBENDERS_USAGE.md` at the repo root. Fill it in **as you build**; rebuilding it from memory at 10 PM on Sunday never works.

---

## 1. What judges want to see
- That the app was **built in Codebenders**, from scratch, during the window
- **Good prompting**: clear specs, iteration, fixing what the AI got wrong
- **Your judgement**: where you rejected or corrected AI output (matching logic, safety wording, security, Telugu text)
- Screenshots or short screen recordings of the IDE at key moments
- **Good platform habits.** The organisers said the platform tracks *how well* you use it (doc 15). In practice:
  - chat-to-build with Nexon
  - read and approve its plan before it builds
  - one feature at a time
  - specific prompts with success criteria
  - re-plan after two failed fixes
  - commit after each working slice

## 2. Where the prompts are
- **Member A (frontend & experience):** `13-prompts-member-a.md`. Context message + A1–A15.
- **Member B (backend, matching & data):** `14-prompts-member-b.md`. Context message + B1–B15.

Each file starts with a **context message** to send first in a new Nexon chat, then one prompt per task with checks.

## 3. Prompt-writing rules for follow-ups
- Name the screen, the field and the behaviour: *"On /receiver, the offer countdown keeps running after Accept. Expected: it stops and the delivery code appears."*
- Paste the exact error and what you expected.
- Give success criteria: *"Done when a wrong pickup code shows the tries left and the 6th try returns CODE_LOCKED."*
- If the plan touches the other member's folder, say no and re-scope.
- If a fix fails twice, stop and ask Nexon to re-plan from the spec.

## 4. Key design decisions to record in the log
1. **Explainable matching.** Receivers see *why* they were offered food. The weights are in config and tested.
2. **Handover codes instead of GPS.** Simple and private, they work on weak networks and prove each step happened.
3. **Server-enforced safety windows.** Pickup-by can't exceed the guidance rules; listings auto-expire; we never claim food is safe.
4. **Only delivered food counts** toward impact, and every number shows its assumptions.
5. **Offer cascade.** A 10-minute window per receiver, so food never waits on one phone call.
6. **SSE live updates with a polling fallback.** Simpler than websockets and reliable enough.

## 5. Capture evidence as you go
- Screenshot Nexon's plan and the result for each task (`docs/img/codebenders/`).
- Record 2–3 short clips (30 s) of Nexon planning or fixing something, for the demo video.
- Commit after each task with the task id in the message, e.g. `feat(server): B7 matching engine with reasons`.
