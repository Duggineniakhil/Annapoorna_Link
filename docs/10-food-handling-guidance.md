# 10 — Food Handling Guidance (rules shown on every listing)
> PS2 requires **handling and safety information for each listing: time window, storage and allergens**, and says the platform **does not certify that food is safe**.
> These rules drive the **pickup-by suggestion**, the **safety card** and **auto-expiry**. They are conservative defaults for the demo.

> ⚠️ **Verify before the pitch:** check every rule against a published source, e.g. the WHO *Five Keys to Safer Food* and FSSAI guidance on food donation and surplus food [V]. Have a food-safety-aware person review the wording. Never present these as certification.

---

## 1. Core principles (from widely published food-safety guidance [V])
- Keep cooked food **hot** (above about 60 °C) or **chilled** (below about 5 °C).
- Don't leave cooked food at **room temperature for more than about 2 hours**.
- Keep raw and cooked food separate; use clean, covered containers.
- If in doubt, don't serve it.

## 2. Maximum safe window by storage (default rules) [V]
| Storage | Max time from `cooked_at` to pickup-by | Max total until serving | Guidance shown (EN) |
|---|---|---|---|
| **Hot** (kept hot in containers/chafing dishes) | 3 h | 4 h | Keep covered and hot. Deliver and serve quickly. |
| **Room temperature** | 1.5 h | 2 h | Do not keep at room temperature for long. Serve within 2 hours of cooking. |
| **Chilled** (refrigerated) | 6 h | 12 h | Keep chilled during transport. Serve soon after delivery. |

**Category overrides (stricter):**
- `dairy_based` (curd rice, raita, payasam) and `salad_cut_fruit` at room temperature: **1 h** to pickup-by.
- Any **non-veg** item at room temperature: **1 h** to pickup-by.

**Rules the server enforces:**
- `pickup_by ≤ cooked_at + max window` for the strictest item in the listing.
- The donor may choose an earlier time, never a later one.
- At `pickup_by` without pickup, the listing becomes **Expired**, with the message "Do not use. The safe window has passed."

## 3. Safety card (on every listing, EN + TE)
- 🔥 / 🌡️ / ❄️ storage icon and label
- ⏱️ countdown to pickup-by; after pickup, a countdown to "serve by"
- 🥗 veg / 🍗 non-veg
- ⚠️ allergens (nuts, peanuts, dairy, gluten, egg, seafood, soy, sesame)
- 📝 guidance text from the table above
- ℹ️ disclaimer:
  - **EN:** "Annapoorna Link connects donors and receivers. It does not certify food safety. Receivers should check food before serving."
  - **TE (review with a native speaker):** "అన్నపూర్ణ లింక్ దాతలను, స్వీకర్తలను కలుపుతుంది. ఆహారం సురక్షితమని ధృవీకరించదు. వడ్డించే ముందు స్వీకర్తలు ఆహారాన్ని తనిఖీ చేయాలి."

## 4. What the app must never say
- That food is "safe", "certified", "hygienic" or "approved".
- That donors get tax deductions, legal protection or any other benefit.
- Medical advice of any kind.

## 5. Data for the `guidance_rules` table
One row per (food_category, storage): `max_window_minutes`, `serve_within_minutes`, `guidance_en`, `guidance_te`. Member B seeds it from this doc; Member A displays it.
