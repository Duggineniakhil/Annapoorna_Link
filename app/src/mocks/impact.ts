import type {
  DonorType,
  ImpactAssumption,
  ImpactBreakdown,
  ImpactReport,
  ImpactWeek,
  Listing,
} from "../types/api";
import { ORGS } from "./fixtures";
import { listingStore } from "./listings";

// GET /api/impact (docs/11): every number comes from deliveries, with the assumptions shown.
//
// Only food confirmed delivered counts. Expired or cancelled listings count as zero.
// The mock has ten weeks of demo history per donor (deterministic, so a given day always shows
// the same numbers) plus whatever was delivered in this demo session.

/** [A] Assumption: average weight of one meal (docs/11 §1). */
export const KG_PER_MEAL = 0.4;
/**
 * [V] kg CO₂e per kg of food waste avoided. FAO (2013) puts food wastage at about 1.3 billion
 * tonnes a year with a footprint of about 3.3 Gt CO₂e, which is about 2.5 kg CO₂e per kg.
 */
export const CO2E_PER_KG = 2.5;
export const CO2E_SOURCE = "FAO (2013), Food Wastage Footprint: Impacts on Natural Resources";

export const ASSUMPTIONS: ImpactAssumption[] = [
  {
    key: "kg_per_meal",
    label_en: "Food per meal (kg)",
    label_te: "ఒక్క భోజనానికి ఆహారం (కి.గ్రా.)",
    value: KG_PER_MEAL,
  },
  {
    key: "co2e_per_kg",
    label_en: "CO₂e avoided per kg of food (kg)",
    label_te: "ఒక కి.గ్రా. ఆహారానికి తగ్గిన CO₂e (కి.గ్రా.)",
    value: CO2E_PER_KG,
    source: CO2E_SOURCE,
  },
];

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const HISTORY_DAYS = 70;

/** One finished listing, as the impact calculation sees it. */
export interface ImpactRecord {
  id: string;
  donor_org: string;
  status: "delivered" | "expired" | "cancelled";
  meals: number;
  /** Delivered kg when the donor entered kg; otherwise meals × KG_PER_MEAL is used. */
  kg?: number;
  posted_at: number;
  claimed_at?: number;
  picked_up_at?: number;
  pickup_by: number;
  delivered_at?: number;
}

// Demo history

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

type Profile = { chance: (weekend: boolean) => number; min: number; max: number };

/** How often each donor type posts and how much (doc 04: weddings bring big, rarer batches). */
const PROFILE: Record<DonorType, Profile> = {
  wedding_hall: { chance: (weekend) => (weekend ? 0.8 : 0.15), min: 100, max: 400 },
  caterer: { chance: (weekend) => (weekend ? 0.7 : 0.45), min: 40, max: 150 },
  hostel_mess: { chance: () => 0.5, min: 20, max: 60 },
  restaurant: { chance: (weekend) => (weekend ? 0.6 : 0.35), min: 15, max: 50 },
};

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The demo record of one donor on one day, if any (same inputs, same output). */
function dayRecords(orgId: string, type: DonorType, dayStart: number): ImpactRecord[] {
  const day = Math.round(dayStart / DAY_MS);
  const random = rng(hash(`${orgId}:${day}`));
  const weekday = new Date(dayStart).getDay();
  const profile = PROFILE[type];
  if (random() > profile.chance(weekday === 0 || weekday === 6)) return [];
  const meals = Math.round(profile.min + random() * (profile.max - profile.min));
  const posted = dayStart + (19 + random() * 3) * 60 * MINUTE_MS; // evenings, 7 to 10 PM
  const pickupBy = posted + 90 * MINUTE_MS;
  const roll = random();
  const status: ImpactRecord["status"] =
    roll < 0.88 ? "delivered" : roll < 0.95 ? "expired" : "cancelled";
  const claimMin = 2 + Math.round(random() * 13);
  const onTime = random() < 0.94;
  const picked = onTime ? pickupBy - (10 + random() * 40) * MINUTE_MS : pickupBy + 10 * MINUTE_MS;
  return [
    {
      id: `hist-${orgId}-${day}`,
      donor_org: orgId,
      status,
      meals,
      posted_at: posted,
      pickup_by: pickupBy,
      claimed_at: status === "cancelled" ? undefined : posted + claimMin * MINUTE_MS,
      picked_up_at: status === "delivered" ? picked : undefined,
      delivered_at: status === "delivered" ? picked + 35 * MINUTE_MS : undefined,
    },
  ];
}

function historyRecords(nowMs: number): ImpactRecord[] {
  const today = startOfDay(nowMs);
  const donors = Object.values(ORGS).filter((o) => o.type === "donor" && o.donor_type);
  const records: ImpactRecord[] = [];
  // Yesterday and before: today's food is in the live demo listings.
  for (let i = 1; i <= HISTORY_DAYS; i += 1) {
    const dayStart = today - i * DAY_MS;
    for (const org of donors) records.push(...dayRecords(org.id, org.donor_type!, dayStart));
  }
  return records;
}

// Live demo listings

function timeOf(listing: Listing, status: string): number | undefined {
  const at = listing.timeline?.filter((e) => e.status === status).pop()?.at;
  return at ? Date.parse(at) : undefined;
}

function liveRecords(): ImpactRecord[] {
  return listingStore
    .filter((l) => ["delivered", "expired", "cancelled"].includes(l.status))
    .map((l) => ({
      id: l.id,
      donor_org: l.donor_org,
      status: l.status as ImpactRecord["status"],
      meals: l.total_meals,
      kg: l.items.every((i) => i.qty_kg !== undefined)
        ? l.items.reduce((sum, i) => sum + (i.qty_kg ?? 0), 0)
        : undefined,
      posted_at: Date.parse(l.created_at),
      claimed_at: timeOf(l, "claimed"),
      picked_up_at: timeOf(l, "picked_up"),
      pickup_by: Date.parse(l.pickup_by),
      delivered_at: timeOf(l, "delivered"),
    }));
}

// Formulas (docs/11 §1)

const round2 = (n: number) => Math.round(n * 100) / 100;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Monday 00:00 of the week containing ms (local time). */
export function weekStart(ms: number): number {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Adds days in local time (safe across DST changes). */
function addDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function computeImpact(
  records: ImpactRecord[],
  fromMs: number,
  toMs: number,
): Omit<ImpactReport, "by_area" | "by_donor_type"> {
  // A listing belongs to the period it was posted in.
  const inRange = records.filter((r) => r.posted_at >= fromMs && r.posted_at < toMs);
  const delivered = inRange.filter((r) => r.status === "delivered");
  const meals = delivered.reduce((sum, r) => sum + r.meals, 0);
  const kg = delivered.reduce((sum, r) => sum + (r.kg ?? r.meals * KG_PER_MEAL), 0);
  const onTime = delivered.filter(
    (r) => r.picked_up_at !== undefined && r.picked_up_at <= r.pickup_by,
  ).length;
  const notCancelled = inRange.filter((r) => r.status !== "cancelled").length;
  const claimMinutes = inRange
    .filter((r) => r.claimed_at !== undefined)
    .map((r) => (r.claimed_at! - r.posted_at) / MINUTE_MS);

  const weekly: ImpactWeek[] = [];
  for (let w = weekStart(fromMs); w < toMs; w = addDays(w, 7)) {
    const end = addDays(w, 7);
    weekly.push({
      // The first bar starts where the period starts (a month can begin mid-week).
      week_start: new Date(Math.max(w, fromMs)).toISOString(),
      meals: delivered
        .filter((r) => r.posted_at >= w && r.posted_at < end)
        .reduce((sum, r) => sum + r.meals, 0),
    });
  }

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    meals,
    kg: Math.round(kg),
    co2e_kg: Math.round(kg * CO2E_PER_KG),
    on_time_rate: delivered.length ? round2(onTime / delivered.length) : 0,
    median_claim_min: Math.round(median(claimMinutes)),
    rescue_rate: notCancelled ? round2(delivered.length / notCancelled) : 0,
    assumptions: ASSUMPTIONS.map((a) => ({ ...a })),
    weekly,
  };
}

function breakdown(
  records: ImpactRecord[],
  keyOf: (r: ImpactRecord) => string | undefined,
): ImpactBreakdown[] {
  const totals = new Map<string, number>();
  for (const r of records) {
    const key = keyOf(r);
    if (key) totals.set(key, (totals.get(key) ?? 0) + r.meals);
  }
  return [...totals.entries()]
    .map(([key, meals]) => ({ key, meals }))
    .sort((a, b) => b.meals - a.meals);
}

export function allRecords(nowMs = Date.now()): ImpactRecord[] {
  return [...historyRecords(nowMs), ...liveRecords()];
}

/** GET /api/impact. scope "me" is one donor org; "city" is everyone and adds breakdowns. */
export function impactReport(
  scope: "me" | "city",
  orgId: string | undefined,
  fromMs: number,
  toMs: number,
  nowMs = Date.now(),
): ImpactReport {
  const records = allRecords(nowMs).filter((r) => scope === "city" || r.donor_org === orgId);
  const report: ImpactReport = computeImpact(records, fromMs, toMs);
  if (scope === "city") {
    const delivered = records.filter(
      (r) => r.status === "delivered" && r.posted_at >= fromMs && r.posted_at < toMs,
    );
    report.by_area = breakdown(delivered, (r) => ORGS[r.donor_org]?.area);
    report.by_donor_type = breakdown(delivered, (r) => ORGS[r.donor_org]?.donor_type);
  }
  return report;
}
