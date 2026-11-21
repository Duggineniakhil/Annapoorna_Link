import type { DemoRepo } from "../data/repo.js";
import type { ListingRow } from "../seed/generate.js";
import type { DonorType, Impact, ListingItem } from "../schemas.js";
import { CO2E_PER_KG, CO2E_SOURCE, KG_PER_MEAL } from "./config.js";

const round = (n: number, d = 1): number => Math.round(n * 10 ** d) / 10 ** d;

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const ASSUMPTIONS: Impact["assumptions"] = [
  { key: "kg_per_meal", label_en: "Kilograms of food per meal", label_te: "ఒక భోజనానికి ఆహారం (కిలోలు)", value: KG_PER_MEAL, source: "Team assumption" },
  { key: "co2e_per_kg", label_en: "kg CO2e avoided per kg of food waste avoided", label_te: "ఆదా అయిన ప్రతి కిలో ఆహార వ్యర్థానికి CO2e (కిలోలు)", value: CO2E_PER_KG, source: CO2E_SOURCE },
  { key: "counting_rule", label_en: "Only meals confirmed delivered with the handover code are counted. Expired and cancelled listings count as zero.", label_te: "హ్యాండోవర్ కోడ్‌తో డెలివరీ నిర్ధారించిన భోజనాలను మాత్రమే లెక్కిస్తాము. గడువు ముగిసిన లేదా రద్దైన వాటికి సున్నా.", value: "delivered only" },
];

// Meals delivered for one listing. kg is the donor's own figure when every item has one.
function deliveredOf(repo: DemoRepo, l: ListingRow): { meals: number; kg: number } {
  const meals = repo.pickupFor(l.id)?.meals_delivered ?? 0;
  const items = l.items as ListingItem[];
  const allKg = items.length > 0 && items.every((i) => i.qty_kg !== undefined);
  const kg =
    allKg && l.total_meals > 0
      ? (items.reduce((s, i) => s + (i.qty_kg ?? 0), 0) * meals) / l.total_meals
      : meals * KG_PER_MEAL;
  return { meals, kg };
}

export interface ImpactFilter {
  donorOrgId?: string;
  from?: string;
  to?: string;
}

type Totals = { meals: number; kg: number };

export function computeImpact(repo: DemoRepo, f: ImpactFilter): Impact {
  const fromMs = f.from ? Date.parse(f.from) : -Infinity;
  const toMs = f.to ? Date.parse(f.to) : Infinity;
  const scoped = repo.allListings().filter((l) => {
    const t = Date.parse(l.created_at);
    return (!f.donorOrgId || l.donor_org_id === f.donorOrgId) && t >= fromMs && t <= toMs;
  });
  const delivered = scoped.filter((l) => l.status === "delivered");
  const posted = scoped.filter((l) => l.status !== "cancelled");

  let meals = 0;
  let kg = 0;
  let onTime = 0;
  const claimMins: number[] = [];
  const byArea = new Map<string, Totals>();
  const byType = new Map<DonorType, Totals>();
  const bump = <K,>(m: Map<K, Totals>, k: K, d: Totals) => {
    const cur = m.get(k) ?? { meals: 0, kg: 0 };
    m.set(k, { meals: cur.meals + d.meals, kg: cur.kg + d.kg });
  };

  for (const l of delivered) {
    const d = deliveredOf(repo, l);
    meals += d.meals;
    kg += d.kg;
    const pickedAt = repo.pickupFor(l.id)?.picked_up_at;
    if (pickedAt && Date.parse(pickedAt) <= Date.parse(l.pickup_by)) onTime += 1;
    const donor = repo.orgById(l.donor_org_id);
    if (donor) {
      bump(byArea, donor.area, d);
      if (donor.donor_type) bump(byType, donor.donor_type, d);
    }
  }
  for (const l of scoped) {
    const claimed = repo.eventsFor(l.id).find((e) => e.type === "claimed");
    if (claimed) claimMins.push((Date.parse(claimed.created_at) - Date.parse(l.created_at)) / 60000);
  }

  const co2 = (k: number) => round(k * CO2E_PER_KG);
  const out: Impact = {
    meals,
    kg: round(kg),
    co2e_kg: co2(kg),
    on_time_rate: delivered.length ? round(onTime / delivered.length, 3) : 0,
    median_claim_min: round(median(claimMins)),
    rescue_rate: posted.length ? round(delivered.length / posted.length, 3) : 0,
    assumptions: ASSUMPTIONS,
  };
  if (!f.donorOrgId) {
    out.by_area = [...byArea].map(([area, v]) => ({ area, meals: v.meals, kg: round(v.kg), co2e_kg: co2(v.kg) }));
    out.by_donor_type = [...byType].map(([donor_type, v]) => ({ donor_type, meals: v.meals, kg: round(v.kg), co2e_kg: co2(v.kg) }));
  }
  return out;
}
