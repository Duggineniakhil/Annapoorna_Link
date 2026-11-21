# 01 — Problem & User Clarity
**Product:** Vidya Nestham (విద్యా నేస్తం — "Learning Friend")
**Problem Statement 3 — The Last-Mile Tutor** · Telugu · Class 8 · Science (Telangana State Board)

> Judging criterion: **Problem and User Clarity — 20%**. This doc answers: *who exactly, what exactly hurts, why existing options fail, and what "solved" looks like.*

---

## 1. One-line problem
A Class 8 government-school student in rural Telangana studying Science in Telugu medium has **no one to ask when they don't understand**, and almost every digital learning tool assumes English, a personal smartphone and steady data.

## 2. Primary user (persona)

### Lakshmi, 13 — Class 8, ZPHS (Zilla Parishad High School), a village in Nalgonda district
| | |
|---|---|
| Medium | Telugu medium |
| School | 1 Science teacher covering Classes 6–10; periods are often missed |
| Phone | Shares her father's ₹7,000 Android phone (2 GB RAM, 32 GB, Android 10) with her mother and younger brother |
| Data | 1–1.5 GB/day pack shared by the family, mostly used by father in the evening; network drops to 2G in the house |
| When she studies | 7–9 PM, after the father is home with the phone |
| Typing | Can read Telugu well; typing Telugu on the keyboard is slow and frustrating; types English letters badly |
| Parents | Father: agricultural labourer, studied till Class 5. Mother: can read Telugu slowly. Neither can help with Science |
| Goal | Pass the Summative Assessment exams, understand the lesson, not feel embarrassed in class |
| Fear | Asking the teacher "silly" questions in front of the class |

### Secondary users
| User | What they need | How we serve them |
|---|---|---|
| **Parent (Ramesh, father)** | "Is my daughter actually studying? Is she improving?" — in Telugu, in 10 seconds, no reading-heavy dashboards | Parent view: big icons, green/yellow/red per chapter, voice summary read aloud in Telugu |
| **Teacher / volunteer (Srinivas sir, or an NGO volunteer)** | Which students are weak in which concept, so class time goes where it matters | Teacher view: class-wise weak-concept list (sample data) |
| **Younger sibling on the same phone** | Their own progress not mixed with sister's | Profile picker with avatar + 4-digit PIN |

## 3. The pain, step by step (Lakshmi's evening today)
1. Teacher covered "Force" in 2 rushed periods. Lakshmi didn't understand *why friction is a force*.
2. At home, no one can explain. The textbook paragraph is dense.
3. She opens YouTube → videos are in English or Hindi, or Telugu videos are 25 min long and eat 300 MB.
4. She tries a chatbot → must type in English; the answer is in English with words she doesn't know.
5. Data runs out mid-video. She gives up, memorises the answer by rote for the exam.

## 4. Root causes
| Root cause | Evidence to show judges (cite publicly available sources, verify before submission) |
|---|---|
| Teacher shortage in government schools | UDISE+ reports on single-teacher schools / pupil-teacher ratios; ASER reports |
| Learning gaps in Classes 6–8 | ASER / NAS (National Achievement Survey) state report cards for Telangana |
| Content is English-first | Most ed-tech apps' content language options |
| Shared, low-end phones & limited data | ASER 2021+ reports on smartphone access in rural households (access ≠ personal ownership) |
| Typing in Telugu is hard | Our own observation / interviews (see §7) |

> ⚠️ Put **real, cited numbers** only after checking the source. Never invent statistics in the pitch — judges notice.

## 5. Why existing options fail Lakshmi
| Option | Why it fails |
|---|---|
| Big ed-tech apps | English-first, subscription-priced, heavy video, need personal phone |
| YouTube | Data-heavy, not syllabus-aligned, no doubts answered, distracting |
| Generic AI chatbots | Typing required, English bias, not syllabus-aware, no progress tracking, no guardrails for minors |
| Private tuition | ₹300–800/month, often not available in the village |
| DIKSHA / state e-content | Useful content, but one-way; no personal doubt-solving or adaptive practice |

## 6. What "solved" looks like (success metrics)
| Metric | Target for the demo / pilot |
|---|---|
| Time from opening the app to asking a doubt by voice | < 15 seconds |
| Data used per 30-minute study session (text mode) | < 5 MB |
| Doubt answered in simple Telugu, syllabus-aligned | Answer cites the chapter/concept |
| Weak-concept improvement | Mastery on a weak concept rises after 5 adaptive questions |
| Parent understands progress | Parent view understood in < 10 seconds without reading English |
| Works offline | Lessons + practice work with airplane mode on; progress syncs later |

## 7. User-research plan (do a quick version during the hackathon)
In 36 hours you can't run a field study — but you can do **3–5 quick calls** (cousins, neighbours' kids, a government-school teacher you know):
- "When you don't understand a Science lesson, what do you do?"
- "Whose phone do you study on? When?"
- "Can you type in Telugu? Show me." (note time taken)
- Teacher: "Which Class 8 Science topics do students struggle with most?"

Record 3–4 **quotes** (anonymised, with consent) and put them in the pitch. This is the single cheapest way to win the 20% criterion.

## 8. Scope decisions (and why)
| Decision | Reason |
|---|---|
| Telugu only, end to end | Problem statement requires one language end-to-end, not translated English |
| Class 8 Science, Telangana State Board | Real state-board syllabus requirement |
| 1 chapter fully, 2nd chapter if time | Depth beats breadth in a 36-hour demo |
| Voice-first, text optional | Typing is the biggest barrier |
| Shared-phone profiles | Phone is shared by 3 family members |
| Offline-first PWA, no app install | No Play Store download (saves data), works on low-end Android |

## 9. Guardrails (from the problem statement)
- Learners may be **minors** → collect only first name/nickname, class, avatar. No phone number, no school ID, no Aadhaar, no photos of faces.
- Test **only with sample learner profiles** (see `08-quality-and-testing.md`).
- **No copied textbook content** — write original explanations aligned to the syllabus learning outcomes; use openly licensed material only, with attribution.
- AI tutor stays **on-syllabus and age-appropriate**; refuses off-topic/unsafe requests politely in Telugu.
