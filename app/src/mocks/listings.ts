import type { Allergen, Category, Listing, ListingItem, Storage } from "../types/api";
import { isPickupAllowed, maxPickupBy, serveByFor, totalMeals } from "../lib/quickPost";

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

// Mock listings survive a page refresh (browser only), so a demo isn't lost on reload.
const STORE_KEY = "al.mock.listings";

function loadStore(): Listing[] {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Listing[]) : [];
  } catch {
    return [];
  }
}

function saveStore(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORE_KEY, JSON.stringify(listingStore));
    }
  } catch {
    // Storage unavailable; listings stay in memory for this session.
  }
}

export const listingStore: Listing[] = loadStore();

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
    id: "lst-" + String(listingStore.length + 1).padStart(3, "0"),
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
    pickup_code: "4812",
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

export function listingsForOrg(orgId: string): Listing[] {
  return listingStore
    .filter((l) => l.donor_org === orgId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}
