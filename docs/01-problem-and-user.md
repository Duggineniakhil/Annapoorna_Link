# 01 — Problem & User Clarity
**Product:** Annapoorna Link (అన్నపూర్ణ లింక్): connecting surplus food to people who need it, before it spoils.
**Problem Statement 2: Rescue the Surplus** (Society & Environment) · **Hyderabad** · Donors: **caterers & wedding halls** (launch segment), **hostel & college messes**, **restaurants**

> Judging criterion: **Problem and User Clarity, 20%**. This doc answers: *who exactly, what exactly goes wrong, why existing options fail, and what "solved" looks like.*

---

## 1. One-line problem
Every night in Hyderabad, caterers, wedding halls, hostel messes and restaurants throw away edible food. A few kilometres away, shelters and community kitchens run short. **Both sides want to help, but there is no fast, reliable way to connect them before the food spoils.**

## 2. Users (personas)

### Donor: Srinivas, 42, owner of a mid-size catering business in Kukatpally
| | |
|---|---|
| Business | Weddings and functions, 300–1,500 plates per event, 4–8 events a week in season |
| Surplus | Usually 5–15% of food prepared, known only at the **end of the event (10–11 PM)** |
| Today | Calls 2–3 NGO numbers saved in his phone. Often nobody answers late at night. The food goes into bins, and he pays for its disposal |
| Constraints | Busy and tired at the end of an event; has **under a minute** to deal with this; staff speak Telugu |
| Wants | Food goes to people, not bins; no extra work; something to show clients ("we donate leftovers") |
| Fears | Being blamed if someone falls sick; unreliable pickups that leave food on his premises |

### Receiver: Fatima, 35, coordinator at a community kitchen and shelter in Mehdipatnam
| | |
|---|---|
| Serves | ~120 people a night; needs vary daily |
| Today | Relies on WhatsApp groups and phone calls; often hears about surplus too late or too far away |
| Constraints | Can only accept **vegetarian** food on some days; closes intake at 11 PM; has no vehicle |
| Wants | Offers that match what she can actually use, with enough notice and a clear pickup plan |

### Volunteer: Ravi, 21, engineering student with a two-wheeler
| | |
|---|---|
| Availability | Evenings, 2–3 nights a week |
| Today | Joins NGO WhatsApp groups; messages get lost; doesn't know where to go or whom to meet |
| Wants | One clear task: where to pick up, where to deliver, how much, by when |

### Secondary: hostel mess manager, restaurant manager, CSR sponsor
- **Hostel/college mess manager:** daily, predictable surplus after dinner; wants a routine pickup.
- **Restaurant manager:** smaller daily surplus at closing time; wants it quick.
- **CSR sponsor / city official:** wants trustworthy numbers on meals saved and waste avoided.

## 3. The pain, step by step (a wedding night today)
1. **10:30 PM:** the reception ends. About 150 plates of veg biryani and curries are left over.
2. Srinivas calls two NGO numbers. One doesn't pick up; the other is 18 km away and can't send anyone.
3. His staff need to pack up and leave the hall by midnight.
4. **11:30 PM:** the food goes into the bin, and disposal costs him money.
5. 6 km away, Fatima's shelter served smaller portions that night.

## 4. Root causes
| Root cause | Evidence to show judges (cite public sources; verify before submission) |
|---|---|
| Surplus is **time-critical and unpredictable** (known only at the end of an event) | Interviews with caterers and hall managers (see §7) |
| **No shared, real-time view** of who needs food now and who can transport it | NGO coordinator interviews |
| Coordination runs on **phone calls and WhatsApp groups**, which fail late at night | Interviews |
| **Trust gaps:** donors fear liability; receivers fear unsafe food | Interviews; FSSAI food-donation guidance [V] |
| Food waste is large and harms the climate | UNEP Food Waste Index Report [V]; FSSAI "Save Food Share Food" initiative [V] |

> ⚠️ Put **real, cited numbers** in the pitch only after checking the source. Never invent statistics.

## 5. Why existing options fail
| Option | Why it fails |
|---|---|
| Calling NGOs directly | Slow, depends on someone answering, no matching on distance, need or capacity |
| WhatsApp groups | Messages get buried; no status; no accountability for who's picking up; no impact record |
| Big food-rescue organisations | Valuable, but often limited to fixed routes or partner donors and not available for ad-hoc late-night surplus |
| Throwing it away | Wastes food and money, and harms the environment |

## 6. What "solved" looks like (success metrics)
| Metric | Target for the demo / pilot |
|---|---|
| Time for a donor to post surplus | **< 60 seconds** |
| Time from posting to a receiver accepting | < 10 minutes (median) |
| Listings delivered **before their pickup-by time** | > 90% |
| Donor effort after posting | Hand over food + confirm a 4-digit code, nothing else |
| Impact visible | Meals saved and kg of waste avoided, with the assumptions shown |
| Safety info present | 100% of listings show time window, storage and allergens |

## 7. User-research plan (quick version during the hackathon)
Make **3–5 short calls** to a caterer, a function-hall manager, a hostel mess manager, an NGO or shelter coordinator, and a student volunteer:
- Donors: "What happens to leftover food after an event? Who decides? How much time do you have?"
- Receivers: "How do you hear about surplus today? What food can't you accept? When do you close?"
- Volunteers: "What would make you pick up food at 10:30 PM?"

Record 3–4 **anonymised quotes** with consent and use them in the pitch. This is the cheapest way to win the 20% criterion.

## 8. Scope decisions (and why)
| Decision | Reason |
|---|---|
| **Hyderabad** only, with synthetic area-level locations | PS2: pick one city; our team knows it |
| Donor types: caterers & wedding halls (launch), hostel messes, restaurants | Event surplus is large and predictable in timing; messes and restaurants add daily volume |
| Receivers: NGOs, community kitchens, shelters | They have the need and can redistribute food safely |
| Volunteers with two-wheelers or cars | Most receivers have no vehicle |
| English + Telugu interface | Owners and NGO staff use English; kitchen staff and volunteers often prefer Telugu |
| Web app (PWA), no app-store install | Works on any phone instantly; easy to share by link |
| Handover codes instead of live GPS tracking | Simple, private, and works on weak networks |

## 9. Guardrails (from the problem statement)
- **We connect people. We do not certify that food is safe.** Every listing shows handling guidance, storage and time limits, and the app says so clearly.
- **No promises of tax or legal benefits** to donors.
- **Sample or synthetic data only.** No real addresses or personal details; locations are area-level and fictional.
- Allergen and veg/non-veg information is required on every listing.
