import { createHash, randomInt, randomUUID } from "node:crypto";
import { buildSeed, DEMO_ACCOUNTS, type EventRow, type GuidanceRow, type ListingRow, type NeedRow, type OfferRow, type OrgRow, type SeedData, type UserRow } from "../seed/generate.js";
import type { Category, Storage } from "../schemas.js";
import type { RankedReceiver } from "../matching/index.js";
import { LIVE_EVENTS, LIVE_LISTINGS, LIVE_OFFERS, LIVE_PICKUPS, type PickupState } from "./liveFixtures.js";

// Codes for seeded/fixture listings only, derived from the listing id so re-runs match.
// Listings created through the API get random codes (see DemoRepo.newCodes).
export function derivedCode(listingId: string, kind: "pickup" | "delivery"): string {
  const digest = createHash("sha256").update(`${kind}:${listingId}`).digest();
  return String(digest.readUInt32BE(0) % 10000).padStart(4, "0");
}

export interface DemoAccount {
  account_id: string;
  role: "donor" | "receiver" | "volunteer" | "sponsor";
  label: string;
  area: string;
  org_id: string | null;
}

export const MAX_CODE_TRIES = 5;

// In-memory store: the seeded data plus the live fixtures. State is lost on restart
// (stub mode, X-Stub: true). Node runs one handler at a time, so each mutation is atomic.
export class DemoRepo {
  readonly accounts: readonly DemoAccount[] = DEMO_ACCOUNTS;
  readonly guidance: GuidanceRow[];
  readonly pickups: PickupState[];
  readonly offers: OfferRow[];
  readonly events: EventRow[];
  readonly queues = new Map<string, RankedReceiver[]>();
  private readonly orgs = new Map<string, OrgRow>();
  private readonly users = new Map<string, UserRow>();
  private readonly listings = new Map<string, ListingRow>();
  private readonly needs = new Map<string, NeedRow>();
  private readonly codes = new Map<string, string>();
  private readonly tries = new Map<string, number>();

  // live: add the hand-made test fixtures (stub mode only; a database-backed repo passes false).
  constructor(seed: Omit<SeedData, "pickups"> & { pickups: PickupState[] } = buildSeed(), opts: { live?: boolean } = {}) {
    const live = opts.live ?? true;
    seed.orgs.forEach((o) => this.orgs.set(o.id, { ...o }));
    seed.users.forEach((u) => this.users.set(u.id, u));
    seed.receiver_needs.forEach((n) => this.needs.set(n.org_id, { ...n })); // ascending date: latest wins
    [...seed.listings, ...(live ? LIVE_LISTINGS : [])].forEach((l) => this.listings.set(l.id, { ...l }));
    this.guidance = seed.guidance;
    this.offers = [...seed.offers, ...(live ? LIVE_OFFERS : [])].map((o) => ({ ...o }));
    this.pickups = [...seed.pickups, ...(live ? LIVE_PICKUPS : [])].map((p) => ({ ...p }));
    this.events = [...seed.events, ...(live ? LIVE_EVENTS : [])];
  }

  restoreCodes(c: { id: string; pickup_code: string | null; delivery_code: string | null; pickup_tries: number; delivery_tries: number }): void {
    if (c.pickup_code) this.codes.set(`pickup:${c.id}`, c.pickup_code);
    if (c.delivery_code) this.codes.set(`delivery:${c.id}`, c.delivery_code);
    this.tries.set(`pickup:${c.id}`, c.pickup_tries);
    this.tries.set(`delivery:${c.id}`, c.delivery_tries);
  }

  userRows(): UserRow[] {
    return [...this.users.values()];
  }

  newId(prefix: string): string {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }

  // Random, distinct 4-digit codes for a new listing.
  newCodes(listingId: string): void {
    const pickup = String(randomInt(0, 10000)).padStart(4, "0");
    let delivery = String(randomInt(0, 10000)).padStart(4, "0");
    while (delivery === pickup) delivery = String(randomInt(0, 10000)).padStart(4, "0");
    this.codes.set(`pickup:${listingId}`, pickup);
    this.codes.set(`delivery:${listingId}`, delivery);
  }
  codeFor(listingId: string, kind: "pickup" | "delivery"): string {
    return this.codes.get(`${kind}:${listingId}`) ?? derivedCode(listingId, kind);
  }
  triesFor(listingId: string, kind: "pickup" | "delivery"): number {
    return this.tries.get(`${kind}:${listingId}`) ?? 0;
  }
  setTries(listingId: string, kind: "pickup" | "delivery", n: number): void {
    this.tries.set(`${kind}:${listingId}`, n);
  }

  accountById(id: string): DemoAccount | undefined {
    return this.accounts.find((a) => a.account_id === id);
  }
  userById(id: string): UserRow | undefined {
    return this.users.get(id);
  }
  usersOfOrg(orgId: string): UserRow[] {
    return [...this.users.values()].filter((u) => u.org_id === orgId);
  }
  volunteers(): UserRow[] {
    return [...this.users.values()].filter((u) => u.role === "volunteer");
  }
  orgById(id: string): OrgRow | undefined {
    return this.orgs.get(id);
  }
  allOrgs(): OrgRow[] {
    return [...this.orgs.values()];
  }
  listingById(id: string): ListingRow | undefined {
    return this.listings.get(id);
  }
  allListings(): ListingRow[] {
    return [...this.listings.values()];
  }
  addListing(l: ListingRow): void {
    this.listings.set(l.id, l);
  }
  needFor(orgId: string): NeedRow | undefined {
    return this.needs.get(orgId);
  }
  remainingNeed(orgId: string): number {
    const n = this.needs.get(orgId);
    return n ? Math.max(0, n.meals_needed - n.meals_received) : 0;
  }
  pickupFor(listingId: string): PickupState | undefined {
    return this.pickups.find((p) => p.listing_id === listingId);
  }
  offerById(id: string): OfferRow | undefined {
    return this.offers.find((o) => o.id === id);
  }
  offersFor(listingId: string): OfferRow[] {
    return this.offers.filter((o) => o.listing_id === listingId);
  }
  eventsFor(listingId: string): EventRow[] {
    return this.events.filter((e) => e.listing_id === listingId);
  }
  guidanceFor(category: Category, storage: Storage): GuidanceRow | undefined {
    return this.guidance.find((g) => g.food_category === category && g.storage === storage);
  }
  setVolunteerAvailable(userId: string, available: boolean): void {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, available });
  }
}
