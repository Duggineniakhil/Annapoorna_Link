# 06 — Business Viability
> Judging criterion: **Business Viability, 25%** (the second-largest weight).
> PS2 asks for *"a business case for why donors and sponsors would pay"* and *"Who pays: donors for savings and impact reports, CSR sponsors or city authorities?"*

> ⚠️ Every number marked **[A]** is an **assumption** to check or adjust. Every number marked **[V]** must be **verified from a public source** before it goes in the pitch. Show assumptions openly; judges reward honest maths.

> At the kick-off, the organisers said business viability isn't only revenue: **social impact counts too** (doc 15). Pitch both a sustainable model *and* measurable impact.

---

## 1. Business model in one line
**Free for receivers and volunteers. Donors pay for convenience and impact reports. CSR sponsors and city authorities fund citywide operations and get verified impact dashboards.**

## 2. Who pays and why
| Payer | Why they'd pay | What they buy |
|---|---|---|
| **Caterers & wedding halls** (launch segment) | Lower disposal costs; a "zero-waste events" story to sell to clients; staff time saved | **Donor Pro**: multiple venues, scheduled event pickups, branded monthly impact certificate/report for clients |
| **Hostel / college messes** (institutions) | Daily routine pickups; sustainability reporting for the institution | Institution plan (per mess per month) |
| **Restaurants** | Quick closing-time pickups; brand value | Free basic plan → Pro |
| **CSR sponsors** (companies) | Need measurable, reportable social and environmental impact | City or area sponsorship: funds volunteer incentives and operations; gets a dashboard and quarterly verified report |
| **City authorities** (later) | Less food waste reaching landfills | City licence + data on waste diverted |

**Free tier:** any donor can post and get pickups. Pro adds the features above. Receivers and volunteers never pay.

## 3. Pricing [A]
| Plan | Price | Includes |
|---|---|---|
| Donor Free | ₹0 | Posting, matching, pickups, basic impact counter |
| **Donor Pro** | ₹999 / venue / month [A] | Scheduled pickups, multiple venues, monthly impact report & certificate, priority matching |
| Institution (hostel mess) | ₹1,499 / mess / month [A] | Daily scheduled pickup, reports for the institution |
| **CSR area sponsorship** | ₹3–5 lakh / area / year [A] | Operations + volunteer incentives in one area, branded dashboard, quarterly report |

## 4. Unit economics (fill in with real costs)
| Cost item | Formula | ₹ / month |
|---|---|---|
| Hosting + DB | fixed | ___ |
| Voice post (Gnani + AI model) | posts × cost per post [V] | ___ |
| Maps | OpenStreetMap tiles within usage policy, or a paid tile provider at scale [V] | ___ |
| Volunteer incentives (optional, sponsor-funded) | deliveries × ₹__ [A] | ___ |
| Field ops (onboarding NGOs, caterers) | people × salary | ___ |

**Cost levers:**
- matching and impact maths run on our server, with no paid AI per listing
- voice posting is optional and capped
- the PWA needs no app-store fees

## 5. Market size (calculate with verified data)
| Layer | How to calculate | Value |
|---|---|---|
| **TAM** | Caterers + function halls + institutional messes + restaurants in Indian metros [V] × average plan price | ___ |
| **SAM** | Same, for Hyderabad [V] | ___ |
| **SOM (Year 1)** | e.g., 150 Pro donors × ₹999 × 12 + 3 CSR area sponsorships [A] | ___ |

**Impact sizing:** use a verified food-waste source, e.g. the UNEP Food Waste Index Report [V], and caterer interviews (§7 of doc 01) for surplus per event.

## 6. Why we win
1. **Built for the late-night, time-critical case**: under-a-minute posting, instant matching, and an offer cascade so food doesn't wait on one phone call.
2. **Explainable matching**: receivers see why they got an offer; fewer declines.
3. **Trust by design**: safety cards, handover codes, and a clear timeline for every listing.
4. **Verified impact data**: what CSR sponsors and cities need to justify spending.
5. **English + Telugu**: works for owners, kitchen staff and volunteers alike.

## 7. Impact metrics we report
- Meals delivered, kg of food waste avoided, CO₂e avoided (assumptions in `11-impact-assumptions.md`)
- % of listings delivered before pickup-by; median time to claim and to deliver
- Active donors, receivers and volunteers by area and donor type

## 8. Roadmap
| Phase | Timeline [A] | Scope |
|---|---|---|
| Hackathon MVP | Now | Hyderabad, 3 donor types, full post → deliver flow, impact dashboards |
| Pilot | 0–3 months | 10 caterers/halls + 5 receivers in 2–3 areas; real users, with consent |
| Scale 1 | 3–12 months | All of Hyderabad; CSR area sponsorships; scheduled pickups |
| Scale 2 | 12–24 months | More cities; city-authority partnerships; WhatsApp notifications |

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Food safety incident | Safety cards, time limits, auto-expiry, clear "we don't certify" note, receivers check before serving; follow FSSAI food-donation guidance [V] |
| No volunteer available late at night | Volunteer pool + receiver self-pickup option + sponsor-funded paid riders |
| Donors stop posting | Under-a-minute posting, "repeat last post", visible impact and certificates |
| Data privacy | Area-level locations, no personal data in reports |

## 10. The 30-second business pitch
> "After every wedding in Hyderabad, plates of good food go into the bin, while shelters a few kilometres away run short. Annapoorna Link lets a caterer post surplus in under a minute, finds the best nearby shelter and volunteer, and tracks the food until it's delivered. Receivers use it free. Caterers and halls pay ₹999 a month for scheduled pickups and impact certificates they can show clients. CSR sponsors fund whole areas and get verified meals-saved reports. Every delivery feeds a live impact dashboard."
