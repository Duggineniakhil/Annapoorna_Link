# 02 — Product Specification
**Annapoorna Link (అన్నపూర్ణ లింక్)**: a web app that gets surplus food from Hyderabad's caterers, wedding halls, hostel messes and restaurants to nearby shelters and community kitchens, before it spoils.

---

## 1. Mandatory requirements → our feature (show this table in the pitch)
| Problem statement "Must Include" | Our feature | Priority |
|---|---|---|
| A donor flow that takes under a minute: what food, how much, pickup-by time | **Quick Post**: saved venue, food-type chips, quantity stepper, pickup-by auto-suggested from handling rules, one-tap "repeat last post". Optional **voice post** (English/Telugu) that fills the form | P0 (voice P1) |
| Smart matching of surplus to receivers and volunteers by distance, quantity, timing and need | **Matching engine**: ranks receivers on distance, capacity, today's need, food preferences (veg-only), open hours and arrival before pickup-by; picks the nearest available volunteer. **Shows why** each match was chosen | P0 |
| Pickup coordination with live status: posted → claimed → collected → delivered | **Live status timeline** for all three parties, updated in real time; 4-digit **handover codes** confirm collection and delivery | P0 |
| Impact view: meals saved and food waste avoided, with assumptions behind each number | **Impact dashboards** for donors and the city/sponsor, with an "How we calculate this" panel listing every assumption; printable monthly donor report | P0 |
| Handling and safety info per listing: time window, storage, allergens | **Safety card** on every listing: storage (hot/room/chilled), safe time window and countdown, allergens, veg/non-veg, handling guidance, and a clear "we don't certify food safety" note | P0 |
| Business case for why donors and sponsors would pay | Donor Pro plan (impact reports, multiple venues, scheduled pickups) and sponsor dashboards (see `06-business-model.md`) | Pitch |

## 2. Roles and screens (English + Telugu toggle)
| Role | Screens |
|---|---|
| **All** | Demo login (pick role + demo account) · Language toggle (EN / తెలుగు) · Notifications · About & safety note |
| **Donor** (caterer, wedding hall, hostel mess, restaurant) | D1 Home (active listings + "Post surplus") · D2 Quick Post · D3 Listing detail (status timeline, matched receiver and volunteer, pickup code) · D4 My impact · D5 Venues & templates |
| **Receiver** (NGO, community kitchen, shelter) | R1 Incoming offers (accept/decline with countdown and match reasons) · R2 Offer detail (safety card, ETA, delivery code) · R3 Today's needs (meals needed, veg-only, intake hours) · R4 Received history |
| **Volunteer** | V1 Available tasks (nearby, with distance and deadline) · V2 Active task (step-by-step: go to donor → enter pickup code → go to receiver → enter delivery code) · V3 My history |
| **Sponsor / city view** | S1 City impact dashboard (meals, kg, CO₂e, by area and donor type, with assumptions) · S2 Map of activity (area-level) |

## 3. Core flows

### Flow A: Post surplus in under a minute (demo hero flow)
1. Donor taps **Post surplus**. The venue is preselected.
2. Picks food items with chips (e.g., Veg biryani, Dal, Curd rice), each with a quantity in **plates/meals** (or kg).
3. Picks **storage**: Hot / Room temperature / Chilled. The app **suggests a pickup-by time** from the handling rules (e.g., room temperature → within 2 hours of cooking end). The donor can make it earlier, never later.
4. Ticks **veg / non-veg** and **allergens** (nuts, dairy, gluten, egg, seafood…).
5. Taps **Post**. A timer shows how long posting took (aim: < 60 s).
6. Optional: **🎤 Voice post**. Say *"150 plates veg biryani and dal, cooked at 9:30, kept hot"*; the form fills itself for the donor to confirm.

### Flow B: Matching and offers
1. The engine ranks eligible receivers (see §4) and **offers** the listing to the best match, with a 10-minute accept window.
2. The receiver sees the offer: food, quantity, distance, pickup-by, safety card, and **why they were matched** ("2.1 km away · needs 120 meals today · veg accepted · open till 11 PM").
3. Accept → a volunteer is assigned. Decline or timeout → the next best receiver is offered, up to 5. After that, the listing is opened to all nearby receivers.
4. Large quantities can be split across two receivers (P1).

### Flow C: Pickup and delivery with live status
`Posted → Offered → Claimed → Volunteer assigned → Picked up → Delivered` (terminal: `Expired`, `Cancelled`)
1. The volunteer accepts the task and sees the donor's area, the quantity and the deadline. "Navigate" opens a map link.
2. At the donor: the donor shows a **4-digit pickup code**; the volunteer enters it → **Picked up**.
3. At the receiver: the receiver shows a **4-digit delivery code**; the volunteer enters it and confirms the quantity → **Delivered**.
4. Every change appears instantly for all three parties, with timestamps.
5. If the pickup-by time passes before pickup, the listing becomes **Expired** and the guidance says not to use it.

### Flow D: Impact
1. Donor's **My impact**: meals saved, kg of food waste avoided, CO₂e avoided, this week and this month, plus a downloadable monthly report.
2. **City dashboard** for sponsors: totals by area and donor type, delivery rate before pickup-by, median time to claim.
3. Every number has a **"How we calculate this"** panel with the assumptions (see `11-impact-assumptions.md`).

## 4. Matching engine (simple, explainable)
**Eligible receivers:**
- accept the food type (veg-only respected) and have no allergen exclusion for this listing
- are open at the estimated arrival time
- have remaining need today ≥ 20 meals, or ≥ 25% of the listing
- can be reached before **pickup-by + travel time**, with a 15-minute buffer

**Score** (higher is better):
`score = 0.4 × proximity + 0.3 × need + 0.2 × timeSlack + 0.1 × reliability`
- proximity = 1 − distance / 10 km (clamped)
- need = min(1, remaining meals needed / listing meals)
- timeSlack = min(1, minutes of slack / 60)
- reliability = the receiver's past accept-and-receive rate (starts at 0.8)

**Volunteer:**
- available now
- vehicle capacity ≥ listing size
- nearest to the donor
- can reach donor → receiver before pickup-by

**Explanation:** the top 3 contributing reasons are returned in English and Telugu and shown on the offer.

## 5. Safety & handling (shown on every listing)
- Storage type and **safe window**, with a live countdown to pickup-by.
- Guidance text (e.g., "Keep hot food covered and hot; deliver and serve quickly").
- Allergens and veg/non-veg flags.
- Note in English and Telugu: *"Annapoorna Link connects donors and receivers. It does not certify food safety. Receivers should check food before serving."*
- **No tax or legal benefit claims** anywhere in the app.

## 6. Out of scope (say this explicitly; it shows focus)
Real GPS tracking · payments · real addresses or real people's data · native app-store apps · cities other than Hyderabad · packaged-food inventory.

## 7. Guardrails checklist (in-product)
- [ ] Synthetic data only; area-level, fictional locations; "Demo data" label
- [ ] Safety card + disclaimer on every listing; expired listings clearly marked
- [ ] No tax or legal claims
- [ ] Handover codes visible only to the right role
- [ ] API keys only on the server
