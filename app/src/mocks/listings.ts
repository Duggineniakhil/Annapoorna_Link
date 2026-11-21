import type {
  Allergen,
  Category,
  Listing,
  ListingItem,
  Role,
  Status,
  Storage,
  TimelineEvent,
} from "../types/api";
import { isPickupAllowed, maxPickupBy, serveByFor, totalMeals } from "../lib/quickPost";
import { LISTINGS, ORGS } from "./fixtures";

const CATEGORIES: Category[] = [
  "rice_dish",
  "curry",
  "bread",
  "dry_snack",
  "sweet",
  "dairy_based",
  "salad_cut_fruit",
];
const STORAGES: Storage[] = ["hot", "room", "chilled"];
const ALLERGENS: Allergen[] = [
  "nuts",
  "peanuts",
  "dairy",
  "gluten",
  "egg",
  "seafood",
  "soy",
  "sesame",
];

function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as string[]).includes(v);
}

function isStorage(v: unknown): v is Storage {
  return typeof v === "string" && (STORAGES as string[]).includes(v);
}

function isAllergen(v: unknown): v is Allergen {
  return typeof v === "string" && (ALLERGENS as string[]).includes(v);
}

export interface ListingInput {
  items: {
    name: string;
    category: Category;
    qty_meals: number;
    qty_kg?: number;
    veg?: boolean;
    allergens?: Allergen[];
  }[];
  veg: boolean;
  allergens: Allergen[];
  storage: Storage;
  cooked_at: string;
  pickup_by: string;
  posted_in_ms: number;
}

// The mock store holds the demo listings (re-seeded on every load so their times stay relative
// to now) plus listings the donor posts, which are kept in localStorage so a demo survives a
// page refresh.
const STORE_KEY = "al.mock.listings";
const FIXTURE_IDS = new Set(LISTINGS.map((l) => l.id));

function loadPosted(): Listing[] {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Listing[]).filter((l) => !FIXTURE_IDS.has(l.id)) : [];
  } catch {
    return [];
  }
}

function saveStore(): void {
  try {
    if (typeof localStorage !== "undefined") {
      const posted = listingStore.filter((l) => !FIXTURE_IDS.has(l.id));
      localStorage.setItem(STORE_KEY, JSON.stringify(posted));
    }
  } catch {
    // Storage unavailable; listings stay in memory for this session.
  }
}

/** Demo listings as the mock server would hold them: a pickup code and a full timeline. */
function seedFixture(listing: Listing): Listing {
  return {
    ...listing,
    // Guidance text must match the listing's storage (doc 10 §2).
    safety: {
      ...listing.safety,
      guidance_en: GUIDANCE[listing.storage].en,
      guidance_te: GUIDANCE[listing.storage].te,
    },
    pickup_code: listing.pickup_code ?? codeFor(listing.id),
    timeline: listing.timeline ?? synthesizeTimeline(listing),
    matched_receiver:
      listing.matched_receiver ??
      (listing.receiver_org && ORGS[listing.receiver_org]
        ? { name: ORGS[listing.receiver_org].name, area: ORGS[listing.receiver_org].area }
        : undefined),
  };
}

/** Deterministic 4-digit code for a demo listing id. */
function codeFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return String(1000 + h);
}

/** Random 4-digit handover code (D4). */
function newCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

const FLOW: Status[] = [
  "posted",
  "offered",
  "claimed",
  "volunteer_assigned",
  "picked_up",
  "delivered",
];
const ACTOR: Record<Status, Role> = {
  posted: "donor",
  offered: "receiver",
  claimed: "receiver",
  volunteer_assigned: "volunteer",
  picked_up: "volunteer",
  delivered: "volunteer",
  expired: "donor",
  cancelled: "donor",
};

/** Timeline for a listing that has none: every step up to its status, two minutes apart. */
function synthesizeTimeline(listing: Listing): TimelineEvent[] {
  const start = Date.parse(listing.created_at);
  const upto = FLOW.indexOf(listing.status);
  const steps = upto >= 0 ? FLOW.slice(0, upto + 1) : ["posted" as Status, listing.status];
  return steps.map((status, i) => ({
    type: status,
    status,
    at: new Date(start + i * 2 * 60_000).toISOString(),
    actor_role: ACTOR[status],
  }));
}

function nextId(): string {
  const used = new Set(listingStore.map((l) => l.id));
  let n = listingStore.filter((l) => !FIXTURE_IDS.has(l.id)).length + 1;
  while (used.has("lst-" + String(n).padStart(3, "0"))) n++;
  return "lst-" + String(n).padStart(3, "0");
}

// Guidance copied from docs/10 §2.
// TE strings are a draft and need native speaker review.
const GUIDANCE: Record<Storage, { en: string; te: string }> = {
  hot: {
    en: "Keep covered and hot. Deliver and serve quickly.",
    te: "మూతపెట్టి వేడిగా ఉంచండి. త్వరగా చేరవేసి వడ్డించండి.",
  },
  room: {
    en: "Do not keep at room temperature for long. Serve within 2 hours of cooking.",
    te: "గది ఉష్ణోగ్రతలో ఎక్కువసేపు ఉంచవద్దు. వండిన 2 గంటల లోపు వడ్డించండి.",
  },
  chilled: {
    en: "Keep chilled during transport. Serve soon after delivery.",
    te: "రవాణా సమయంలో చల్లగా ఉంచండి. చేరిన వెంటనే వడ్డించండి.",
  },
};

// Declared after the helpers above, which the seeding calls at module load.
export const listingStore: Listing[] = [
  ...loadPosted(),
  ...(typeof localStorage === "undefined" ? [] : LISTINGS.map(seedFixture)),
];

export function guidanceFor(input: {
  items: { category: Category; veg: boolean }[];
  storage: Storage;
  cooked_at: Date;
}): { max_pickup_by: string; serve_by: string; guidance_en: string; guidance_te: string } {
  const text = GUIDANCE[input.storage];
  return {
    max_pickup_by: maxPickupBy(input.cooked_at, input.storage, input.items).toISOString(),
    serve_by: serveByFor(input.cooked_at, input.storage).toISOString(),
    guidance_en: text.en,
    guidance_te: text.te,
  };
}

export function createListing(
  donorOrgId: string,
  input: ListingInput,
  nowMs: number,
):
  | { ok: true; listing: Listing }
  | { ok: false; status: number; error_code: string; message: string; message_te: string } {
  if (
    input.items.length === 0 ||
    input.items.some((i) => !Number.isInteger(i.qty_meals) || i.qty_meals <= 0)
  ) {
    return {
      ok: false,
      status: 400,
      error_code: "VALIDATION_FAILED",
      message: "Add at least one dish with a quantity.",
      message_te: "కనీసం ఒక వంటకాన్ని, పరిమాణాన్ని జోడించండి.",
    };
  }

  const strictInvalid =
    input.items.some(
      (i) =>
        typeof i.name !== "string" ||
        i.name.trim() === "" ||
        !isCategory(i.category) ||
        (i.qty_kg !== undefined && !(Number.isFinite(i.qty_kg) && i.qty_kg > 0)) ||
        (i.veg !== undefined && typeof i.veg !== "boolean") ||
        (i.allergens !== undefined &&
          (!Array.isArray(i.allergens) || !i.allergens.every(isAllergen))),
    ) ||
    !isStorage(input.storage) ||
    !Array.isArray(input.allergens) ||
    !input.allergens.every(isAllergen) ||
    typeof input.veg !== "boolean" ||
    !(Number.isFinite(input.posted_in_ms) && input.posted_in_ms >= 0);
  if (strictInvalid) {
    return {
      ok: false,
      status: 400,
      error_code: "VALIDATION_FAILED",
      message: "Check the listing details.",
      message_te: "జాబితా వివరాలను తనిఖీ చేయండి.",
    };
  }

  const cookedAt = new Date(input.cooked_at);
  const pickupBy = new Date(input.pickup_by);
  if (Number.isNaN(cookedAt.getTime()) || Number.isNaN(pickupBy.getTime())) {
    return {
      ok: false,
      status: 400,
      error_code: "VALIDATION_FAILED",
      message: "Check the cooked and pickup times.",
      message_te: "వండిన మరియు పికప్ సమయాలను తనిఖీ చేయండి.",
    };
  }

  if (pickupBy.getTime() < nowMs) {
    return {
      ok: false,
      status: 422,
      error_code: "PICKUP_IN_PAST",
      message: "Pickup time has already passed. Choose a later time.",
      message_te: "పికప్ సమయం ఇప్పటికే గడిచిపోయింది. తర్వాతి సమయం ఎంచుకోండి.",
    };
  }

  const max = maxPickupBy(
    cookedAt,
    input.storage,
    input.items.map((i) => ({ category: i.category, veg: i.veg ?? input.veg })),
  );
  if (!isPickupAllowed(pickupBy, max)) {
    return {
      ok: false,
      status: 422,
      error_code: "PICKUP_BY_TOO_LATE",
      message: "Pickup time is later than the safe window. Choose an earlier time.",
      message_te: "పికప్ సమయం సురక్షిత గడువు కంటే ఆలస్యం. ముందస్తు సమయం ఎంచుకోండి.",
    };
  }

  const items: ListingItem[] = input.items.map((i) => ({
    name: i.name,
    category: i.category,
    qty_meals: i.qty_meals,
    ...(i.qty_kg !== undefined ? { qty_kg: i.qty_kg } : {}),
  }));

  const guidance = guidanceFor({
    items: input.items.map((i) => ({ category: i.category, veg: i.veg ?? input.veg })),
    storage: input.storage,
    cooked_at: cookedAt,
  });

  const listing: Listing = {
    id: nextId(),
    donor_org: donorOrgId,
    items,
    total_meals: totalMeals(items),
    veg: input.veg,
    allergens: input.allergens,
    storage: input.storage,
    cooked_at: input.cooked_at,
    pickup_by: input.pickup_by,
    status: "posted",
    created_at: new Date(nowMs).toISOString(),
    posted_in_ms: input.posted_in_ms,
    pickup_code: newCode(),
    timeline: [
      { type: "posted", status: "posted", at: new Date(nowMs).toISOString(), actor_role: "donor" },
    ],
    safety: {
      max_pickup_by: guidance.max_pickup_by,
      serve_by: guidance.serve_by,
      guidance_en: guidance.guidance_en,
      guidance_te: guidance.guidance_te,
    },
  };
  listingStore.push(listing);
  saveStore();
  return { ok: true, listing };
}

const BEFORE_PICKUP: Status[] = ["posted", "offered", "claimed", "volunteer_assigned"];

/**
 * Server-side auto-expiry (doc 10): a listing not picked up by pickup_by becomes expired.
 * Run on every read so the demo shows the expired state without a background job.
 */
export function expireOverdue(nowMs: number): void {
  let changed = false;
  for (const listing of listingStore) {
    if (BEFORE_PICKUP.includes(listing.status) && Date.parse(listing.pickup_by) <= nowMs) {
      listing.timeline = [
        ...timelineOf(listing),
        { type: "expired", status: "expired", at: listing.pickup_by, actor_role: "donor" },
      ];
      listing.status = "expired";
      changed = true;
    }
  }
  if (changed) saveStore();
}

export function listingsForOrg(orgId: string, nowMs = Date.now()): Listing[] {
  expireOverdue(nowMs);
  return listingStore
    .filter((l) => l.donor_org === orgId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}

const TERMINAL_STATUSES: Status[] = ["picked_up", "delivered", "expired", "cancelled"];

/** Listings stored before timelines existed get a single 'posted' event. */
function timelineOf(listing: Listing): TimelineEvent[] {
  return (
    listing.timeline ?? [
      { type: "posted", status: "posted", at: listing.created_at, actor_role: "donor" },
    ]
  );
}

/** Donor view of one listing (GET /api/listings/:id). pickup_code is dropped once picked up. */
export function listingDetail(listing: Listing): Listing {
  expireOverdue(Date.now());
  const detail: Listing = { ...listing, timeline: timelineOf(listing) };
  // The pickup code is only useful before pickup; never send it afterwards.
  if (!BEFORE_PICKUP.includes(listing.status)) {
    delete detail.pickup_code;
  }
  return detail;
}

/** True when the listing has been claimed by another kitchen (or has otherwise moved on). */
export function listingTakenFor(listingId: string, receiverOrgId: string): boolean {
  const listing = listingStore.find((l) => l.id === listingId);
  if (!listing) return false;
  if (listing.status === "posted" || listing.status === "offered") return false;
  return listing.receiver_org !== receiverOrgId;
}

/**
 * A receiver accepted an offer for this listing: it becomes claimed by that kitchen, so the
 * donor sees who is taking the food. Returns undefined for unknown or already-moved listings.
 */
export function claimListing(
  listingId: string,
  receiverOrgId: string,
  distanceKm: number,
  nowMs: number,
): Listing | undefined {
  const listing = listingStore.find((l) => l.id === listingId);
  if (!listing || (listing.status !== "posted" && listing.status !== "offered")) return undefined;
  const receiver = ORGS[receiverOrgId];
  listing.status = "claimed";
  listing.receiver_org = receiverOrgId;
  listing.matched_receiver = receiver
    ? { name: receiver.name, area: receiver.area, distance_km: distanceKm }
    : undefined;
  listing.timeline = [
    ...timelineOf(listing),
    {
      type: "claimed",
      status: "claimed",
      at: new Date(nowMs).toISOString(),
      actor_role: "receiver",
    },
  ];
  saveStore();
  return listing;
}

export function cancelListing(
  donorOrgId: string,
  listingId: string,
  nowMs: number,
): { ok: true; listing: Listing } | { ok: false; reason: "not_found" | "invalid_state" } {
  expireOverdue(nowMs);
  const listing = listingStore.find((l) => l.id === listingId && l.donor_org === donorOrgId);
  if (!listing) {
    return { ok: false, reason: "not_found" };
  }
  if (TERMINAL_STATUSES.includes(listing.status)) {
    return { ok: false, reason: "invalid_state" };
  }
  const history = timelineOf(listing);
  listing.status = "cancelled";
  listing.timeline = [
    ...history,
    {
      type: "cancelled",
      status: "cancelled",
      at: new Date(nowMs).toISOString(),
      actor_role: "donor",
    },
  ];
  saveStore();
  return { ok: true, listing };
}
