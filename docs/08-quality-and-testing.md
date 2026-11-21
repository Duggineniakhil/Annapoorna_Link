# 08 — Quality, Testing & Sample Data
> Supports **Working Product (30%)** and **Build Quality (15%)**. A product that works smoothly during judging beats a bigger product that crashes.

---

## 1. Sample learner profiles (synthetic only — no real children's data)
| Profile | Nickname | Class | Avatar | Story for the demo |
|---|---|---|---|---|
| L1 | లక్ష్మి (Lakshmi) | 8 | 🦚 | Main demo learner: weak on friction misconceptions, strong on force basics |
| L2 | రవి (Ravi) | 8 | 🐯 | Shares the same phone, different progress (shows profile separation) |
| L3 | చిన్ను (Chinnu) | 6 | 🐘 | Younger sibling — shows the "Class 8 only" scope message |
| Parent | నాన్న (Father) | — | 👨 | Parent view of L1 |
| Teacher class | 30 synthetic learners | 8 | — | Generated with random but realistic mastery spread, labelled "Demo data" |

Seed data must be **recreatable** (seed script / button "Load demo data") so judges can try it themselves.

## 2. Acceptance tests (run on a real low-end phone before submitting)
| # | Test | Pass criteria |
|---|---|---|
| T1 | Open live URL on a 2–3 GB RAM Android phone over mobile data | Usable in < 5 s |
| T2 | Create 2 profiles, do practice on each | Progress is separate |
| T3 | Ask a doubt by voice in Telugu | Correct transcript (or editable), Telugu answer, audio plays |
| T4 | Ask the same doubt again | Answer + audio instant (cache) |
| T5 | Airplane mode → open lessons + practice | Works fully |
| T6 | Airplane mode → ask voice doubt | Queued with a clear Telugu message; answered after going online |
| T7 | Answer 3 friction questions wrong | Engine shows easier, misconception-targeted questions + reason |
| T8 | Go back online | Sync completes, "last saved" updates, server has the records |
| T9 | Parent view | Traffic lights correct; voice summary plays |
| T10 | Photo of a printed question (P1) | Question extracted + answered |
| T11 | Ask an off-topic/unsafe question | Polite Telugu refusal / redirect |
| T12 | Ask for/offer personal info ("my phone number is…") | Not stored, tutor doesn't ask for it |
| T13 | Deny mic permission | Telugu message + text box fallback |
| T14 | Check page source / network tab | No API keys visible in the browser |
| T15 | Lighthouse mobile | PWA installable; performance ≥ 80 (screenshot) |
| T16 | Data used for a 10-minute session (Chrome data usage / DevTools) | Record the number — use it in the pitch |

## 3. Automated tests (quick wins)
- Adaptive engine: mastery update, next-question selection, no repeats, difficulty steps
- Sync queue: idempotency (same batch twice → no duplicates), partial failure retry
- Content validator: schema, every wrong option has a misconception, no empty Telugu strings

## 4. Content QA
- [ ] Every concept card reviewed by a native Telugu reader
- [ ] Every question's correct answer double-checked
- [ ] Terms match the SCERT textbook terms
- [ ] No copied textbook paragraphs

## 5. Demo-day reliability
- [ ] Rate limits set, but high enough for judges
- [ ] Gnani + LLM credits topped up; alert if near limit
- [ ] "Load demo data" button works on a fresh browser
- [ ] Fallback: if live APIs fail during judging, the cached common doubts still work
- [ ] Backup screen recording of the full flow in case the live demo fails
