# 08 — Quality, Testing & Demo Data
> Supports **Working Product (30%)** and **Build Quality (15%)**. A product that works smoothly during judging beats a bigger one that breaks.

---

## 1. Demo accounts (synthetic; see `04-sample-data-plan.md`)
| Role | Account | Use in tests |
|---|---|---|
| Donor | Sri Sai Caterers (Kukatpally) | Post 150 meals after a wedding |
| Donor | Green Valley Hostel Mess (Ameerpet) | Daily surplus; room-temperature items |
| Receiver | Asha Night Shelter (Mehdipatnam), veg-only | Must **not** get non-veg offers |
| Receiver | Annadanam Community Kitchen (Begumpet) | Accepts the hero offer |
| Volunteer | Ravi K. (two-wheeler, ≤ 40 meals) | Capacity limits |
| Volunteer | a car volunteer (≤ 150 meals) | Large listings |
| Sponsor | Demo CSR Sponsor | City dashboard, demo scenario |

## 2. Acceptance tests (run on real phones before the final push)
| # | Test | Pass criteria |
|---|---|---|
| T1 | Open the live URL on a mid-range Android phone over mobile data | Usable in < 5 s |
| T2 | Demo login for each role | Each lands on its own home; other roles' URLs redirect |
| T3 | Donor posts 150 meals veg biryani + dal, hot | Done in **< 60 s**; safety card shown; pickup-by suggested |
| T4 | Try to set pickup-by later than allowed | Blocked in the UI; API returns `PICKUP_BY_TOO_LATE` |
| T5 | Post a non-veg listing | Veg-only shelter is **not** offered it |
| T6 | Receiver sees the offer | Match reasons, distance, countdown, safety card |
| T7 | Receiver declines | Next receiver gets the offer within seconds |
| T8 | Let an offer time out (10 min; shorten via config for testing) | Cascades to the next receiver |
| T9 | Receiver accepts | Delivery code visible only to that receiver; donor sees "Claimed" live |
| T10 | Volunteer accepts the task, enters a wrong pickup code | Rejected with tries left; 5 wrong → locked |
| T11 | Correct pickup code → correct delivery code | Status goes picked up → delivered live for all three roles |
| T12 | Listing not picked up before pickup-by | Becomes Expired; "Do not use" message; no impact counted |
| T13 | Impact after delivery | Meals/kg/CO₂e increase; assumptions panel visible |
| T14 | Language toggle | Every visible string switches EN ↔ TE |
| T15 | Run the wedding-night demo scenario | Full flow in ~2 minutes, live |
| T16 | Voice post (P1) | Spoken description prefills the form; nothing auto-posts |
| T17 | Check API responses as each role | No codes leaked to the wrong role; no secrets anywhere |
| T18 | Search the UI text | No "safe/certified/approved", no tax or legal claims |
| T19 | Lighthouse mobile | PWA ✓, Performance ≥ 80 (screenshot) |

## 3. Automated tests
- **Matching engine:** eligibility, scoring, reasons, volunteer choice.
- **State machine:** valid/invalid transitions, concurrent actions, codes and lockout.
- **Guidance:** windows per storage, overrides, strictest item wins.
- **Impact:** formulas, zero cases, city = sum of donors.
- **API contracts:** every response validates against its zod schema.
- **Full-flow integration test:** post → offer → accept → task → pickup → deliver.

## 4. Demo-day reliability
- [ ] Backend awake before judging (free tiers sleep; open `/api/health` first)
- [ ] `npm run demo:reset` restores clean demo data
- [ ] The demo scenario works on the live deployment
- [ ] Rate limits high enough for judges
- [ ] Gnani / AI-model credits sufficient (voice post is optional, so the demo works without it)
- [ ] Backup screen recording of the full flow
