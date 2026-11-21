import type { Db } from "./client.js";
import type { PickupState } from "../data/liveFixtures.js";
import { DEMO_ACCOUNTS, type EventRow, type GuidanceRow, type ListingRow, type NeedRow, type OfferRow, type OrgRow, type SeedData, type UserRow } from "../seed/generate.js";

export interface CodeRow {
  id: string;
  pickup_code: string | null;
  delivery_code: string | null;
  pickup_tries: number;
  delivery_tries: number;
}

export type Hydrated = Omit<SeedData, "pickups"> & { pickups: PickupState[]; codes: CodeRow[] };

const iso = (d: Date | string | null): string | null => (d === null ? null : new Date(d).toISOString());
const isoReq = (d: Date | string): string => new Date(d).toISOString();

type Ts = Date | string;

// Reads every table into the shapes DemoRepo works with. Returns null when the database is empty
// (not migrated/seeded yet). Casts keep numeric and date columns as JS numbers and strings.
export async function loadFromDb(db: Db): Promise<Hydrated | null> {
  const orgs = await db<OrgRow[]>`
    SELECT id, type, donor_type, name, area, lat, lng, veg_only, open_from, open_to, reliability::float8 AS reliability FROM orgs`;
  if (orgs.length === 0) return null;

  const users = await db<UserRow[]>`
    SELECT id, org_id, role, display_name, lang, vehicle, capacity_meals, available FROM users`;
  const receiver_needs = await db<NeedRow[]>`
    SELECT org_id, date::text AS date, meals_needed, meals_received FROM receiver_needs ORDER BY date`;
  const guidance = await db<GuidanceRow[]>`
    SELECT food_category, storage, max_window_minutes, serve_within_minutes, guidance_en, guidance_te FROM guidance_rules`;

  const listingRows = await db<(Omit<ListingRow, "cooked_at" | "pickup_by" | "created_at"> & CodeRow & { cooked_at: Ts; pickup_by: Ts; created_at: Ts })[]>`
    SELECT id, donor_org_id, items, total_meals, veg, allergens, storage, cooked_at, pickup_by, status, created_at, posted_in_ms,
           pickup_code, delivery_code, pickup_tries, delivery_tries FROM listings`;
  const listings: ListingRow[] = listingRows.map((r) => ({
    id: r.id, donor_org_id: r.donor_org_id, items: r.items, total_meals: r.total_meals, veg: r.veg, allergens: r.allergens,
    storage: r.storage, cooked_at: isoReq(r.cooked_at), pickup_by: isoReq(r.pickup_by), status: r.status,
    created_at: isoReq(r.created_at), posted_in_ms: r.posted_in_ms,
  }));
  const codes: CodeRow[] = listingRows.map((r) => ({
    id: r.id, pickup_code: r.pickup_code, delivery_code: r.delivery_code, pickup_tries: r.pickup_tries, delivery_tries: r.delivery_tries,
  }));

  const offerRows = await db<(Omit<OfferRow, "expires_at"> & { expires_at: Ts })[]>`
    SELECT id, listing_id, receiver_org_id, rank, score::float8 AS score, reasons, status, expires_at FROM offers`;
  const offers: OfferRow[] = offerRows.map((o) => ({ ...o, expires_at: isoReq(o.expires_at) }));

  const pickupRows = await db<(Omit<PickupState, "picked_up_at" | "delivered_at"> & { picked_up_at: Ts | null; delivered_at: Ts | null })[]>`
    SELECT id, listing_id, receiver_org_id, volunteer_user_id, status, meals_delivered, picked_up_at, delivered_at FROM pickups`;
  const pickups: PickupState[] = pickupRows.map((p) => ({ ...p, picked_up_at: iso(p.picked_up_at), delivered_at: iso(p.delivered_at) }));

  const eventRows = await db<(Omit<EventRow, "created_at"> & { created_at: Ts })[]>`
    SELECT listing_id, type, actor_user_id, data, created_at FROM events ORDER BY id`;
  const events: EventRow[] = eventRows.map((e) => ({ ...e, created_at: isoReq(e.created_at) }));

  return {
    guidance, orgs, users, receiver_needs, listings, offers, pickups, events, codes,
    demo_accounts: DEMO_ACCOUNTS, capacity_exceptions: 0,
  };
}
