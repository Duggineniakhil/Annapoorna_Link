import { StatusSchema, type Listing, type ListingItem, type Offer, type Org, type Task, type TimelineEvent, type User } from "./schemas.js";
import type { AuthContext } from "./middleware/auth.js";
import { AppError } from "./errors.js";
import type { DemoRepo } from "./data/repo.js";
import { etaMin, haversineKm, pickVolunteer, volunteerLocation } from "./matching/index.js";
import type { ListingRow, OfferRow, OrgRow, UserRow } from "./seed/generate.js";

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new AppError("INTERNAL_ERROR");
  return value;
}

export function toOrg(o: OrgRow): Org {
  const out: Org = { id: o.id, type: o.type, name: o.name, area: o.area, lat: o.lat, lng: o.lng };
  if (o.donor_type) out.donor_type = o.donor_type;
  if (o.type === "receiver") out.veg_only = o.veg_only;
  if (o.open_from) out.open_from = o.open_from;
  if (o.open_to) out.open_to = o.open_to;
  return out;
}

export function toUser(u: UserRow): User {
  const out: User = { id: u.id, role: u.role, display_name: u.display_name, org_id: u.org_id, lang: u.lang, available: u.available };
  if (u.vehicle) out.vehicle = u.vehicle;
  if (u.capacity_meals !== null) out.capacity_meals = u.capacity_meals;
  return out;
}

// Who may see a listing at all. Sponsors are never parties to a listing.
export function isListingParty(repo: DemoRepo, l: ListingRow, viewer: AuthContext): boolean {
  const pickup = repo.pickupFor(l.id);
  if (viewer.role === "donor") return viewer.orgId === l.donor_org_id;
  if (viewer.role === "receiver") {
    return (!!pickup && viewer.orgId === pickup.receiver_org_id) || repo.offersFor(l.id).some((o) => o.receiver_org_id === viewer.orgId);
  }
  if (viewer.role === "volunteer") return !!pickup && pickup.volunteer_user_id === viewer.userId;
  return false;
}

// CODE VISIBILITY (decision D4): pickup_code only to the donor org; delivery_code only to the
// receiver org that claimed the listing. Volunteers and sponsors never get a code key at all.
export function toListing(repo: DemoRepo, l: ListingRow, viewer: AuthContext): Listing {
  const donor = required(repo.orgById(l.donor_org_id));
  const pickup = repo.pickupFor(l.id);
  const receiver = pickup ? repo.orgById(pickup.receiver_org_id) : undefined;
  const volunteer = pickup?.volunteer_user_id ? repo.userById(pickup.volunteer_user_id) : undefined;
  const items = l.items as ListingItem[];
  const firstCategory = items[0]?.category;
  const rule = firstCategory ? repo.guidanceFor(firstCategory, l.storage) : undefined;
  const serveMin = rule?.serve_within_minutes ?? 120;

  const listing: Listing = {
    id: l.id,
    donor_org: toOrg(donor),
    items,
    total_meals: l.total_meals,
    veg: l.veg,
    allergens: l.allergens,
    storage: l.storage,
    cooked_at: l.cooked_at,
    pickup_by: l.pickup_by,
    status: l.status as Listing["status"],
    created_at: l.created_at,
    posted_in_ms: l.posted_in_ms,
    receiver_org: receiver ? toOrg(receiver) : null,
    volunteer: volunteer ? { id: volunteer.id, display_name: volunteer.display_name, vehicle: volunteer.vehicle } : null,
    safety: {
      max_pickup_by: l.pickup_by,
      serve_by: new Date(Date.parse(l.cooked_at) + serveMin * 60000).toISOString(),
      guidance_en: rule?.guidance_en ?? "",
      guidance_te: rule?.guidance_te ?? "",
    },
  };

  const isDonor = viewer.role === "donor" && viewer.orgId === l.donor_org_id;
  const isClaimingReceiver = viewer.role === "receiver" && !!pickup && viewer.orgId === pickup.receiver_org_id;
  if (isDonor) listing.pickup_code = repo.codeFor(l.id, "pickup");
  if (isClaimingReceiver) listing.delivery_code = repo.codeFor(l.id, "delivery");
  return listing;
}

export function toTimeline(repo: DemoRepo, listingId: string): TimelineEvent[] {
  return repo.eventsFor(listingId).map((e) => {
    const actor = e.actor_user_id ? repo.userById(e.actor_user_id) : undefined;
    // Non-transition events (offer declined, timed out) show under "offered" with a note.
    const isStatus = StatusSchema.safeParse(e.type).success;
    const out: TimelineEvent = {
      type: e.type,
      status: isStatus ? (e.type as TimelineEvent["status"]) : "offered",
      at: e.created_at,
      // System events have no actor; they are attributed to the donor role. Known limitation.
      actor_role: actor?.role ?? "donor",
    };
    if (!isStatus) out.note = e.type;
    return out;
  });
}

function distanceKm(a: OrgRow, b: OrgRow): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function toOffer(repo: DemoRepo, o: OfferRow, viewer: AuthContext, now: Date): Offer {
  const l = required(repo.listingById(o.listing_id));
  const donor = required(repo.orgById(l.donor_org_id));
  const receiver = required(repo.orgById(o.receiver_org_id));
  const distance = distanceKm(donor, receiver);
  const pickup = repo.pickupFor(l.id);
  const assigned = pickup?.volunteer_user_id ? repo.userById(pickup.volunteer_user_id) : undefined;
  let volunteerName: string | null = null;
  let volunteerEta: number | null = null;
  if (assigned) {
    volunteerName = assigned.display_name.split(" ")[0];
    volunteerEta = etaMin(haversineKm(volunteerLocation(assigned), donor));
  } else if (o.status === "pending") {
    const best = pickVolunteer(l, donor, repo.volunteers(), now);
    if (best) {
      volunteerName = best.user.display_name.split(" ")[0];
      volunteerEta = best.eta_min;
    }
  }
  return {
    id: o.id,
    status: o.status as Offer["status"],
    listing: toListing(repo, l, viewer),
    rank: o.rank,
    score: o.score,
    reasons: o.reasons,
    expires_at: o.expires_at,
    distance_km: distance,
    eta_min: etaMin(distance),
    volunteer_first_name: volunteerName,
    volunteer_eta_min: volunteerEta,
  };
}

// Task id is the listing id. Volunteers never receive codes (toListing gives them none).
export function toTask(repo: DemoRepo, l: ListingRow, viewer: AuthContext): Task {
  const donor = required(repo.orgById(l.donor_org_id));
  const pickup = required(repo.pickupFor(l.id));
  const receiver = required(repo.orgById(pickup.receiver_org_id));
  return {
    id: l.id,
    listing: toListing(repo, l, viewer),
    donor_org: toOrg(donor),
    receiver_org: toOrg(receiver),
    distance_km: distanceKm(donor, receiver),
    deadline: l.pickup_by,
  };
}
