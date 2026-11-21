// Demo fixtures (fictional, area-level) used by the UI until the mock API handlers land in task A3.
// Names and areas follow docs/04-sample-data-plan.md. Times are relative to page load so countdowns
// look live in the demo.
import type { Impact, Listing, Offer, Org, Task } from "../types/api";

const MIN = 60_000;
const at = (minutesFromNow: number) => new Date(Date.now() + minutesFromNow * MIN).toISOString();

export const ORGS: Record<string, Org> = {
  "org-sri-sai": {
    id: "org-sri-sai",
    type: "donor",
    donor_type: "caterer",
    name: "Sri Sai Caterers",
    area: "Kukatpally",
    lat: 17.4948,
    lng: 78.3996,
  },
  "org-green-valley": {
    id: "org-green-valley",
    type: "donor",
    donor_type: "hostel_mess",
    name: "Green Valley Hostel Mess",
    area: "Ameerpet",
    lat: 17.4375,
    lng: 78.4482,
  },
  "org-spiceroute": {
    id: "org-spiceroute",
    type: "donor",
    donor_type: "restaurant",
    name: "Spice Route Restaurant",
    area: "Madhapur",
    lat: 17.4483,
    lng: 78.3915,
  },
  "org-asha": {
    id: "org-asha",
    type: "receiver",
    name: "Asha Night Shelter",
    area: "Mehdipatnam",
    lat: 17.3959,
    lng: 78.4331,
    veg_only: true,
  },
  "org-annadanam": {
    id: "org-annadanam",
    type: "receiver",
    name: "Annadanam Community Kitchen",
    area: "Begumpet",
    lat: 17.4447,
    lng: 78.4664,
  },
};

const SAFETY = {
  guidance_en: "Keep hot food covered and above 60 °C; serve within 2 hours of pickup.",
  guidance_te: "వేడి ఆహారాన్ని మూతపెట్టి 60 °C పైగా ఉంచండి; తీసుకున్న 2 గంటల్లోపు వడ్డించండి.",
};

function listing(partial: Omit<Listing, "safety" | "created_at" | "posted_in_ms">): Listing {
  return {
    ...partial,
    created_at: at(-20),
    posted_in_ms: 48_000,
    safety: { ...SAFETY, max_pickup_by: partial.pickup_by, serve_by: at(240) },
  };
}

export const LISTINGS: Listing[] = [
  listing({
    id: "lst-101",
    donor_org: "org-sri-sai",
    items: [
      { name: "Veg biryani", category: "rice_dish", qty_meals: 100 },
      { name: "Dal", category: "curry", qty_meals: 50 },
    ],
    total_meals: 150,
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: at(-90),
    pickup_by: at(85),
    status: "volunteer_assigned",
    receiver_org: "org-annadanam",
    volunteer: "Ravi K.",
  }),
  listing({
    id: "lst-102",
    donor_org: "org-sri-sai",
    items: [
      { name: "Chapati", category: "bread", qty_meals: 25 },
      { name: "Paneer curry", category: "curry", qty_meals: 15 },
    ],
    total_meals: 40,
    veg: true,
    allergens: ["dairy", "gluten"],
    storage: "room",
    cooked_at: at(-60),
    pickup_by: at(25),
    status: "offered",
  }),
  listing({
    id: "lst-103",
    donor_org: "org-spiceroute",
    items: [{ name: "Chicken biryani", category: "rice_dish", qty_meals: 30 }],
    total_meals: 30,
    veg: false,
    allergens: [],
    storage: "hot",
    cooked_at: at(-45),
    pickup_by: at(55),
    status: "offered",
  }),
  listing({
    id: "lst-104",
    donor_org: "org-green-valley",
    items: [{ name: "Curd rice", category: "dairy_based", qty_meals: 45 }],
    total_meals: 45,
    veg: true,
    allergens: ["dairy"],
    storage: "chilled",
    cooked_at: at(-30),
    pickup_by: at(130),
    status: "offered",
  }),
  listing({
    id: "lst-105",
    donor_org: "org-green-valley",
    items: [
      { name: "Sambar rice", category: "rice_dish", qty_meals: 35 },
      { name: "Vada", category: "dry_snack", qty_meals: 20 },
    ],
    total_meals: 55,
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: at(-40),
    pickup_by: at(70),
    status: "claimed",
    receiver_org: "org-asha",
  }),
];

const byId = (id: string) => LISTINGS.find((l) => l.id === id)!;

export const OFFERS: Offer[] = [
  {
    id: "off-1",
    listing: byId("lst-102"),
    rank: 1,
    score: 0.91,
    reasons: [
      { en: "Fits tonight's need of 60 meals", te: "ఈ రాత్రి 60 భోజనాల అవసరానికి సరిపోతుంది" },
      { en: "Veg, matches your preference", te: "శాకాహారం, మీ ప్రాధాన్యతకు సరిపోతుంది" },
    ],
    expires_at: at(8),
    distance_km: 6.2,
    eta_min: 22,
  },
  {
    id: "off-2",
    listing: byId("lst-103"),
    rank: 1,
    score: 0.84,
    reasons: [{ en: "Closest kitchen open now", te: "ఇప్పుడు తెరిచి ఉన్న దగ్గరి వంటశాల" }],
    expires_at: at(6),
    distance_km: 3.1,
    eta_min: 14,
  },
  {
    id: "off-3",
    listing: byId("lst-104"),
    rank: 2,
    score: 0.77,
    reasons: [
      { en: "Chilled, can be served tomorrow morning", te: "చల్లగా ఉంది, రేపు ఉదయం వడ్డించవచ్చు" },
    ],
    expires_at: at(9),
    distance_km: 2.4,
    eta_min: 11,
  },
];

export const TASKS: Task[] = [
  {
    id: "tsk-1",
    listing: byId("lst-101"),
    donor_org: "org-sri-sai",
    receiver_org: "org-annadanam",
    distance_km: 7.8,
    deadline: at(85),
  },
  {
    id: "tsk-2",
    listing: byId("lst-105"),
    donor_org: "org-green-valley",
    receiver_org: "org-asha",
    distance_km: 6.4,
    deadline: at(70),
  },
];

/** CO₂e factor is a placeholder until a published source is chosen (docs/11 §1). */
export const DONOR_IMPACT_MONTH: Pick<Impact, "meals" | "kg" | "co2e_kg"> = {
  meals: 1240,
  kg: 496,
  co2e_kg: 1240,
};

export const CITY_IMPACT_MONTH: Pick<
  Impact,
  "meals" | "kg" | "co2e_kg" | "on_time_rate" | "median_claim_min" | "rescue_rate"
> = {
  meals: 12480,
  kg: 4992,
  co2e_kg: 12480,
  on_time_rate: 0.94,
  median_claim_min: 6,
  rescue_rate: 0.87,
};

export const orgName = (id?: string) => (id ? (ORGS[id]?.name ?? id) : "");
export const orgArea = (id?: string) => (id ? (ORGS[id]?.area ?? "") : "");
