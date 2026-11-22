import type { MapData, MapDelivery } from "../types/api";
import { ORGS } from "./fixtures";
import { listingStore, mealsDeliveredFor } from "./listings";

// GET /api/map (sponsor), same shape as the server: donors and receivers at area level, and the
// 10 newest deliveries as { listing_id, area (the donor's), meals, at }, newest first.
// Demo deliveries are seeded relative to now; deliveries made in the demo are added on top.

const HOUR_MS = 60 * 60_000;
export const MAP_RECENT_LIMIT = 10;

const SEEDED: { id: string; donor: string; meals: number; hoursAgo: number }[] = [
  {
    id: "map-1",
    donor: "org-lakshmi-gardens",

    meals: 320,
    hoursAgo: 1.5,
  },
  { id: "map-2", donor: "org-sri-sai", meals: 60, hoursAgo: 2 },
  { id: "map-3", donor: "org-green-valley", meals: 30, hoursAgo: 3 },
  { id: "map-4", donor: "org-lakshmi-gardens", meals: 180, hoursAgo: 5 },
  { id: "map-5", donor: "org-spiceroute", meals: 40, hoursAgo: 9 },
  { id: "map-6", donor: "org-spiceroute", meals: 35, hoursAgo: 26 },
];

function deliveredAt(timeline: { status: string; at: string }[] | undefined): string | undefined {
  return timeline?.filter((e) => e.status === "delivered").pop()?.at;
}

export function mapData(nowMs = Date.now()): MapData {
  const orgs = Object.values(ORGS);
  const seeded: MapDelivery[] = SEEDED.map((d) => ({
    listing_id: d.id,
    area: ORGS[d.donor]?.area,
    meals: d.meals,
    at: new Date(nowMs - d.hoursAgo * HOUR_MS).toISOString(),
  }));
  const live: MapDelivery[] = listingStore
    .filter((l) => l.status === "delivered")
    .map((l) => ({
      listing_id: l.id,
      area: ORGS[l.donor_org]?.area,
      meals: mealsDeliveredFor(l) ?? l.total_meals,
      at: deliveredAt(l.timeline) ?? l.created_at,
    }));
  return {
    donors: orgs.filter((o) => o.type === "donor"),
    receivers: orgs.filter((o) => o.type === "receiver"),
    recent: [...live, ...seeded]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, MAP_RECENT_LIMIT),
  };
}
