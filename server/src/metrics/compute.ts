import type { DemoRepo } from "../data/repo.js";
import { computeImpact, median } from "../impact/calc.js";

export interface Spread {
  n: number;
  median: number;
  p90: number;
}

export interface Metrics {
  listings: number;
  claimMin: Spread; // posted -> claimed, minutes
  deliverMin: Spread; // posted -> delivered, minutes
  onTimeRate: number;
  rescueRate: number;
  expiryRate: number;
  medianPostSeconds: number;
  cascadeDepth: { mean: number; median: number }; // offers sent per delivered listing
  byDonorType: { donor_type: string; meals: number; kg: number }[];
  byArea: { area: string; meals: number; kg: number }[];
}

const round = (n: number, d = 1): number => Math.round(n * 10 ** d) / 10 ** d;

// Nearest-rank percentile: the smallest value with at least p% of the data at or below it.
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
}

const spread = (xs: number[]): Spread => ({ n: xs.length, median: round(median(xs)), p90: round(percentile(xs, 90)) });

export function computeMetrics(repo: DemoRepo): Metrics {
  const listings = repo.allListings();
  const claim: number[] = [];
  const deliver: number[] = [];
  const depth: number[] = [];
  for (const l of listings) {
    const posted = Date.parse(l.created_at);
    const events = repo.eventsFor(l.id);
    const claimed = events.find((e) => e.type === "claimed");
    const delivered = events.find((e) => e.type === "delivered");
    if (claimed) claim.push((Date.parse(claimed.created_at) - posted) / 60_000);
    if (delivered) {
      deliver.push((Date.parse(delivered.created_at) - posted) / 60_000);
      depth.push(repo.offersFor(l.id).length);
    }
  }

  const live = listings.filter((l) => l.status !== "cancelled");
  const impact = computeImpact(repo, {});
  return {
    listings: listings.length,
    claimMin: spread(claim),
    deliverMin: spread(deliver),
    onTimeRate: impact.on_time_rate,
    rescueRate: impact.rescue_rate,
    expiryRate: live.length ? round(live.filter((l) => l.status === "expired").length / live.length, 3) : 0,
    medianPostSeconds: round(median(listings.map((l) => l.posted_in_ms)) / 1000),
    cascadeDepth: {
      mean: depth.length ? round(depth.reduce((a, b) => a + b, 0) / depth.length, 2) : 0,
      median: median(depth),
    },
    byDonorType: (impact.by_donor_type ?? []).map(({ donor_type, meals, kg }) => ({ donor_type, meals, kg })),
    byArea: (impact.by_area ?? []).map(({ area, meals, kg }) => ({ area, meals, kg })).sort((a, b) => b.meals - a.meals),
  };
}

const pct = (x: number): string => `${round(x * 100)}%`;

export function renderMarkdown(m: Metrics): string {
  const rows = (items: { label: string; meals: number; kg: number }[]) =>
    items.map((r) => `| ${r.label} | ${r.meals} | ${r.kg} |`).join("\n");
  return `### Pitch metrics (based on demo data)

| Metric | Value |
|---|---|
| Listings posted | ${m.listings} |
| Time posted to claimed (median / p90) | ${m.claimMin.median} min / ${m.claimMin.p90} min (n=${m.claimMin.n}) |
| Time posted to delivered (median / p90) | ${m.deliverMin.median} min / ${m.deliverMin.p90} min (n=${m.deliverMin.n}) |
| On-time rate (picked up before pickup-by) | ${pct(m.onTimeRate)} |
| Rescue rate (delivered, excluding cancelled) | ${pct(m.rescueRate)} |
| Expiry rate (expired, excluding cancelled) | ${pct(m.expiryRate)} |
| Median donor posting time | ${m.medianPostSeconds} s |
| Offers sent before delivery (mean / median) | ${m.cascadeDepth.mean} / ${m.cascadeDepth.median} |

**Delivered meals and kg by donor type**

| Donor type | Meals | kg |
|---|---|---|
${rows(m.byDonorType.map((r) => ({ label: r.donor_type, meals: r.meals, kg: r.kg })))}

**Delivered meals and kg by area**

| Area | Meals | kg |
|---|---|---|
${rows(m.byArea.map((r) => ({ label: r.area, meals: r.meals, kg: r.kg })))}

_Only delivered food counts. kg uses 0.4 kg per meal unless the donor entered kg._
`;
}
