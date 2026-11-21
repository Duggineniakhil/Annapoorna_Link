import type { Db } from "./client.js";
import type { PickupState } from "../data/liveFixtures.js";
import type { EventRow, ListingRow, NeedRow, OfferRow, OrgRow, UserRow } from "../seed/generate.js";

export type ListingSnap = ListingRow & {
  pickup_code: string;
  delivery_code: string;
  pickup_tries: number;
  delivery_tries: number;
};

// A snapshot of everything one request changed. Rows are copies, so later mutation can't leak in.
export interface Batch {
  listings: ListingSnap[];
  offers: OfferRow[];
  pickups: PickupState[];
  events: EventRow[];
  needs: NeedRow[];
  orgs: OrgRow[];
  users: UserRow[];
}

export interface Persister {
  save(batch: Batch): void;
  idle(): Promise<void>;
}

// Write-through persistence: memory stays the working set, each change is queued to Postgres and
// written in order, one transaction per batch. ponytail: single server instance only (no cross-instance
// sync); move reads to the DB if you ever scale out.
export class PgPersister implements Persister {
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly db: Db,
    private readonly onError: (err: unknown) => void = () => undefined,
  ) {}

  save(batch: Batch): void {
    this.chain = this.chain.then(() => this.write(batch)).catch(this.onError);
  }

  idle(): Promise<void> {
    return this.chain;
  }

  private async write(b: Batch): Promise<void> {
    await this.db.begin(async (tx) => {
      for (const l of b.listings) {
        await tx`
          INSERT INTO listings (id, donor_org_id, items, total_meals, veg, allergens, storage, cooked_at, pickup_by,
                                status, pickup_code, delivery_code, created_at, posted_in_ms, pickup_tries, delivery_tries)
          VALUES (${l.id}, ${l.donor_org_id}, ${tx.json(l.items as never)}, ${l.total_meals}, ${l.veg},
                  ${tx.array(l.allergens, 1009)}, ${l.storage}, ${l.cooked_at}, ${l.pickup_by}, ${l.status},
                  ${l.pickup_code}, ${l.delivery_code}, ${l.created_at}, ${l.posted_in_ms}, ${l.pickup_tries}, ${l.delivery_tries})
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, pickup_code = EXCLUDED.pickup_code,
            delivery_code = EXCLUDED.delivery_code, pickup_tries = EXCLUDED.pickup_tries,
            delivery_tries = EXCLUDED.delivery_tries`;
      }
      for (const o of b.offers) {
        await tx`
          INSERT INTO offers (id, listing_id, receiver_org_id, rank, score, reasons, status, expires_at)
          VALUES (${o.id}, ${o.listing_id}, ${o.receiver_org_id}, ${o.rank}, ${o.score}, ${tx.json(o.reasons)}, ${o.status}, ${o.expires_at})
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`;
      }
      for (const p of b.pickups) {
        await tx`
          INSERT INTO pickups (id, listing_id, receiver_org_id, volunteer_user_id, status, meals_delivered, picked_up_at, delivered_at)
          VALUES (${p.id}, ${p.listing_id}, ${p.receiver_org_id}, ${p.volunteer_user_id}, ${p.status}, ${p.meals_delivered}, ${p.picked_up_at}, ${p.delivered_at})
          ON CONFLICT (id) DO UPDATE SET volunteer_user_id = EXCLUDED.volunteer_user_id, status = EXCLUDED.status,
            meals_delivered = EXCLUDED.meals_delivered, picked_up_at = EXCLUDED.picked_up_at, delivered_at = EXCLUDED.delivered_at`;
      }
      for (const e of b.events) {
        await tx`
          INSERT INTO events (listing_id, type, actor_user_id, data, created_at)
          VALUES (${e.listing_id}, ${e.type}, ${e.actor_user_id}, ${tx.json(e.data as never)}, ${e.created_at})`;
      }
      for (const n of b.needs) {
        await tx`UPDATE receiver_needs SET meals_needed = ${n.meals_needed}, meals_received = ${n.meals_received}
                 WHERE org_id = ${n.org_id} AND date::text = ${n.date}`;
      }
      for (const o of b.orgs) {
        await tx`UPDATE orgs SET veg_only = ${o.veg_only}, open_from = ${o.open_from}, open_to = ${o.open_to}, reliability = ${o.reliability}
                 WHERE id = ${o.id}`;
      }
      for (const u of b.users) {
        await tx`UPDATE users SET available = ${u.available} WHERE id = ${u.id}`;
      }
    });
  }
}
