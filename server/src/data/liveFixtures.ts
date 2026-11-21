import type { EventRow, ListingRow, OfferRow } from "../seed/generate.js";

export interface PickupState {
  id: string;
  listing_id: string;
  receiver_org_id: string;
  volunteer_user_id: string | null;
  status: string;
  meals_delivered: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
}

// Two hand-made listings on top of the seed, so offers, claims and tasks can be tested.
export const LIVE_LISTINGS: ListingRow[] = [
  { id: "lst-live-1", donor_org_id: "org-caterer-1", items: [{ name: "Veg biryani", category: "rice_dish", qty_meals: 150 }], total_meals: 150, veg: true, allergens: [], storage: "hot", cooked_at: "2026-11-20T21:30:00+05:30", pickup_by: "2026-11-20T23:30:00+05:30", status: "offered", created_at: "2026-11-20T21:40:00+05:30", posted_in_ms: 41000 },
  { id: "lst-live-2", donor_org_id: "org-caterer-1", items: [{ name: "Dal", category: "curry", qty_meals: 80 }], total_meals: 80, veg: true, allergens: [], storage: "hot", cooked_at: "2026-11-20T20:30:00+05:30", pickup_by: "2026-11-20T23:00:00+05:30", status: "claimed", created_at: "2026-11-20T20:45:00+05:30", posted_in_ms: 38000 },
];

export const LIVE_OFFERS: OfferRow[] = [
  { id: "ofr-live-1", listing_id: "lst-live-1", receiver_org_id: "org-kitchen-1", rank: 1, score: 0.8712, reasons: [{ en: "2.4 km away", te: "2.4 కి.మీ దూరంలో" }], status: "pending", expires_at: "2026-11-20T21:50:00+05:30" },
  { id: "ofr-live-2", listing_id: "lst-live-2", receiver_org_id: "org-kitchen-1", rank: 1, score: 0.8, reasons: [], status: "accepted", expires_at: "2026-11-20T20:55:00+05:30" },
];

// volunteer_user_id is null: the task is claimed but no volunteer has taken it yet.
export const LIVE_PICKUPS: PickupState[] = [
  { id: "pku-live-2", listing_id: "lst-live-2", receiver_org_id: "org-kitchen-1", volunteer_user_id: null, status: "claimed", meals_delivered: null, picked_up_at: null, delivered_at: null },
];

export const LIVE_EVENTS: EventRow[] = [
  { listing_id: "lst-live-1", type: "posted", actor_user_id: "demo-donor-sri-sai", data: {}, created_at: "2026-11-20T21:40:00+05:30" },
  { listing_id: "lst-live-1", type: "offered", actor_user_id: null, data: {}, created_at: "2026-11-20T21:41:00+05:30" },
  { listing_id: "lst-live-2", type: "posted", actor_user_id: "demo-donor-sri-sai", data: {}, created_at: "2026-11-20T20:45:00+05:30" },
  { listing_id: "lst-live-2", type: "claimed", actor_user_id: "demo-receiver-annadanam", data: {}, created_at: "2026-11-20T20:50:00+05:30" },
];
