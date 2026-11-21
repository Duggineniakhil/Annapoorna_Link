// Demo fixtures (fictional, area-level) used by the UI until the mock API handlers land in task A3.
// Names and areas follow docs/04-sample-data-plan.md. Times are relative to page load so countdowns
// look live in the demo.
import type { Listing, OfferSeed, Org, Role, Status, TaskSeed, TimelineEvent } from "../types/api";
import { distanceKm, roundKm } from "../components/map/geo";

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
  "org-lakshmi-gardens": {
    id: "org-lakshmi-gardens",
    type: "donor",
    donor_type: "wedding_hall",
    name: "Lakshmi Gardens Function Hall",
    area: "Kondapur",
    lat: 17.4699,
    lng: 78.3578,
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

const event = (status: Status, minutesFromNow: number, actor_role: Role): TimelineEvent => ({
  type: status,
  status,
  at: at(minutesFromNow),
  actor_role,
});

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
  // One listing per donor-facing status. Timelines run from creation (-20 min) to now.
  listing({
    id: "lst-106",
    donor_org: "org-sri-sai",
    items: [{ name: "Lemon rice", category: "rice_dish", qty_meals: 40 }],
    total_meals: 40,
    veg: true,
    allergens: [],
    storage: "room",
    cooked_at: at(-25),
    pickup_by: at(95),
    status: "posted",
    pickup_code: "3071",
    timeline: [event("posted", -20, "donor")],
  }),
  listing({
    id: "lst-107",
    donor_org: "org-green-valley",
    items: [{ name: "Veg pulao", category: "rice_dish", qty_meals: 60 }],
    total_meals: 60,
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: at(-50),
    pickup_by: at(40),
    status: "offered",
    receiver_org: "org-asha",
    matched_receiver: {
      name: ORGS["org-asha"].name,
      area: ORGS["org-asha"].area,
      distance_km: 4.8,
    },
    pickup_code: "5520",
    timeline: [event("posted", -20, "donor"), event("offered", -18, "receiver")],
  }),
  listing({
    id: "lst-108",
    donor_org: "org-sri-sai",
    items: [
      { name: "Chapati", category: "bread", qty_meals: 30 },
      { name: "Dal", category: "curry", qty_meals: 20 },
    ],
    total_meals: 50,
    veg: true,
    allergens: ["gluten"],
    storage: "room",
    cooked_at: at(-70),
    pickup_by: at(50),
    status: "claimed",
    receiver_org: "org-annadanam",
    matched_receiver: {
      name: ORGS["org-annadanam"].name,
      area: ORGS["org-annadanam"].area,
      distance_km: 7.8,
    },
    pickup_code: "6148",
    timeline: [
      event("posted", -20, "donor"),
      event("offered", -18, "receiver"),
      event("claimed", -16, "receiver"),
    ],
  }),
  listing({
    id: "lst-109",
    donor_org: "org-spiceroute",
    items: [{ name: "Veg fried rice", category: "rice_dish", qty_meals: 80 }],
    total_meals: 80,
    veg: true,
    allergens: ["soy"],
    storage: "hot",
    cooked_at: at(-35),
    pickup_by: at(60),
    status: "volunteer_assigned",
    receiver_org: "org-asha",
    matched_receiver: {
      name: ORGS["org-asha"].name,
      area: ORGS["org-asha"].area,
      distance_km: 3.9,
    },
    volunteer: "Meena",
    volunteer_vehicle: "Scooter",
    pickup_code: "2905",
    timeline: [
      event("posted", -20, "donor"),
      event("offered", -18, "receiver"),
      event("claimed", -16, "receiver"),
      event("volunteer_assigned", -14, "volunteer"),
    ],
  }),
  listing({
    id: "lst-110",
    donor_org: "org-sri-sai",
    items: [{ name: "Idli", category: "dry_snack", qty_meals: 40 }],
    total_meals: 40,
    veg: true,
    allergens: ["gluten"],
    storage: "room",
    cooked_at: at(-60),
    pickup_by: at(15),
    status: "picked_up",
    receiver_org: "org-annadanam",
    matched_receiver: {
      name: ORGS["org-annadanam"].name,
      area: ORGS["org-annadanam"].area,
      distance_km: 5.1,
    },
    volunteer: "Meena",
    volunteer_vehicle: "Bike",
    timeline: [
      event("posted", -20, "donor"),
      event("offered", -18, "receiver"),
      event("claimed", -16, "receiver"),
      event("volunteer_assigned", -14, "volunteer"),
      event("picked_up", -8, "volunteer"),
    ],
  }),
  listing({
    id: "lst-111",
    donor_org: "org-sri-sai",
    items: [{ name: "Vegetable biryani", category: "rice_dish", qty_meals: 90 }],
    total_meals: 90,
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: at(-75),
    pickup_by: at(20),
    status: "delivered",
    receiver_org: "org-asha",
    matched_receiver: {
      name: ORGS["org-asha"].name,
      area: ORGS["org-asha"].area,
      distance_km: 6.0,
    },
    volunteer: "Ravi K.",
    volunteer_vehicle: "Van",
    timeline: [
      event("posted", -20, "donor"),
      event("offered", -18, "receiver"),
      event("claimed", -16, "receiver"),
      event("volunteer_assigned", -15, "volunteer"),
      event("picked_up", -9, "volunteer"),
      event("delivered", -2, "volunteer"),
    ],
  }),
  listing({
    id: "lst-112",
    donor_org: "org-sri-sai",
    items: [{ name: "Paneer curry", category: "curry", qty_meals: 25 }],
    total_meals: 25,
    veg: true,
    allergens: ["dairy"],
    storage: "chilled",
    cooked_at: at(-150),
    pickup_by: at(-3),
    status: "expired",
    timeline: [event("posted", -20, "donor"), event("expired", -3, "donor")],
  }),
  listing({
    id: "lst-113",
    donor_org: "org-green-valley",
    items: [{ name: "Curd rice", category: "dairy_based", qty_meals: 30 }],
    total_meals: 30,
    veg: true,
    allergens: ["dairy"],
    storage: "chilled",
    cooked_at: at(-40),
    pickup_by: at(60),
    status: "cancelled",
    timeline: [event("posted", -20, "donor"), event("cancelled", -6, "donor")],
  }),
];

const byId = (id: string) => LISTINGS.find((l) => l.id === id)!;

export const OFFERS: OfferSeed[] = [
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

export const TASKS: TaskSeed[] = [
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

export const orgName = (id?: string) => (id ? (ORGS[id]?.name ?? id) : "");
export const orgArea = (id?: string) => (id ? (ORGS[id]?.area ?? "") : "");
/**
 * Straight-line km between two orgs, one decimal: the same number the maps show, so offers,
 * listings and tasks all agree. Undefined if either org is unknown.
 */
export function orgDistanceKm(a?: string, b?: string): number | undefined {
  const from = a ? ORGS[a] : undefined;
  const to = b ? ORGS[b] : undefined;
  return from && to ? roundKm(distanceKm(from, to)) : undefined;
}

/** Rough city ride time for a distance (demo only). */
export const etaMinFor = (km: number) => Math.round(5 + km * 2.5);

/** Area-level coordinates of an org (no street addresses). */
export const orgLocation = (id?: string) =>
  id && ORGS[id] ? { lat: ORGS[id].lat, lng: ORGS[id].lng } : undefined;
