import type {
  Category,
  DeclineReason,
  Listing,
  Offer,
  OfferSeed,
  ReceiverHistoryItem,
  ReceiverNeeds,
} from "../types/api";
import { OFFERS, ORGS, etaMinFor, orgDistanceKm } from "./fixtures";
import {
  claimListing,
  deliveryCodeFor,
  listingStore,
  listingTakenFor,
  mealsDeliveredFor,
} from "./listings";

// Receiver-side mock server: offers, needs and history, per receiver org.
//
// Offers are re-seeded on every page load so their timers are always relative to now (a demo
// never runs dry). Only the receiver's decisions (accept / decline) and saved needs are kept
// in localStorage, so they survive a refresh.

const DECISIONS_KEY = "al.mock.offerDecisions";
const NEEDS_KEY = "al.mock.receiverNeeds";
const MINUTE_MS = 60_000;

/** The offer that expires while it is open: about 2 minutes after the page loads. */
export const EXPIRES_WHILE_OPEN_ID = "off-1";
const EXPIRES_WHILE_OPEN_MS = 2 * MINUTE_MS;

export const DECLINE_REASONS: DeclineReason[] = [
  "too_far",
  "cant_accept_type",
  "no_space",
  "closing",
];

export function isDeclineReason(value: unknown): value is DeclineReason {
  return typeof value === "string" && (DECLINE_REASONS as string[]).includes(value);
}

type Decision = {
  state: "accepted" | "declined";
  /** When the kitchen decided (older saved decisions may not have it). */
  decided_at?: string;
  delivery_code?: string;
  decline_reason?: DeclineReason;
};

interface StoredOffer {
  offer: OfferSeed;
  receiver_org_id: string;
}

/** The volunteer shown on an offer: first name and minutes to reach the donor. */
export type OfferVolunteer = { first_name: string; eta_min: number };

// The volunteer mock registers this (it imports this module, so it cannot be imported here).
let findVolunteer: (listing: Listing, nowMs: number) => OfferVolunteer | null = () => null;

export function setVolunteerFinder(
  finder: (listing: Listing, nowMs: number) => OfferVolunteer | null,
): void {
  findVolunteer = finder;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; state stays in memory for this session.
  }
}

/**
 * Every demo receiver gets offers. Annadanam (accepts all food) gets every seeded offer;
 * a veg-only kitchen such as Asha only gets veg food, matching the matching rules.
 */
function seedOffers(nowMs: number): StoredOffer[] {
  const receivers = Object.values(ORGS).filter((o) => o.type === "receiver");
  return receivers.flatMap((receiver) =>
    OFFERS.filter((offer) => !receiver.veg_only || offer.listing.veg).map((offer) => {
      // Distance from the donor's area to this kitchen: the same number the map shows.
      const km = orgDistanceKm(offer.listing.donor_org, receiver.id) ?? offer.distance_km;
      return {
        receiver_org_id: receiver.id,
        offer: {
          ...offer,
          distance_km: km,
          eta_min: etaMinFor(km),
          // Offer ids are unique per receiver: the first receiver keeps the seed id.
          id: receiver.id === "org-annadanam" ? offer.id : `${offer.id}-${receiver.id.slice(4)}`,
          expires_at:
            offer.id === EXPIRES_WHILE_OPEN_ID
              ? new Date(nowMs + EXPIRES_WHILE_OPEN_MS).toISOString()
              : offer.expires_at,
        },
      };
    }),
  );
}

const offerStore: StoredOffer[] = seedOffers(Date.now());
const decisions: Record<string, Decision> = readJson(DECISIONS_KEY, {});

// Demo listings are re-seeded on load, so re-apply saved accepts: the donor keeps seeing who
// claimed the food, and other kitchens stop being offered it.
function applyAcceptedClaims(): void {
  for (const stored of offerStore) {
    if (decisions[stored.offer.id]?.state === "accepted") {
      claimListing(
        stored.offer.listing.id,
        stored.receiver_org_id,
        stored.offer.distance_km,
        Date.now(),
      );
    }
  }
}
applyAcceptedClaims();

function statusOf(s: StoredOffer, nowMs: number): NonNullable<Offer["status"]> {
  const decision = decisions[s.offer.id];
  if (decision) return decision.state;
  // Another kitchen already took this food (or it was cancelled / expired): the offer is closed.
  if (listingTakenFor(s.offer.listing.id, s.receiver_org_id)) return "expired";
  return Date.parse(s.offer.expires_at) <= nowMs ? "expired" : "open";
}

/** The live listing behind an offer (the demo store), else the offer's copy. */
function currentListing(s: StoredOffer): Listing {
  return listingStore.find((l) => l.id === s.offer.listing.id) ?? s.offer.listing;
}

/**
 * The listing as a kitchen may see it: never the donor's pickup code; the delivery code, the
 * matched kitchen and the volunteer only when this kitchen is the one that claimed it.
 */
function receiverView(listing: Listing, orgId: string): Listing {
  const view: Listing = { ...listing };
  delete view.pickup_code;
  if (listing.receiver_org !== orgId) {
    delete view.delivery_code;
    delete view.matched_receiver;
    delete view.volunteer;
    delete view.volunteer_vehicle;
    if (listing.receiver_org) delete view.receiver_org;
  }
  return view;
}

/** The offer as the API serves it (doc 12: status and volunteer fields always present). */
function viewOf(s: StoredOffer, nowMs: number): Offer {
  const status = statusOf(s, nowMs);
  const live = currentListing(s);
  // Only an open offer or this kitchen's accepted food has a volunteer to show.
  const volunteer = status === "open" || status === "accepted" ? findVolunteer(live, nowMs) : null;
  return {
    ...s.offer,
    listing: receiverView(live, s.receiver_org_id),
    status,
    volunteer_first_name: volunteer?.first_name ?? null,
    volunteer_eta_min: volunteer?.eta_min ?? null,
  };
}

/** Receiver orgs that were offered this listing (they hear when it is taken or cancelled). */
export function orgsOfferedListing(listingId: string): string[] {
  return offerStore.filter((s) => s.offer.listing.id === listingId).map((s) => s.receiver_org_id);
}

/** GET /api/offers: pending offers (open or just expired) for the org, best rank first. */
export function offersForOrg(orgId: string, nowMs = Date.now()): Offer[] {
  return offerStore
    .filter(
      (s) =>
        s.receiver_org_id === orgId &&
        !decisions[s.offer.id] &&
        !listingTakenFor(s.offer.listing.id, orgId),
    )
    .sort((a, b) => a.offer.rank - b.offer.rank)
    .map((s) => viewOf(s, nowMs));
}

/** GET /api/offers/:id. Undefined when the offer is not this org's. */
export function offerForOrg(orgId: string, offerId: string, nowMs = Date.now()): Offer | undefined {
  const s = offerStore.find((o) => o.offer.id === offerId && o.receiver_org_id === orgId);
  return s ? viewOf(s, nowMs) : undefined;
}

export type OfferActionResult<T> =
  { ok: true; value: T } | { ok: false; reason: "not_found" | "expired" | "not_open" };

function findOpen(
  orgId: string,
  offerId: string,
  nowMs: number,
): { ok: true; stored: StoredOffer } | { ok: false; reason: "not_found" | "expired" | "not_open" } {
  const stored = offerStore.find((o) => o.offer.id === offerId && o.receiver_org_id === orgId);
  if (!stored) return { ok: false, reason: "not_found" };
  const status = statusOf(stored, nowMs);
  if (status === "expired") return { ok: false, reason: "expired" };
  if (status !== "open") return { ok: false, reason: "not_open" };
  return { ok: true, stored };
}

/**
 * POST /api/offers/:id/accept → Listing (doc 12): the claimed listing with this kitchen's
 * delivery_code and no pickup_code. A volunteer is assigned when one accepts the task.
 */
export function acceptOffer(
  orgId: string,
  offerId: string,
  nowMs = Date.now(),
): OfferActionResult<Listing> {
  const found = findOpen(orgId, offerId, nowMs);
  if (!found.ok) return found;
  const s = found.stored;
  decisions[offerId] = {
    state: "accepted",
    decided_at: new Date(nowMs).toISOString(),
    delivery_code: deliveryCodeFor(s.offer.listing.id),
  };
  writeJson(DECISIONS_KEY, decisions);
  const claimed =
    claimListing(s.offer.listing.id, orgId, s.offer.distance_km, nowMs) ??
    ({ ...s.offer.listing, status: "claimed", receiver_org: orgId } satisfies Listing);
  return {
    ok: true,
    value: receiverView({ ...claimed, delivery_code: decisions[offerId].delivery_code }, orgId),
  };
}

/** POST /api/offers/:id/decline → { ok } (contract). The reason is optional. */
export function declineOffer(
  orgId: string,
  offerId: string,
  reason: DeclineReason | undefined,
  nowMs = Date.now(),
): OfferActionResult<{ ok: true }> {
  const found = findOpen(orgId, offerId, nowMs);
  if (!found.ok) return found;
  decisions[offerId] = {
    state: "declined",
    decided_at: new Date(nowMs).toISOString(),
    decline_reason: reason,
  };
  writeJson(DECISIONS_KEY, decisions);
  return { ok: true, value: { ok: true } };
}

// Needs (GET/PUT /api/receiver/needs), per receiver org.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isReceiverNeeds(value: unknown): value is ReceiverNeeds {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.meals_needed === "number" &&
    Number.isInteger(b.meals_needed) &&
    b.meals_needed > 0 &&
    typeof b.veg_only === "boolean" &&
    typeof b.open_from === "string" &&
    HHMM.test(b.open_from) &&
    typeof b.open_to === "string" &&
    HHMM.test(b.open_to) &&
    b.open_from !== b.open_to
  );
}

/** Night intake by default (doc 04: shelters and kitchens take food until about 11 PM). */
function defaultNeeds(orgId: string): ReceiverNeeds {
  const org = ORGS[orgId];
  return {
    meals_needed: org?.veg_only ? 80 : 150,
    veg_only: org?.veg_only ?? false,
    open_from: org?.open_from ?? "18:00",
    open_to: org?.open_to ?? "23:30",
  };
}

const needsStore: Record<string, ReceiverNeeds> = readJson(NEEDS_KEY, {});

function replaceContents<T>(target: Record<string, T>, source: Record<string, T>): void {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, source);
}

/** Re-reads decisions and needs from localStorage (another tab changed them). */
export function reloadReceiverState(): void {
  replaceContents(decisions, readJson<Record<string, Decision>>(DECISIONS_KEY, {}));
  replaceContents(needsStore, readJson<Record<string, ReceiverNeeds>>(NEEDS_KEY, {}));
  applyAcceptedClaims();
}

export function receiverNeeds(orgId: string): ReceiverNeeds {
  const saved = needsStore[orgId];
  return isReceiverNeeds(saved) ? { ...saved } : defaultNeeds(orgId);
}

/** Caller must validate with isReceiverNeeds first. */
export function saveReceiverNeeds(orgId: string, input: ReceiverNeeds): ReceiverNeeds {
  needsStore[orgId] = {
    meals_needed: input.meals_needed,
    veg_only: input.veg_only,
    open_from: input.open_from,
    open_to: input.open_to,
  };
  writeJson(NEEDS_KEY, needsStore);
  return { ...needsStore[orgId] };
}

// History (GET /api/receiver/history), per receiver org (doc 12).
// Offers this kitchen decided or saw expire, plus food received before this demo session.

const HISTORY_LIMIT = 50;

const HISTORY_SEED: {
  id: string;
  receiver_org: string;
  item: string;
  category: Category;
  veg: boolean;
  meals: number;
  hours_ago: number;
  donor_org: string;
}[] = [
  {
    id: "rcv-1",
    receiver_org: "org-annadanam",
    item: "Veg pulao",
    category: "rice_dish",
    veg: true,
    meals: 60,
    hours_ago: 2,
    donor_org: "org-sri-sai",
  },
  {
    id: "rcv-2",
    receiver_org: "org-annadanam",
    item: "Chicken biryani",
    category: "rice_dish",
    veg: false,
    meals: 40,
    hours_ago: 26,
    donor_org: "org-spiceroute",
  },
  {
    id: "rcv-3",
    receiver_org: "org-annadanam",
    item: "Chapati, Dal",
    category: "bread",
    veg: true,
    meals: 45,
    hours_ago: 50,
    donor_org: "org-sri-sai",
  },
  {
    id: "rcv-4",
    receiver_org: "org-asha",
    item: "Curd rice",
    category: "dairy_based",
    veg: true,
    meals: 30,
    hours_ago: 3,
    donor_org: "org-green-valley",
  },
  {
    id: "rcv-5",
    receiver_org: "org-asha",
    item: "Sambar rice, Vada",
    category: "rice_dish",
    veg: true,
    meals: 50,
    hours_ago: 27,
    donor_org: "org-green-valley",
  },
  {
    id: "rcv-6",
    receiver_org: "org-asha",
    item: "Gulab jamun",
    category: "sweet",
    veg: true,
    meals: 20,
    hours_ago: 74,
    donor_org: "org-sri-sai",
  },
];

/** A delivered listing for a history row from before this session. */
function pastListing(row: (typeof HISTORY_SEED)[number], deliveredMs: number): Listing {
  const iso = (minutesBefore: number) =>
    new Date(deliveredMs - minutesBefore * MINUTE_MS).toISOString();
  const receiver = ORGS[row.receiver_org];
  return {
    id: `lst-${row.id}`,
    donor_org: row.donor_org,
    items: [{ name: row.item, category: row.category, qty_meals: row.meals }],
    total_meals: row.meals,
    veg: row.veg,
    allergens: [],
    storage: "hot",
    cooked_at: iso(180),
    pickup_by: iso(30),
    status: "delivered",
    created_at: iso(120),
    posted_in_ms: 45_000,
    receiver_org: row.receiver_org,
    matched_receiver: receiver ? { name: receiver.name, area: receiver.area } : undefined,
    timeline: [
      { type: "posted", status: "posted", at: iso(120), actor_role: "donor" },
      { type: "claimed", status: "claimed", at: iso(112), actor_role: "receiver" },
      { type: "picked_up", status: "picked_up", at: iso(60), actor_role: "volunteer" },
      { type: "delivered", status: "delivered", at: iso(0), actor_role: "volunteer" },
    ],
    safety: {
      max_pickup_by: iso(30),
      serve_by: iso(-120),
      guidance_en: "Keep covered and hot. Deliver and serve quickly.",
      guidance_te: "మూతపెట్టి వేడిగా ఉంచండి. త్వరగా చేరవేసి వడ్డించండి.",
    },
  };
}

function lastEventAt(listing: Listing, status: string): string | undefined {
  return listing.timeline?.filter((e) => e.status === status).pop()?.at;
}

/** Newest first, at most 50. */
export function receiverHistory(orgId: string, nowMs = Date.now()): ReceiverHistoryItem[] {
  const fromOffers: ReceiverHistoryItem[] = offerStore
    .filter((s) => s.receiver_org_id === orgId)
    .flatMap((s) => {
      const status = statusOf(s, nowMs);
      if (status === "open") return [];
      const live = currentListing(s);
      const decision = decisions[s.offer.id];
      const at =
        (status === "accepted" && lastEventAt(live, live.status)) ||
        decision?.decided_at ||
        (status === "expired"
          ? new Date(Math.min(nowMs, Date.parse(s.offer.expires_at))).toISOString()
          : new Date(nowMs).toISOString());
      return [
        {
          offer_id: s.offer.id,
          offer_status: status,
          listing: receiverView(live, orgId),
          meals_delivered: status === "accepted" ? mealsDeliveredFor(live) : null,
          at,
        },
      ];
    });
  const seeded: ReceiverHistoryItem[] = HISTORY_SEED.filter(
    (row) => row.receiver_org === orgId,
  ).map((row) => {
    const deliveredMs = nowMs - row.hours_ago * 60 * MINUTE_MS;
    return {
      offer_id: row.id,
      offer_status: "accepted",
      listing: pastListing(row, deliveredMs),
      meals_delivered: row.meals,
      at: new Date(deliveredMs).toISOString(),
    };
  });
  return [...fromOffers, ...seeded]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, HISTORY_LIMIT);
}
