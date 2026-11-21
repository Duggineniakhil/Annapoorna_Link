# 04 — Sample Data Plan (Hyderabad, synthetic)
> PS2 guardrail: **use sample or synthetic data only, and don't publish real addresses or personal details.** A believable, consistent demo city is what makes matching and the impact view convincing.

---

## 1. Rules for all sample data
- **Fictional organisation and person names.** Don't use real businesses or NGOs.
- **Area-level locations only:** a neighbourhood name plus a coordinate jittered within ~500 m of the area's centre. No street addresses.
- **No real phone numbers or emails.** Use `+91 90000 0XXXX` style placeholders and `@example.org`.
- Every screen that shows sample data carries a small **"Demo data"** label.
- The seed is **deterministic** (fixed random seed), so the demo is the same every time.

## 2. Areas (Hyderabad neighbourhoods)
Kukatpally · Madhapur · Gachibowli · Ameerpet · Begumpet · Secunderabad · Mehdipatnam · Tolichowki · Dilsukhnagar · LB Nagar · Uppal · Kondapur

Use approximate public centre coordinates for each area and jitter around them. Check each centre on OpenStreetMap.

## 3. Organisations to seed
| Type | Count | Examples (fictional) | Typical surplus / need |
|---|---|---|---|
| Caterer | 4 | "Sri Sai Caterers", "Royal Feast Caterers" | 50–300 meals after events, 9–11:30 PM |
| Wedding / function hall | 3 | "Lakshmi Gardens Function Hall" | 100–400 meals after events, 10 PM–midnight |
| Hostel / college mess | 3 | "Green Valley Hostel Mess" | 20–60 meals daily after dinner, 9:30–10:30 PM |
| Restaurant | 4 | "Spice Route Restaurant" | 10–40 meals at closing, 10:30–11:30 PM |
| Receiver: shelter | 3 | "Asha Night Shelter" | 60–150 meals/night; some veg-only |
| Receiver: community kitchen | 3 | "Annadanam Community Kitchen" | 100–250 meals/night; intake till 11 PM |
| Receiver: NGO | 3 | "Hope Street Foundation" | 50–200 meals; flexible |
| Volunteers | 10 | "Ravi K.", "Priya M." | 6 on two-wheelers (≤ 40 meals), 4 with cars (≤ 150 meals) |
| Sponsor | 1 | "Demo CSR Sponsor" | City dashboard access |

## 4. Demo accounts (one tap each on the demo login screen)
| Role | Account | Why it's in the demo |
|---|---|---|
| Donor | Sri Sai Caterers (Kukatpally) | Hero flow: 150 plates after a wedding |
| Donor | Green Valley Hostel Mess (Ameerpet) | Daily surplus example |
| Receiver | Asha Night Shelter (Mehdipatnam), veg-only | Shows the veg-only rule and match reasons |
| Receiver | Annadanam Community Kitchen (Begumpet) | Accepts the hero offer |
| Volunteer | Ravi K. (two-wheeler, Kukatpally) | Pickup and delivery flow |
| Sponsor | Demo CSR Sponsor | City impact dashboard |

## 5. History to seed (so dashboards aren't empty)
- 30 days of past listings: ~120 listings, ~90% delivered, a few expired and cancelled.
- A realistic mix by donor type and area; more events on weekends.
- Receiver needs for today.
- Times spread between 8:30 PM and midnight.

## 6. Food categories (used by guidance rules and chips)
| Category | Examples | Typical storage |
|---|---|---|
| `rice_dish` | Veg biryani, chicken biryani, pulihora, curd rice | hot / room |
| `curry` | Dal, sambar, paneer curry, chicken curry | hot |
| `bread` | Chapati, naan, puri | room |
| `dry_snack` | Samosa, vada, pakoda | room |
| `sweet` | Gulab jamun, double ka meetha | room / chilled |
| `dairy_based` | Curd rice, raita, payasam | chilled |
| `salad_cut_fruit` | Salad, cut fruit | chilled |

Allergen list: nuts, peanuts, dairy, gluten, egg, seafood, soy, sesame.

## 7. Demo scenario script (seeded "bots")
For the video and for judges, one button runs a timed scenario:
1. 10:31 PM: Sri Sai Caterers posts 150 plates (veg biryani + dal), kept hot.
2. The engine offers it to Annadanam Community Kitchen (2.4 km, needs 180 meals). Bot accepts after 20 s.
3. Volunteer Ravi is assigned. The bot "arrives" and enters the pickup code after 40 s.
4. The bot delivers and enters the delivery code after 60 s.
5. Impact counters update live.

Judges can also do every step by hand by switching demo accounts.
