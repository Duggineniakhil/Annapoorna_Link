import { createHash } from "node:crypto";
import type { Allergen, Category, DonorType, Storage } from "../schemas.js";

// Synthetic demo data (docs/04-sample-data-plan.md). Same output on every run.
export const SEED = 20261122;
export const ANCHOR_DATE = "2026-11-20"; // fixed "today" so re-runs match

export interface Area { name: string; lat: number; lng: number }
// Approximate centres; not yet checked on OpenStreetMap (doc 04 asks for that).
export const AREAS: Area[] = [
  { name: "Kukatpally", lat: 17.4849, lng: 78.4138 },
  { name: "Madhapur", lat: 17.4483, lng: 78.3915 },
  { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { name: "Ameerpet", lat: 17.4375, lng: 78.4483 },
  { name: "Begumpet", lat: 17.4435, lng: 78.4676 },
  { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
  { name: "Mehdipatnam", lat: 17.395, lng: 78.435 },
  { name: "Tolichowki", lat: 17.3996, lng: 78.4124 },
  { name: "Dilsukhnagar", lat: 17.3688, lng: 78.5247 },
  { name: "LB Nagar", lat: 17.3457, lng: 78.5522 },
  { name: "Uppal", lat: 17.4058, lng: 78.5591 },
  { name: "Kondapur", lat: 17.4619, lng: 78.364 },
];

export type ReceiverKind = "shelter" | "community_kitchen" | "ngo";

export interface OrgSeed {
  id: string;
  type: "donor" | "receiver";
  donor_type?: DonorType;
  kind?: ReceiverKind;
  name: string;
  area: string;
  veg_only?: boolean;
  open_from?: string;
  open_to?: string;
}

export const ORG_SEEDS: OrgSeed[] = [
  { id: "org-caterer-1", type: "donor", donor_type: "caterer", name: "Sri Sai Caterers", area: "Kukatpally" },
  { id: "org-caterer-2", type: "donor", donor_type: "caterer", name: "Royal Feast Caterers", area: "Madhapur" },
  { id: "org-caterer-3", type: "donor", donor_type: "caterer", name: "Sunrise Party Caterers", area: "Gachibowli" },
  { id: "org-caterer-4", type: "donor", donor_type: "caterer", name: "Golden Spoon Caterers", area: "Uppal" },
  { id: "org-hall-1", type: "donor", donor_type: "wedding_hall", name: "Lakshmi Gardens Function Hall", area: "Kondapur" },
  { id: "org-hall-2", type: "donor", donor_type: "wedding_hall", name: "Rose Garden Banquet", area: "Dilsukhnagar" },
  { id: "org-hall-3", type: "donor", donor_type: "wedding_hall", name: "Blue Lotus Convention Hall", area: "Secunderabad" },
  { id: "org-mess-1", type: "donor", donor_type: "hostel_mess", name: "Green Valley Hostel Mess", area: "Ameerpet" },
  { id: "org-mess-2", type: "donor", donor_type: "hostel_mess", name: "Maple Students Mess", area: "Tolichowki" },
  { id: "org-mess-3", type: "donor", donor_type: "hostel_mess", name: "Riverside College Mess", area: "LB Nagar" },
  { id: "org-rest-1", type: "donor", donor_type: "restaurant", name: "Spice Route Restaurant", area: "Begumpet" },
  { id: "org-rest-2", type: "donor", donor_type: "restaurant", name: "Chai Corner Family Restaurant", area: "Mehdipatnam" },
  { id: "org-rest-3", type: "donor", donor_type: "restaurant", name: "Biryani House Express", area: "Madhapur" },
  { id: "org-rest-4", type: "donor", donor_type: "restaurant", name: "Dosa Junction", area: "Kukatpally" },
  { id: "org-shelter-1", type: "receiver", kind: "shelter", name: "Asha Night Shelter", area: "Mehdipatnam", veg_only: true, open_from: "18:00", open_to: "23:00" },
  { id: "org-shelter-2", type: "receiver", kind: "shelter", name: "Hope Shelter Home", area: "Uppal", veg_only: true, open_from: "19:00", open_to: "23:30" },
  { id: "org-shelter-3", type: "receiver", kind: "shelter", name: "Sahaya Night Shelter", area: "Gachibowli", veg_only: false, open_from: "19:00", open_to: "23:30" },
  { id: "org-kitchen-1", type: "receiver", kind: "community_kitchen", name: "Annadanam Community Kitchen", area: "Begumpet", veg_only: false, open_from: "18:00", open_to: "23:00" },
  { id: "org-kitchen-2", type: "receiver", kind: "community_kitchen", name: "Nourish Community Kitchen", area: "Dilsukhnagar", veg_only: true, open_from: "18:00", open_to: "23:00" },
  { id: "org-kitchen-3", type: "receiver", kind: "community_kitchen", name: "Samudaya Community Kitchen", area: "Kondapur", veg_only: false, open_from: "18:30", open_to: "23:00" },
  { id: "org-ngo-1", type: "receiver", kind: "ngo", name: "Hope Street Foundation", area: "Secunderabad", veg_only: false, open_from: "09:00", open_to: "22:00" },
  { id: "org-ngo-2", type: "receiver", kind: "ngo", name: "Helping Hands Trust", area: "Ameerpet", veg_only: false, open_from: "09:00", open_to: "22:00" },
  { id: "org-ngo-3", type: "receiver", kind: "ngo", name: "Bright Tomorrow NGO", area: "Madhapur", veg_only: false, open_from: "10:00", open_to: "21:00" },
];

// Demo accounts (doc 04 section 4). The user id equals the account id for these.
export const DEMO_ACCOUNTS = [
  { account_id: "demo-donor-sri-sai", role: "donor", label: "Sri Sai Caterers", area: "Kukatpally", org_id: "org-caterer-1" },
  { account_id: "demo-donor-green-valley", role: "donor", label: "Green Valley Hostel Mess", area: "Ameerpet", org_id: "org-mess-1" },
  { account_id: "demo-receiver-asha", role: "receiver", label: "Asha Night Shelter", area: "Mehdipatnam", org_id: "org-shelter-1" },
  { account_id: "demo-receiver-annadanam", role: "receiver", label: "Annadanam Community Kitchen", area: "Begumpet", org_id: "org-kitchen-1" },
  { account_id: "demo-volunteer-ravi", role: "volunteer", label: "Ravi K.", area: "Kukatpally", org_id: null },
  { account_id: "demo-sponsor", role: "sponsor", label: "Demo CSR Sponsor", area: "Hyderabad", org_id: null },
] as const;

const VOLUNTEER_NAMES = ["Ravi K.", "Priya M.", "Kiran S.", "Anjali R.", "Mohammed A.", "Sneha P.", "Vamsi T.", "Lakshmi N.", "Arjun D.", "Meera G."];

const CATS_BY_STORAGE: Record<Storage, Category[]> = {
  hot: ["rice_dish", "curry"],
  room: ["bread", "dry_snack", "sweet"],
  chilled: ["dairy_based", "salad_cut_fruit", "sweet"],
};
const STORAGE_BY_DONOR: Record<DonorType, Storage[]> = {
  caterer: ["hot", "hot", "hot", "room"],
  wedding_hall: ["hot", "hot", "room"],
  hostel_mess: ["room", "room", "chilled"],
  restaurant: ["room", "chilled", "chilled"],
};
const QTY_BY_DONOR: Record<DonorType, [number, number]> = {
  caterer: [50, 300],
  wedding_hall: [100, 400],
  hostel_mess: [20, 60],
  restaurant: [10, 40],
};
const NEED_BY_KIND: Record<ReceiverKind, [number, number]> = {
  shelter: [60, 150],
  community_kitchen: [100, 250],
  ngo: [50, 200],
};
const ITEM_NAMES: Record<Category, { veg: string[]; nonveg: string[] }> = {
  rice_dish: { veg: ["Veg biryani", "Pulihora"], nonveg: ["Chicken biryani"] },
  curry: { veg: ["Dal", "Sambar", "Paneer curry"], nonveg: ["Chicken curry"] },
  bread: { veg: ["Chapati", "Puri"], nonveg: [] },
  dry_snack: { veg: ["Samosa", "Vada", "Pakoda"], nonveg: [] },
  sweet: { veg: ["Gulab jamun", "Double ka meetha"], nonveg: [] },
  dairy_based: { veg: ["Curd rice", "Raita", "Payasam"], nonveg: [] },
  salad_cut_fruit: { veg: ["Fresh salad", "Cut fruit"], nonveg: [] },
};
const WINDOW_MIN: Record<Storage, { max: number; serve: number; en: string; te: string }> = {
  hot: { max: 180, serve: 240, en: "Keep covered and hot. Deliver and serve quickly.", te: "మూతపెట్టి వేడిగా ఉంచండి. వెంటనే చేరవేసి వడ్డించండి." },
  room: { max: 90, serve: 120, en: "Do not keep at room temperature for long. Serve within 2 hours of cooking.", te: "గది ఉష్ణోగ్రత వద్ద ఎక్కువసేపు ఉంచవద్దు. వంట తర్వాత 2 గంటల్లో వడ్డించండి." },
  chilled: { max: 360, serve: 720, en: "Keep chilled during transport. Serve soon after delivery.", te: "రవాణా సమయంలో చల్లగా ఉంచండి. చేరిన వెంటనే వడ్డించండి." },
};
const STRICT_AT_ROOM: Category[] = ["dairy_based", "salad_cut_fruit"];

export interface GuidanceRow {
  food_category: Category; storage: Storage; max_window_minutes: number;
  serve_within_minutes: number; guidance_en: string; guidance_te: string;
}
export interface OrgRow {
  id: string; type: "donor" | "receiver"; donor_type: DonorType | null; name: string; area: string;
  lat: number; lng: number; veg_only: boolean; open_from: string | null; open_to: string | null; reliability: number;
}
export interface UserRow {
  id: string; org_id: string | null; role: "donor" | "receiver" | "volunteer" | "sponsor"; display_name: string;
  lang: "en" | "te"; vehicle: "two_wheeler" | "car" | null; capacity_meals: number | null; available: boolean;
}
export interface NeedRow { org_id: string; date: string; meals_needed: number; meals_received: number }
export interface ListingRow {
  id: string; donor_org_id: string; items: unknown; total_meals: number; veg: boolean; allergens: Allergen[];
  storage: Storage; cooked_at: string; pickup_by: string; status: string; created_at: string; posted_in_ms: number;
}
export interface OfferRow {
  id: string; listing_id: string; receiver_org_id: string; rank: number; score: number;
  reasons: { en: string; te: string }[]; status: string; expires_at: string;
}
export interface PickupRow {
  id: string; listing_id: string; receiver_org_id: string; volunteer_user_id: string; status: string;
  meals_delivered: number; picked_up_at: string; delivered_at: string;
}
export interface EventRow {
  listing_id: string; type: string; actor_user_id: string | null; data: Record<string, unknown>; created_at: string;
}
export interface SeedData {
  guidance: GuidanceRow[]; orgs: OrgRow[]; users: UserRow[]; receiver_needs: NeedRow[];
  listings: ListingRow[]; offers: OfferRow[]; pickups: PickupRow[]; events: EventRow[];
  demo_accounts: typeof DEMO_ACCOUNTS; capacity_exceptions: number;
}

export function makeRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const between = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));
const round = (n: number, d: number): number => Math.round(n * 10 ** d) / 10 ** d;
const pad = (n: number): string => String(n).padStart(2, "0");

function jitter(rng: Rng, area: Area): { lat: number; lng: number } {
  const metres = 500 * Math.sqrt(rng());
  const theta = rng() * 2 * Math.PI;
  const dLat = metres * Math.cos(theta) / 111320;
  const dLng = metres * Math.sin(theta) / (111320 * Math.cos((area.lat * Math.PI) / 180));
  return { lat: round(area.lat + dLat, 6), lng: round(area.lng + dLng, 6) };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function dayString(agoDays: number): string {
  const ms = Date.parse(`${ANCHOR_DATE}T00:00:00Z`) - agoDays * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function buildSeed(): SeedData {
  const rng = makeRng(SEED);
  const areaOf = (name: string): Area => AREAS.find((a) => a.name === name) as Area;
  const demoUserFor = (orgId: string) => DEMO_ACCOUNTS.find((d) => d.org_id === orgId)?.account_id;
  const userIdFor = (orgId: string): string => demoUserFor(orgId) ?? `usr-${orgId}`;

  const orgs: OrgRow[] = ORG_SEEDS.map((o) => {
    const c = jitter(rng, areaOf(o.area));
    return {
      id: o.id, type: o.type, donor_type: o.donor_type ?? null, name: o.name, area: o.area,
      lat: c.lat, lng: c.lng, veg_only: o.veg_only ?? false, open_from: o.open_from ?? null,
      open_to: o.open_to ?? null, reliability: 0.8,
    };
  });

  const users: UserRow[] = ORG_SEEDS.map((o) => ({
    id: userIdFor(o.id),
    org_id: o.id,
    role: o.type === "donor" ? "donor" : "receiver",
    display_name: `${o.name} desk`,
    lang: rng() < 0.3 ? "te" : "en",
    vehicle: null,
    capacity_meals: null,
    available: false,
  }));
  VOLUNTEER_NAMES.forEach((name, i) => {
    const car = i >= 6;
    users.push({
      id: i === 0 ? "demo-volunteer-ravi" : `usr-vol-${pad(i + 1)}`,
      org_id: null,
      role: "volunteer",
      display_name: name,
      lang: rng() < 0.3 ? "te" : "en",
      vehicle: car ? "car" : "two_wheeler",
      capacity_meals: car ? 150 : 40,
      available: i === 0 ? true : rng() < 0.7,
    });
  });
  users.push({ id: "demo-sponsor", org_id: null, role: "sponsor", display_name: "Demo CSR Sponsor", lang: "en", vehicle: null, capacity_meals: null, available: false });
  const volunteers = users.filter((u) => u.role === "volunteer");

  const receiver_needs: NeedRow[] = ORG_SEEDS.filter((o) => o.type === "receiver").map((o) => {
    const [lo, hi] = NEED_BY_KIND[o.kind as ReceiverKind];
    return { org_id: o.id, date: ANCHOR_DATE, meals_needed: between(rng, lo, hi), meals_received: between(rng, 0, 20) };
  });

  const guidance: GuidanceRow[] = [];
  const categories: Category[] = ["rice_dish", "curry", "bread", "dry_snack", "sweet", "dairy_based", "salad_cut_fruit"];
  const storages: Storage[] = ["hot", "room", "chilled"];
  for (const c of categories) {
    for (const s of storages) {
      const w = WINDOW_MIN[s];
      const strict = s === "room" && STRICT_AT_ROOM.includes(c);
      guidance.push({
        food_category: c, storage: s, max_window_minutes: strict ? 60 : w.max,
        serve_within_minutes: w.serve, guidance_en: w.en, guidance_te: w.te,
      });
    }
  }

  // 30 days of history: weekend days weighted 2x.
  const dayPool: number[] = [];
  for (let ago = 1; ago <= 30; ago++) {
    const dow = new Date(Date.parse(`${dayString(ago)}T00:00:00Z`)).getUTCDay();
    const weight = dow === 0 || dow === 6 ? 2 : 1;
    for (let k = 0; k < weight; k++) dayPool.push(ago);
  }

  const N = 120;
  const statuses: string[] = [];
  for (let i = 0; i < N; i++) statuses.push(i < 108 ? "delivered" : i < 116 ? "expired" : "cancelled");
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  const donors = orgs.filter((o) => o.type === "donor");
  const receivers = orgs.filter((o) => o.type === "receiver");
  type Item = { name: string; category: Category; qty_meals: number };
  const drafts: { donor: OrgRow; status: string; storage: Storage; items: Item[]; veg: boolean; allergens: Allergen[]; cookedAt: string; pickupBy: string; createdAt: string; postedMs: number }[] = [];

  for (let i = 0; i < N; i++) {
    const donor = pick(rng, donors);
    const dt = donor.donor_type as DonorType;
    const storage = pick(rng, STORAGE_BY_DONOR[dt]);
    const n = between(rng, 1, 3);
    const [qlo, qhi] = QTY_BY_DONOR[dt];
    const total = between(rng, qlo, qhi);
    let veg = true;
    const items: Item[] = [];
    for (let k = 0; k < n; k++) {
      const category = pick(rng, CATS_BY_STORAGE[storage]);
      const names = ITEM_NAMES[category];
      let name: string;
      if (names.nonveg.length > 0 && rng() < 0.25) {
        name = pick(rng, names.nonveg);
        veg = false;
      } else {
        name = pick(rng, names.veg);
      }
      const share = k === n - 1 ? total - Math.floor(total / n) * (n - 1) : Math.floor(total / n);
      items.push({ name, category, qty_meals: Math.max(1, share) });
    }
    const cats = items.map((it) => it.category);
    const allergenSet = new Set<Allergen>();
    if (cats.includes("dairy_based")) allergenSet.add("dairy");
    if (cats.includes("sweet") && rng() < 0.5) allergenSet.add("nuts");
    if (cats.includes("bread") && rng() < 0.4) allergenSet.add("gluten");
    const ago = pick(rng, dayPool);
    const cookedMin = between(rng, 20 * 60 + 30, 23 * 60 + 59);
    const cookedAt = `${dayString(ago)}T${pad(Math.floor(cookedMin / 60))}:${pad(cookedMin % 60)}:00+05:30`;
    const cookedMs = Date.parse(cookedAt);
    const strict = storage === "room" && cats.some((c) => STRICT_AT_ROOM.includes(c));
    const maxMin = strict ? 60 : WINDOW_MIN[storage].max;
    const pickupBy = new Date(cookedMs + (maxMin - between(rng, 0, 10)) * 60000).toISOString();
    const createdAt = new Date(cookedMs + between(rng, 10, 40) * 60000).toISOString();
    drafts.push({
      donor, status: statuses[i], storage, items, veg,
      allergens: [...allergenSet].sort(), cookedAt, pickupBy, createdAt,
      postedMs: between(rng, 18000, 58000),
    });
  }
  drafts.sort((a, b) => Date.parse(a.cookedAt) - Date.parse(b.cookedAt));

  const listings: ListingRow[] = [];
  const offers: OfferRow[] = [];
  const pickups: PickupRow[] = [];
  const events: EventRow[] = [];
  let capacityExceptions = 0;
  let offerSeq = 0;
  let pickupSeq = 0;

  drafts.forEach((d, idx) => {
    const lid = `lst-${pad(idx + 1)}`;
    const total = d.items.reduce((s, it) => s + it.qty_meals, 0);
    const posted = d.createdAt;
    const at = (min: number) => new Date(Date.parse(posted) + min * 60000).toISOString();
    listings.push({
      id: lid, donor_org_id: d.donor.id, items: d.items, total_meals: total, veg: d.veg,
      allergens: d.allergens, storage: d.storage, cooked_at: d.cookedAt, pickup_by: d.pickupBy,
      status: d.status, created_at: posted, posted_in_ms: d.postedMs,
    });
    events.push({ listing_id: lid, type: "posted", actor_user_id: userIdFor(d.donor.id), data: {}, created_at: posted });

    if (d.status === "cancelled") {
      events.push({ listing_id: lid, type: "cancelled", actor_user_id: userIdFor(d.donor.id), data: {}, created_at: at(5) });
      return;
    }
    events.push({ listing_id: lid, type: "offered", actor_user_id: null, data: {}, created_at: at(1) });

    if (d.status === "expired") {
      const decoy = pick(rng, receivers);
      offerSeq += 1;
      offers.push({
        id: `ofr-${pad(offerSeq)}`, listing_id: lid, receiver_org_id: decoy.id, rank: 1,
        score: round(0.5 + rng() * 0.3, 4), reasons: [], status: "expired",
        expires_at: at(11),
      });
      events.push({ listing_id: lid, type: "expired", actor_user_id: null, data: {}, created_at: d.pickupBy });
      return;
    }

    // delivered
    const offerCount = between(rng, 1, 3);
    const order = [...receivers].sort(() => rng() - 0.5).slice(0, offerCount);
    const accepted = order[order.length - 1];
    order.forEach((rcv, r) => {
      const isLast = r === order.length - 1;
      const dist = round(km(d.donor, rcv), 1);
      const need = receiver_needs.find((n) => n.org_id === rcv.id)?.meals_needed ?? 0;
      offerSeq += 1;
      offers.push({
        id: `ofr-${pad(offerSeq)}`, listing_id: lid, receiver_org_id: rcv.id, rank: r + 1,
        score: round(0.5 + rng() * 0.4, 4),
        reasons: [
          { en: `${dist} km away`, te: `${dist} కి.మీ దూరంలో` },
          { en: `needs ${need} meals today`, te: `ఈరోజు ${need} భోజనాలు అవసరం` },
          rcv.veg_only
            ? { en: "veg only", te: "శాకాహారం మాత్రమే" }
            : { en: "veg and non-veg accepted", te: "శాకాహారం, మాంసాహారం ఇద్దరూ" },
        ],
        status: isLast ? "accepted" : "declined",
        expires_at: at(10 * (r + 1)),
      });
    });

    const eligible = volunteers.filter((v) => (v.capacity_meals ?? 0) >= total);
    const vol = eligible.length > 0 ? pick(rng, eligible) : volunteers[volunteers.length - 1];
    if (eligible.length === 0) capacityExceptions += 1;
    const claimAt = at(3 + order.length);
    const assignAt = at(5 + order.length);
    const pickedMin = between(rng, 15, 40);
    const pickedAt = new Date(Date.parse(d.cookedAt) + pickedMin * 60000).toISOString();
    const deliveredAt = new Date(Date.parse(pickedAt) + between(rng, 10, 30) * 60000).toISOString();
    pickupSeq += 1;
    pickups.push({
      id: `pku-${pad(pickupSeq)}`, listing_id: lid, receiver_org_id: accepted.id,
      volunteer_user_id: vol.id, status: "delivered", meals_delivered: total,
      picked_up_at: pickedAt, delivered_at: deliveredAt,
    });
    events.push({ listing_id: lid, type: "claimed", actor_user_id: userIdFor(accepted.id), data: {}, created_at: claimAt });
    events.push({ listing_id: lid, type: "volunteer_assigned", actor_user_id: vol.id, data: {}, created_at: assignAt });
    events.push({ listing_id: lid, type: "picked_up", actor_user_id: vol.id, data: {}, created_at: pickedAt });
    events.push({ listing_id: lid, type: "delivered", actor_user_id: vol.id, data: {}, created_at: deliveredAt });
  });

  return {
    guidance, orgs, users, receiver_needs, listings, offers, pickups, events,
    demo_accounts: DEMO_ACCOUNTS, capacity_exceptions: capacityExceptions,
  };
}

export function fingerprint(data: SeedData): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
