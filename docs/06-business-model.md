# 06 — Business Viability
> Judging criterion: **Business Viability — 25%** (the second-largest weight).
> The core question from the problem statement: *"Learners cannot pay, so who does?"*

> ⚠️ Every number marked **[A]** is an **assumption** for you to check or adjust. Every number marked **[V]** must be **verified from a public source** (UDISE+, state education department, Gnani/LLM pricing pages) before it goes in the pitch. Show your assumptions openly — judges reward honest maths more than big numbers.

---

## 1. Business model in one line
**B2B2C / B2G:** NGOs, CSR programmes, and state education programmes pay **per student per year**; students and parents use it **free**.

## 2. Customer segments (who pays and why)
| Payer | Why they'd pay | What they buy | Sales cycle |
|---|---|---|---|
| **CSR funds** (companies with CSR obligations under the Companies Act; education is an eligible activity) | Need measurable, reportable education impact | Sponsored cohort (e.g., 1,000 students in a district) + impact report | 1–3 months |
| **Education NGOs** (already running after-school / digital-learning programmes) | Their volunteers can't cover every child, every evening | Licences for their students + volunteer/teacher dashboard | 1–2 months |
| **State education department / Samagra Shiksha programmes** | Learning-outcome improvement in government schools, regional-language mandate | District/state licence, integration with existing programmes | 6–18 months (long-term goal) |
| **Low-fee private schools** (later) | Add-on homework help for parents | Per-student annual fee | 1 month |

**Go-to-market sequence:** NGO pilot (free/low-cost, collect proof) → CSR-funded district cohort → state programme.

## 3. Pricing [A]
| Plan | Price | Includes |
|---|---|---|
| **Pilot** | Free for 100 students, 8 weeks | Full product, impact report |
| **NGO / CSR cohort** | ₹200–300 per student per year [A] | Unlimited lessons/practice, fair-use voice doubts, dashboards, quarterly impact report |
| **District / state licence** | ₹100–150 per student per year at scale [A] | + integration, teacher training, custom chapters |

Compare: private tuition ₹300–800 per **month** [A] — we're ~1/20th of that per year.

## 4. Unit economics (show this table — fill with real prices)
Assumed usage per active student per month [A]: 20 voice doubts (≈10 s audio each), 20 TTS answers (≈30 s each), 20 LLM calls (≈1,500 tokens each). Lessons and practice are offline → ~zero cost.

| Cost item | Formula | ₹ / student / month |
|---|---|---|
| Speech-to-text (Gnani) | 20 × 10 s × price per second [V] | ___ |
| Text-to-speech (Gnani) | 20 × 30 s × price per second [V] — minus cache hits | ___ |
| LLM | 20 × 1,500 tokens × price per token [V] — minus cache hits | ___ |
| Hosting + DB | fixed cost ÷ active students | ___ |
| **Total** | | **target ≤ ₹10** [A] |

**Cost-control levers (these are real design decisions — mention them):**
- Lesson audio **pre-generated once**, reused by every student → zero runtime TTS for lessons
- **Answer caching**: popular doubts ("what is friction?") answered once, served to thousands
- Practice and adaptive engine run **on the device** → no server cost
- Rate limits / fair-use caps per student

At ₹250/year revenue and ₹120/year cost [A] → ~50% gross margin, improving with cache hit rate.

## 5. Market size (calculate with verified data)
| Layer | How to calculate | Value |
|---|---|---|
| **TAM** | Class 6–10 students in regional-language government schools across India [V: UDISE+] × ₹150/yr | ___ |
| **SAM** | Telugu-medium Class 6–10 students in Telangana + AP government schools [V: UDISE+] × ₹150/yr | ___ |
| **SOM (Year 1)** | 10,000 students via 3–5 NGO/CSR cohorts [A] × ₹250/yr | ₹25 lakh [A] |

Start with SOM — it's the believable number. TAM shows the ceiling.

## 6. Why we win (defensibility)
1. **Native Telugu content + misconception library** mapped to the state syllabus — slow to copy, compounds over time.
2. **Built for shared, low-end phones and poor data** — most competitors assume a personal smartphone and steady data.
3. **Voice-first** — removes the typing barrier.
4. **Impact data** (concept-level mastery gains) — exactly what CSR and government buyers need to report.
5. **Low cost per student** through offline-first design and caching.

## 7. Impact metrics we report to payers
- Active learners per week, sessions per learner
- Mastery gain per concept (before/after), % learners moving 🔴→🟢
- Doubts answered, top confusing concepts (feedback for teachers)
- Data used per session (proves accessibility)

## 8. Roadmap
| Phase | Timeline [A] | Scope |
|---|---|---|
| Hackathon MVP | Now | 1–2 chapters, Class 8 Science, Telugu |
| Pilot | 0–3 months | Full Class 8 Science, 1 NGO, 100–300 students |
| Scale 1 | 3–12 months | Classes 6–10 Science + Maths, Telangana + AP, CSR cohorts |
| Scale 2 | 12–24 months | More languages (Kannada, Tamil, Marathi…), state programme partnerships, SMS/IVR mode for feature phones |

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| AI gives a wrong science answer | Answers grounded in reviewed concept cards; teacher-review loop; "report this answer" button |
| Voice/LLM costs grow | Caching, pre-generation, fair-use caps, model choice |
| Government sales are slow | Start with NGOs/CSR; government is phase 2 |
| Child safety / data | Minimal data, no PII, guardrailed tutor, parent visibility |
| Adoption on shared phones | Evening-friendly, PIN profiles, data-saver, PWA (no install) |

## 10. The 30-second business pitch
> "Lakshmi can't pay for tuition — and she shouldn't have to. CSR funds and education NGOs already spend on digital learning but can't prove impact. Chaduvu Nestham costs under ₹___ per student per month to run, because lessons and practice work offline and popular doubts are cached. We charge sponsors ₹250 per student per year and give them concept-level learning reports. Our first 10,000 students mean ₹25 lakh ARR, and our Telugu misconception library becomes the moat as we expand to more classes and languages."
