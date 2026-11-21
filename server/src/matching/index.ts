import { AREAS } from "../seed/generate.js";
import type { OrgRow, UserRow } from "../seed/generate.js";
import { DEMO_ACCOUNTS } from "../seed/generate.js";

// Pure matching rules (docs/02-product-spec.md section 4, task B7). No DB or clock access.
export const MATCH_CONFIG = {
  speedKmh: 20,
  handlingMin: 10,
  bufferMin: 15,
  maxProximityKm: 10,
  minNeedMeals: 20,
  minNeedShare: 0.25,
  weights: { proximity: 0.4, need: 0.3, timeSlack: 0.2, reliability: 0.1 },
} as const;
export type MatchConfig = typeof MATCH_CONFIG;

export interface Reason { en: string; te: string }
export interface Point { lat: number; lng: number }
export interface MatchListing { total_meals: number; veg: boolean; pickup_by: string }
export interface ReceiverCandidate { org: OrgRow; remaining: number }
export interface RankedReceiver {
  receiver_org_id: string; score: number; distance_km: number; eta_min: number; reasons: Reason[];
}
export interface VolunteerPick { user: UserRow; eta_min: number; distance_km: number }

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const round = (n: number, d: number): number => Math.round(n * 10 ** d) / 10 ** d;
const MIN = 60_000;

export function haversineKm(a: Point, b: Point): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const travelMin = (km: number, cfg: MatchConfig = MATCH_CONFIG): number => (km / cfg.speedKmh) * 60;
export const etaMin = (km: number, cfg: MatchConfig = MATCH_CONFIG): number => Math.round(travelMin(km, cfg) + cfg.handlingMin);

// Hyderabad is UTC+5:30 all year; receiver hours are local "HH:MM".
function istMinuteOfDay(ms: number): number {
  const m = Math.floor(ms / MIN) + 330;
  return ((m % 1440) + 1440) % 1440;
}
const hhmm = (s: string): number => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

export function isOpenAt(org: OrgRow, ms: number): boolean {
  if (!org.open_from || !org.open_to) return true;
  const t = istMinuteOfDay(ms);
  return t >= hhmm(org.open_from) && t <= hhmm(org.open_to);
}

export function rankReceivers(
  listing: MatchListing,
  donor: Point,
  candidates: ReceiverCandidate[],
  now: Date,
  cfg: MatchConfig = MATCH_CONFIG,
): RankedReceiver[] {
  const pickupByMs = Date.parse(listing.pickup_by);
  const ranked: RankedReceiver[] = [];
  for (const { org, remaining } of candidates) {
    if (org.veg_only && !listing.veg) continue;
    const km = haversineKm(donor, org);
    const eta = etaMin(km, cfg);
    const arrivalMs = now.getTime() + eta * MIN;
    if (!isOpenAt(org, arrivalMs)) continue;
    if (remaining < cfg.minNeedMeals && remaining < cfg.minNeedShare * listing.total_meals) continue;
    if (arrivalMs > pickupByMs + cfg.bufferMin * MIN) continue;

    const slackMin = (pickupByMs - arrivalMs) / MIN;
    const proximity = clamp01(1 - km / cfg.maxProximityKm);
    const need = clamp01(remaining / Math.max(1, listing.total_meals));
    const timeSlack = clamp01(slackMin / 60);
    const w = cfg.weights;
    const score = w.proximity * proximity + w.need * need + w.timeSlack * timeSlack + w.reliability * org.reliability;

    const d1 = round(km, 1);
    const factors: { value: number; reason: Reason }[] = [
      { value: w.proximity * proximity, reason: { en: `${d1} km away`, te: `${d1} కి.మీ దూరంలో` } },
      { value: w.need * need, reason: { en: `Needs ${remaining} meals today`, te: `ఈరోజు ${remaining} భోజనాలు అవసరం` } },
      { value: w.timeSlack * timeSlack, reason: { en: `${Math.max(0, Math.round(slackMin))} min to spare`, te: `${Math.max(0, Math.round(slackMin))} నిమిషాల వ్యవధి ఉంది` } },
      { value: w.reliability * org.reliability, reason: { en: "Reliable past pickups", te: "గత పికప్‌లు నమ్మదగినవి" } },
    ];
    if (org.veg_only && listing.veg) factors.push({ value: 0.05, reason: { en: "Veg accepted", te: "శాకాహారం స్వీకరిస్తారు" } });
    factors.sort((a, b) => b.value - a.value);

    ranked.push({
      receiver_org_id: org.id, score: round(score, 4), distance_km: d1, eta_min: eta,
      reasons: factors.slice(0, 3).map((f) => f.reason),
    });
  }
  return ranked.sort((a, b) => b.score - a.score || a.distance_km - b.distance_km);
}

// Volunteers have no stored location; demo accounts use their account area, the rest a stable
// hash of their id. ponytail: area-level guess, replace with a real location column if needed.
export function volunteerLocation(u: UserRow): Point {
  const area = DEMO_ACCOUNTS.find((a) => a.account_id === u.id)?.area;
  const found = AREAS.find((a) => a.name === area);
  if (found) return found;
  let h = 0;
  for (const ch of u.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AREAS[h % AREAS.length];
}

export function pickVolunteer(
  listing: MatchListing,
  donor: Point,
  volunteers: UserRow[],
  now: Date,
  cfg: MatchConfig = MATCH_CONFIG,
): VolunteerPick | null {
  let best: VolunteerPick | null = null;
  for (const user of volunteers) {
    if (!user.available || (user.capacity_meals ?? 0) < listing.total_meals) continue;
    const km = haversineKm(volunteerLocation(user), donor);
    const eta = etaMin(km, cfg);
    if (now.getTime() + eta * MIN > Date.parse(listing.pickup_by)) continue;
    if (!best || km < best.distance_km) best = { user, eta_min: eta, distance_km: km };
  }
  return best;
}
