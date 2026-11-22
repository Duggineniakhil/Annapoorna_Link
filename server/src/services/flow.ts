import { AppError } from "../errors.js";
import type { AuthContext } from "../middleware/auth.js";
import type { DemoRepo } from "../data/repo.js";
import { MAX_CODE_TRIES } from "../data/repo.js";
import { computeSafety } from "../guidance/computeSafety.js";
import { rankReceivers, type RankedReceiver, type ReceiverCandidate } from "../matching/index.js";
import type { Hub, LiveEvent } from "../realtime.js";
import type { ListingSnap, Persister } from "../db/persist.js";
import type { PickupState } from "../data/liveFixtures.js";
import type { CreateListingInput } from "../schemas.js";
import { DEMO_ACCOUNTS, type ListingRow, type OfferRow } from "../seed/generate.js";

const orgsOf = (role: string) =>
  new Set(DEMO_ACCOUNTS.filter((a) => a.role === role && a.org_id).map((a) => a.org_id as string));
const DEMO_DONOR_ORGS = orgsOf("donor");
const DEMO_RECEIVER_ORGS = orgsOf("receiver");

export const OFFER_WINDOW_MS = 10 * 60_000;
export const CASCADE_MAX = 5; // after this many offers, open to all eligible receivers
const ACTIVE = ["posted", "offered", "claimed", "volunteer_assigned"];

// Every state change goes through setStatus(), which checks the current status first. Node runs
// one handler at a time, so check-then-write is atomic and double taps get INVALID_STATE.
export class Flow {
  private readonly dirtyListings = new Set<string>();
  private readonly dirtyOrgs = new Set<string>();
  private readonly dirtyUsers = new Set<string>();
  private eventsSaved: number;
  private flushScheduled = false;

  constructor(
    readonly repo: DemoRepo,
    readonly hub: Hub,
    readonly now: () => Date = () => new Date(),
    private readonly persister?: Persister,
    /** DEMO_MODE: demo donors' food goes to the demo kitchens first (see buildQueue). */
    private readonly demoMode = false,
  ) {
    this.eventsSaved = repo.events.length; // everything loaded is already stored
  }

  // ---- persistence: handlers are synchronous, so one microtask after the first change we write
  // everything that changed in that request as a single batch.
  private schedule(): void {
    if (!this.persister || this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.flush();
    });
  }
  private touch(listingId: string): void {
    this.dirtyListings.add(listingId);
    this.schedule();
  }
  touchOrg(orgId: string): void {
    this.dirtyOrgs.add(orgId);
    this.schedule();
  }
  touchUser(userId: string): void {
    this.dirtyUsers.add(userId);
    this.schedule();
  }

  private flush(): void {
    const { repo, persister } = this;
    if (!persister) return;
    const listings: ListingSnap[] = [];
    const offers: OfferRow[] = [];
    const pickups: PickupState[] = [];
    for (const id of this.dirtyListings) {
      const l = repo.listingById(id);
      if (!l) continue;
      listings.push({
        ...l, pickup_code: repo.codeFor(id, "pickup"), delivery_code: repo.codeFor(id, "delivery"),
        pickup_tries: repo.triesFor(id, "pickup"), delivery_tries: repo.triesFor(id, "delivery"),
      });
      offers.push(...repo.offersFor(id).map((o) => ({ ...o })));
      const p = repo.pickupFor(id);
      if (p) pickups.push({ ...p });
    }
    const events = repo.events.slice(this.eventsSaved).map((e) => ({ ...e }));
    this.eventsSaved = repo.events.length;
    const needs = [...this.dirtyOrgs].flatMap((id) => repo.needFor(id) ?? []).map((n) => ({ ...n }));
    const orgs = [...this.dirtyOrgs].flatMap((id) => repo.orgById(id) ?? []).map((o) => ({ ...o }));
    const users = [...this.dirtyUsers].flatMap((id) => repo.userById(id) ?? []).map((u) => ({ ...u }));
    this.dirtyListings.clear();
    this.dirtyOrgs.clear();
    this.dirtyUsers.clear();
    if (listings.length + events.length + needs.length + orgs.length + users.length > 0) {
      persister.save({ listings, offers, pickups, events, needs, orgs, users });
    }
  }

  private log(listingId: string, type: string, actor: string | null): void {
    this.repo.events.push({ listing_id: listingId, type, actor_user_id: actor, data: {}, created_at: this.now().toISOString() });
    this.touch(listingId);
  }

  private audience(l: ListingRow): string[] {
    const { repo } = this;
    const ids = repo.usersOfOrg(l.donor_org_id).map((u) => u.id);
    const pickup = repo.pickupFor(l.id);
    if (pickup) {
      ids.push(...repo.usersOfOrg(pickup.receiver_org_id).map((u) => u.id));
      if (pickup.volunteer_user_id) ids.push(pickup.volunteer_user_id);
    }
    for (const o of repo.offersFor(l.id)) if (o.status === "pending") ids.push(...repo.usersOfOrg(o.receiver_org_id).map((u) => u.id));
    if (l.status === "claimed") ids.push(...repo.volunteers().map((v) => v.id));
    return ids;
  }

  private notify(l: ListingRow, type: LiveEvent["type"]): void {
    this.hub.publish(this.audience(l), { type, listing_id: l.id, status: l.status, at: this.now().toISOString() });
  }

  private setStatus(l: ListingRow, from: string[], to: string, actor: string | null): void {
    if (!from.includes(l.status)) throw new AppError("INVALID_STATE");
    l.status = to;
    const pickup = this.repo.pickupFor(l.id);
    if (pickup) pickup.status = to;
    this.log(l.id, to, actor);
    this.notify(l, "listing_status");
  }

  private closePendingOffers(l: ListingRow): void {
    for (const o of this.repo.offersFor(l.id)) if (o.status === "pending") o.status = "expired";
    this.touch(l.id);
  }

  private releaseNeed(l: ListingRow): void {
    const pickup = this.repo.pickupFor(l.id);
    const need = pickup ? this.repo.needFor(pickup.receiver_org_id) : undefined;
    if (need && pickup) {
      need.meals_received = Math.max(0, need.meals_received - l.total_meals);
      this.touchOrg(pickup.receiver_org_id);
    }
  }

  // ---- donor ----
  createListing(auth: AuthContext, body: CreateListingInput): ListingRow {
    const { repo } = this;
    const now = this.now();
    if (!auth.orgId || !repo.orgById(auth.orgId)) throw new AppError("FORBIDDEN");
    const cookedAt = new Date(body.cooked_at);
    const pickupBy = new Date(body.pickup_by);
    if (pickupBy.getTime() <= now.getTime()) throw new AppError("VALIDATION_FAILED");
    const safety = computeSafety({
      categories: [...new Set(body.items.map((i) => i.category))],
      storage: body.storage,
      cooked_at: cookedAt,
      veg: body.veg,
      rules: repo.guidance,
      now,
    });
    if (pickupBy.getTime() > Date.parse(safety.max_pickup_by)) throw new AppError("PICKUP_BY_TOO_LATE");

    const l: ListingRow = {
      id: repo.newId("lst"),
      donor_org_id: auth.orgId,
      items: body.items,
      total_meals: body.items.reduce((s, i) => s + i.qty_meals, 0),
      veg: body.veg,
      allergens: body.allergens,
      storage: body.storage,
      cooked_at: cookedAt.toISOString(),
      pickup_by: pickupBy.toISOString(),
      status: "posted",
      created_at: now.toISOString(),
      posted_in_ms: body.posted_in_ms ?? 0,
    };
    repo.addListing(l);
    repo.newCodes(l.id);
    this.log(l.id, "posted", auth.userId);
    this.notify(l, "listing_status");
    this.startCascade(l);
    return l;
  }

  cancel(auth: AuthContext, listingId: string): ListingRow {
    const l = this.repo.listingById(listingId);
    if (!l || l.donor_org_id !== auth.orgId) throw new AppError("NOT_FOUND");
    this.setStatus(l, ACTIVE, "cancelled", auth.userId);
    this.closePendingOffers(l);
    this.releaseNeed(l);
    return l;
  }

  // ---- offers ----
  private buildQueue(l: ListingRow): RankedReceiver[] {
    const { repo } = this;
    const donor = repo.orgById(l.donor_org_id);
    if (!donor) return [];
    // DEMO_MODE: a post from a demo donor account is offered to the demo kitchens first, whatever
    // the time of day (their seeded hours are evenings only), so a judge signed in as one of them
    // sees it. They still have to pass every other rule (veg-only, need, arrival in time).
    const demo = this.demoMode && DEMO_DONOR_ORGS.has(l.donor_org_id);
    const candidates: ReceiverCandidate[] = repo
      .allOrgs()
      .filter((o) => o.type === "receiver")
      .map((org) => ({
        org: demo && DEMO_RECEIVER_ORGS.has(org.id) ? { ...org, open_from: null, open_to: null } : org,
        remaining: repo.remainingNeed(org.id),
      }));
    const ranked = rankReceivers(l, donor, candidates, this.now());
    const queue = demo
      ? [
          ...ranked.filter((r) => DEMO_RECEIVER_ORGS.has(r.receiver_org_id)),
          ...ranked.filter((r) => !DEMO_RECEIVER_ORGS.has(r.receiver_org_id)),
        ]
      : ranked;
    repo.queues.set(l.id, queue);
    return queue;
  }

  private startCascade(l: ListingRow): void {
    this.buildQueue(l);
    this.advance(l);
  }

  // Offer to the next-ranked receiver; once CASCADE_MAX offers have gone out, to everyone left at once.
  private advance(l: ListingRow): void {
    if (l.status !== "posted" && l.status !== "offered") return;
    const offers = this.repo.offersFor(l.id);
    if (offers.some((o) => o.status === "pending")) return;
    const queue = this.repo.queues.get(l.id) ?? this.buildQueue(l); // queues are memory-only: rebuilt after a restart
    const offered = new Set(offers.map((o) => o.receiver_org_id));
    const left = queue.filter((r) => !offered.has(r.receiver_org_id));
    if (left.length === 0) return;
    const now = this.now();
    const expires = new Date(Math.min(now.getTime() + OFFER_WINDOW_MS, Date.parse(l.pickup_by))).toISOString();
    for (const r of offers.length >= CASCADE_MAX ? left : left.slice(0, 1)) {
      const offer: OfferRow = {
        id: this.repo.newId("ofr"), listing_id: l.id, receiver_org_id: r.receiver_org_id,
        rank: queue.indexOf(r) + 1, score: r.score, reasons: r.reasons, status: "pending", expires_at: expires,
      };
      this.repo.offers.push(offer);
    }
    this.touch(l.id);
    if (l.status === "posted") this.setStatus(l, ["posted"], "offered", null);
    else this.notify(l, "offer");
  }

  private ownOffer(auth: AuthContext, offerId: string): OfferRow {
    const o = this.repo.offerById(offerId);
    if (!o || o.receiver_org_id !== auth.orgId) throw new AppError("NOT_FOUND");
    return o;
  }

  acceptOffer(auth: AuthContext, offerId: string): ListingRow {
    const { repo } = this;
    const o = this.ownOffer(auth, offerId);
    const l = repo.listingById(o.listing_id);
    if (!l || o.status !== "pending" || Date.parse(o.expires_at) <= this.now().getTime()) throw new AppError("INVALID_STATE");
    this.setStatus(l, ["offered"], "claimed", auth.userId); // first accept wins; later ones get INVALID_STATE
    o.status = "accepted";
    this.closePendingOffers(l);
    repo.pickups.push({
      id: repo.newId("pku"), listing_id: l.id, receiver_org_id: o.receiver_org_id, volunteer_user_id: null,
      status: "claimed", meals_delivered: null, picked_up_at: null, delivered_at: null,
    });
    const need = repo.needFor(o.receiver_org_id);
    if (need) need.meals_received += l.total_meals;
    this.touchOrg(o.receiver_org_id);
    this.notify(l, "task"); // claimed: volunteers can now see the task
    return l;
  }

  declineOffer(auth: AuthContext, offerId: string): void {
    const o = this.ownOffer(auth, offerId);
    const l = this.repo.listingById(o.listing_id);
    if (!l || o.status !== "pending") throw new AppError("INVALID_STATE");
    o.status = "declined";
    this.log(l.id, "offer_declined", auth.userId);
    this.advance(l);
  }

  // ---- volunteer tasks ----
  acceptTask(auth: AuthContext, listingId: string): ListingRow {
    const { repo } = this;
    const l = repo.listingById(listingId);
    const pickup = repo.pickupFor(listingId);
    const me = repo.userById(auth.userId);
    if (!l || !pickup || !me) throw new AppError("NOT_FOUND");
    if (l.status !== "claimed" || pickup.volunteer_user_id || (me.capacity_meals ?? 0) < l.total_meals) throw new AppError("INVALID_STATE");
    pickup.volunteer_user_id = me.id;
    this.setStatus(l, ["claimed"], "volunteer_assigned", me.id);
    return l;
  }

  private myTask(auth: AuthContext, listingId: string, status: string) {
    const l = this.repo.listingById(listingId);
    const pickup = this.repo.pickupFor(listingId);
    if (!l || !pickup || pickup.volunteer_user_id !== auth.userId) throw new AppError("NOT_FOUND");
    if (l.status !== status) throw new AppError("INVALID_STATE");
    return { l, pickup };
  }

  private checkCode(l: ListingRow, kind: "pickup" | "delivery", code: string, actor: string): void {
    const { repo } = this;
    const tries = repo.triesFor(l.id, kind);
    if (tries >= MAX_CODE_TRIES) throw new AppError("CODE_LOCKED");
    if (code === repo.codeFor(l.id, kind)) {
      repo.setTries(l.id, kind, 0);
      return;
    }
    repo.setTries(l.id, kind, tries + 1);
    this.touch(l.id);
    if (tries + 1 >= MAX_CODE_TRIES) {
      this.log(l.id, "code_trouble", actor); // donor sees "volunteer is having trouble with the code"
      throw new AppError("CODE_LOCKED");
    }
    throw new AppError("WRONG_CODE", { remaining_tries: MAX_CODE_TRIES - tries - 1 });
  }

  pickup(auth: AuthContext, listingId: string, code: string): ListingRow {
    const { l, pickup } = this.myTask(auth, listingId, "volunteer_assigned");
    this.checkCode(l, "pickup", code, auth.userId);
    pickup.picked_up_at = this.now().toISOString();
    this.setStatus(l, ["volunteer_assigned"], "picked_up", auth.userId);
    return l;
  }

  deliver(auth: AuthContext, listingId: string, code: string, mealsDelivered: number): ListingRow {
    const { repo } = this;
    const { l, pickup } = this.myTask(auth, listingId, "picked_up");
    if (mealsDelivered > l.total_meals) throw new AppError("VALIDATION_FAILED");
    this.checkCode(l, "delivery", code, auth.userId);
    pickup.meals_delivered = mealsDelivered;
    pickup.delivered_at = this.now().toISOString();
    const need = repo.needFor(pickup.receiver_org_id);
    if (need) need.meals_received = Math.max(0, need.meals_received - l.total_meals + mealsDelivered);
    const rcv = repo.orgById(pickup.receiver_org_id);
    if (rcv) rcv.reliability = Math.round((0.9 * rcv.reliability + 0.1) * 1000) / 1000; // ponytail: simple moving average
    this.touchOrg(pickup.receiver_org_id);
    this.setStatus(l, ["picked_up"], "delivered", auth.userId);
    return l;
  }

  // ---- scheduler: run every 30 s ----
  tick(): void {
    const nowMs = this.now().getTime();
    for (const l of this.repo.allListings()) {
      if (ACTIVE.includes(l.status) && Date.parse(l.pickup_by) <= nowMs) {
        this.setStatus(l, ACTIVE, "expired", null);
        this.closePendingOffers(l);
        this.releaseNeed(l);
      }
    }
    for (const o of [...this.repo.offers]) {
      if (o.status === "pending" && Date.parse(o.expires_at) <= nowMs) {
        o.status = "expired";
        const l = this.repo.listingById(o.listing_id);
        if (l) {
          this.log(l.id, "offer_timeout", null);
          this.advance(l);
        }
      }
    }
    for (const l of this.repo.allListings()) {
      if (l.status === "posted") this.startCascade(l); // no receiver was eligible earlier; try again
    }
  }
}
