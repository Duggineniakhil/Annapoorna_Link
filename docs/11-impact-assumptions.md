# 11 — Impact Assumptions (how every number is calculated)
> PS2 requires *"an impact view showing meals saved and food waste avoided, **with the assumptions behind each number**"*.
> These formulas power the donor and city dashboards and the "How we calculate this" panel.

> ⚠️ Values marked **[V]** must be checked against a published source and cited in the app and pitch. Values marked **[A]** are our assumptions, and the app shows them as such.

---

## 1. Definitions
| Term | Definition |
|---|---|
| **Meal** | One plate/portion as entered by the donor. If the donor enters kg, meals = kg ÷ **0.4 kg per meal** [A] |
| **Meals saved** | Meals **confirmed delivered** by the volunteer with the receiver's delivery code (not just posted) |
| **Food waste avoided (kg)** | Meals delivered × **0.4 kg** [A], or the delivered kg if the donor entered kg |
| **CO₂e avoided (kg)** | Food waste avoided (kg) × **emission factor** [V] (kg CO₂e per kg of food waste avoided; pick one published source, e.g. a UNEP/FAO/WRAP figure, and cite it) |
| **On-time rate** | Delivered listings picked up before pickup-by ÷ all delivered listings |
| **Time to claim** | `claimed_at − posted_at` (median) |
| **Rescue rate** | Delivered listings ÷ all posted listings (excluding cancelled) |

## 2. What we deliberately don't count
- Listings that expired or were cancelled: zero impact.
- Meals posted but not confirmed delivered.
- Any "people fed" claim. We report meals delivered, not people.

## 3. Shown in the app ("How we calculate this" panel)
```
Meals saved          = meals confirmed delivered (handover code)
Food waste avoided   = meals × 0.4 kg per meal (assumption)
CO₂e avoided         = kg avoided × <factor> kg CO₂e/kg (source: <citation>)
Only delivered food counts. Expired or cancelled listings count as zero.
```
Each value has a small "assumption" or "source" tag that links here.

## 4. Configuration
All factors live in one server config (`server/src/impact/config.ts`): `KG_PER_MEAL`, `CO2E_PER_KG`, `CO2E_SOURCE`. Changing them recalculates every dashboard, and the panel always shows the current values.

## 5. Checks
- Unit tests for each formula, including kg-entered listings and zero-impact cases.
- The city totals equal the sum of the per-donor totals.
