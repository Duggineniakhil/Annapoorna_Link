# 04 — Content Plan (Telugu · Class 8 · Science)
> Content quality *is* the product for an ed-tech demo. A small amount of excellent, native Telugu content beats a lot of machine-translated text.

---

## 0. SCERT Telangana Class 8 Science: chapter list (checked 21 Nov 2026)
Telangana teaches Class 8 Science as **two textbooks**: Physical Science and Biological Science.

### Physical Science (భౌతిక శాస్త్రం): from the official SCERT textbook table of contents
Source: SCERT Telangana Class 8 Physical Science textbook (English medium). First published 2013, reprinted 2021 (free-distribution edition 2021-22). The month column is the teaching month from the book's syllabus table.
| # | Chapter | Taught in |
|---|---|---|
| 1 | Force | June |
| 2 | Friction | July |
| 3 | Synthetic fibres and plastics | July |
| 4 | Metals and non-metals | — |
| 5 | Sound | August |
| 6 | Reflection of light at plane surfaces | — |
| 7 | Coal and petroleum | August |
| 8 | Combustion, fuels and flame | — |
| 9 | Electric conductivity of liquids | September |
| 10 | Some natural phenomena | — |
| 11 | Stars and solar system | October |
| 12 | Graphs of motion | February |

### Biological Science (జీవ శాస్త్రం): from three third-party sites that agree (official PDF not checked)
| # | Chapter |
|---|---|
| 1 | What is Science? |
| 2 | Cell – The Basic Unit of Life |
| 3 | The World of Microorganisms (Part I & II; some sources count these as two chapters) |
| 4 | Reproduction in Animals |
| 5 | The Age of Adolescence |
| 6 | Biodiversity and its Conservation |
| 7 | Different Ecosystems |
| 8 | Production of Food from Plants |
| 9 | Production of Food from Animals |
| 10 | Not for Breathing, Not for Drinking |
| 11 | Why do we fall ill? |

**Decision:** Physical Science **Ch 1 "Force" (బలం)** in full, then **Ch 2 "Friction" (ఘర్షణ)** as the stretch goal. They're the first two chapters taught (June and July) and are closely linked, so the misconceptions carry over from one to the next.
⚠️ Before writing content, open the **Telugu-medium** book. Copy its exact Telugu chapter titles and terms, and check that the 2025-26 edition hasn't changed the order. Download it from scert.telangana.gov.in or teachersbadi.in.

## 1. Syllabus source — verify first (15 min)
1. Download the **official Telangana SCERT Class 8 Science textbook (Telugu medium)** from the SCERT Telangana website (Physical Science and Biological Science are separate books in Telangana).
2. Copy the **exact chapter list and learning outcomes** into `content/SYLLABUS.md`, with the source URL and the date you checked.
3. Pick the chapter. Good demo chapters are concrete, everyday, and easy to quiz on. Candidates (confirm they exist in the current book):
   - **Force / Friction** (physical science) — great everyday examples, clear misconceptions
   - **Sound** — voice/audio fits the product's story
   - **Microorganisms / Cell** (biology) — good if you prefer biology
4. If you are from Andhra Pradesh and prefer AP's board, that's fine too — just be consistent and cite it.

**Recommendation:** one chapter done completely: **"Force" or "Friction"**, then a 2nd chapter only after everything else works.

## 2. Content per chapter (target sizes)
| Item | Count | Notes |
|---|---|---|
| Concept cards | 6–8 | ≤120 words each, 1 everyday example, 1 simple diagram |
| Questions | 30–40 | ~5 per concept, 3 difficulty levels, MCQ + true/false + fill-in |
| Misconceptions | 8–12 | Each wrong MCQ option maps to one |
| Pre-generated audio | 1 per card | Gnani TTS, generated once, static files |
| "Common doubts" | 10 | Pre-answered and cached → instant + offline |

## 3. Writing rules (Telugu)
- Write **natively in Telugu**, don't translate English sentences word by word.
- Simple spoken-standard Telugu, short sentences; Telangana-familiar examples (bullock cart, borewell motor, kabaddi, cycling on a mud road, grinding stone).
- Science term in Telugu with English in brackets the first time: బలం (force), ఘర్షణ (friction), పీడనం (pressure).
- Use the **same terms as the state textbook** so the learner isn't confused in the exam.
- Get a native Telugu speaker (ideally a teacher) to review wording — mention this review in the pitch.

## 4. Example structure (fill in your own content)
**Concept card**
```
concept_id: friction-what-is
title_te: ఘర్షణ అంటే ఏమిటి?
card_text_te: <your original ≤120-word explanation>
example_te: <e.g., why a cycle slows down on a mud road>
check_question_te: <1 quick question>
syllabus_ref: <chapter number + learning outcome code from SCERT book>
```

**Question with misconception mapping**
```
question_id: friction-q03
concept_id: friction-what-is
difficulty: 1
stem_te: <question>
options: [A, B, C, D]
correct: B
explanation_te: <why B is correct, in simple Telugu>
option_misconception: { A: "friction-only-on-rough", C: "friction-needs-motion", D: "friction-is-not-a-force" }
```

**Misconception**
```
misconception_id: friction-is-not-a-force
description_te: <"Friction is just roughness, not a force">
fix_hint_te: <short correction with an example>
```

## 5. Using AI for content (inside Codebenders) — safely
- Allowed approach: use Codebenders to *draft* content from the **learning outcomes**, then **you review and edit** every item. Log the prompts (see `07-codebenders-usage.md`).
- Don't paste textbook paragraphs in and ask for a rewrite; that's still copying. Work from the learning outcomes and general science knowledge.
- Check every fact — wrong science in front of judges is fatal.

## 6. Attribution
`content/SOURCES.md`: list the syllabus document (URL, date checked), any openly licensed images (licence + author), and a line saying "All explanations and questions are original content written for this project."
