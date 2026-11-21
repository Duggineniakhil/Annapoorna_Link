import type {
  DeclineReason,
  Listing,
  Offer,
  ReceiverHistoryItem,
  ReceiverNeeds,
} from "../types/api";
import { OFFERS, ORGS, orgArea, orgName } from "./fixtures";
import { claimListing, listingTakenFor } from "./listings";

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
  delivery_code?: string;
  volunteer_first_name?: string;
  volunteer_eta_min?: number;
  decline_reason?: DeclineReason;
};

interface StoredOffer {
  offer: Offer;
  receiver_org_id: string;
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
    OFFERS.filter((offer) => !receiver.veg_only || offer.listing.veg).map((offer) => ({
      receiver_org_id: receiver.id,
      offer: {
        ...offer,
        // Offer ids are unique per receiver: the first receiver keeps the seed id.
        id: receiver.id === "org-annadanam" ? offer.id : `${offer.id}-${receiver.id.slice(4)}`,
        expires_at:
          offer.id === EXPIRES_WHILE_OPEN_ID
            ? new Date(nowMs + EXPIRES_WHILE_OPEN_MS).toISOString()
            : offer.expires_at,
      },
    })),
  );
}

const offerStore: StoredOffer[] = seedOffers(Date.now());
const decisions: Record<string, Decision> = readJson(DECISIONS_KEY, {});

// Demo listings are re-seeded on load, so re-apply saved accepts: the donor keeps seeing who
// claimed the food, and other kitchens stop being offered it.
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

function statusOf(s: StoredOffer, nowMs: number): NonNullable<Offer["status"]> {
  const decision = decisions[s.offer.id];
  if (decision) return decision.state;
  // Another kitchen already took this food (or it was cancelled / expired): the offer is closed.
  if (listingTakenFor(s.offer.listing.id, s.receiver_org_id)) return "expired";
  return Date.parse(s.offer.expires_at) <= nowMs ? "expired" : "open";
}

/** Deterministic 4-digit delivery code for a demo offer id. */
function codeFor(id: string): string {
  let h = 7;
  for (const ch of id) h = (h * 37 + ch.charCodeAt(0)) % 9000;
  return String(1000 + h);
}

/** The offer as the API serves it. The delivery code (on the listing) only once accepted. */
function viewOf(s: StoredOffer, nowMs: number): Offer {
  const decision = decisions[s.offer.id];
  const view: Offer = { ...s.offer, status: statusOf(s, nowMs) };
  if (decision?.state === "accepted") {
    view.listing = { ...s.offer.listing, delivery_code: decision.delivery_code };
    view.volunteer_first_name = decision.volunteer_first_name;
    view.volunteer_eta_min = decision.volunteer_eta_min;
  }
  return view;
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
 * POST /api/offers/:id/accept → Listing (contract). Claims the donor's listing, gives the
 * receiver a delivery code and assigns the demo volunteer.
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
    delivery_code: codeFor(offerId),
    volunteer_first_name: "Ravi",
    volunteer_eta_min: Math.max(1, Math.round(s.offer.eta_min)),
  };
  writeJson(DECISIONS_KEY, decisions);
  const claimed =
    claimListing(s.offer.listing.id, orgId, s.offer.distance_km, nowMs) ??
    ({ ...s.offer.listing, status: "claimed", receiver_org: orgId } satisfies Listing);
  return { ok: true, value: { ...claimed, delivery_code: decisions[offerId].delivery_code } };
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
  decisions[offerId] = { state: "declined", decline_reason: reason };
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

// History (GET /api/receiver/history), per receiver org.

const HISTORY_SEED: {
  id: string;
  receiver_org: string;
  items_title: string;
  meals: number;
  hours_ago: number;
  donor_org: string;
}[] = [
  {
    id: "rcv-1",
    receiver_org: "org-annadanam",
    items_title: "Veg pulao, Raita",
    meals: 60,
    hours_ago: 2,
    donor_org: "org-sri-sai",
  },
  {
    id: "rcv-2",
    receiver_org: "org-annadanam",
    items_title: "Chicken biryani",
    meals: 40,
    hours_ago: 26,
    donor_org: "org-spiceroute",
  },
  {
    id: "rcv-3",
    receiver_org: "org-annadanam",
    items_title: "Chapati, Dal",
    meals: 45,
    hours_ago: 50,
    donor_org: "org-sri-sai",
  },
  {
    id: "rcv-4",
    receiver_org: "org-asha",
    items_title: "Curd rice",
    meals: 30,
    hours_ago: 3,
    donor_org: "org-green-valley",
  },
  {
    id: "rcv-5",
    receiver_org: "org-asha",
    items_title: "Sambar rice, Vada",
    meals: 50,
    hours_ago: 27,
    donor_org: "org-green-valley",
  },
  {
    id: "rcv-6",
    receiver_org: "org-asha",
    items_title: "Gulab jamun",
    meals: 20,
    hours_ago: 74,
    donor_org: "org-sri-sai",
  },
];

/** Newest first. */
export function receiverHistory(orgId: string, nowMs = Date.now()): ReceiverHistoryItem[] {
  return HISTORY_SEED.filter((row) => row.receiver_org === orgId)
    .map((row) => ({
      id: row.id,
      items_title: row.items_title,
      meals: row.meals,
      received_at: new Date(nowMs - row.hours_ago * 60 * MINUTE_MS).toISOString(),
      donor_name: orgName(row.donor_org),
      area: orgArea(row.donor_org),
    }))
    .sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at));
}
