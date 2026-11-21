import type { MapData, MapDelivery } from "../types/api";
import { ORGS } from "./fixtures";
import { listingStore } from "./listings";

// GET /api/map (sponsor): donors and receivers at area level, and deliveries from the last 24 h.
// Demo deliveries are seeded relative to now; deliveries made in the demo are added on top.

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

const SEEDED: { id: string; donor: string; receiver: string; meals: number; hoursAgo: number }[] = [
  {
    id: "map-1",
    donor: "org-lakshmi-gardens",
    receiver: "org-annadanam",
    meals: 320,
    hoursAgo: 1.5,
  },
  { id: "map-2", donor: "org-sri-sai", receiver: "org-annadanam", meals: 60, hoursAgo: 2 },
  { id: "map-3", donor: "org-green-valley", receiver: "org-asha", meals: 30, hoursAgo: 3 },
  { id: "map-4", donor: "org-lakshmi-gardens", receiver: "org-asha", meals: 180, hoursAgo: 5 },
  { id: "map-5", donor: "org-spiceroute", receiver: "org-annadanam", meals: 40, hoursAgo: 9 },
  // Older than 24 h: not on the map.
  { id: "map-6", donor: "org-spiceroute", receiver: "org-asha", meals: 35, hoursAgo: 26 },
];

function deliveredAt(timeline: { status: string; at: string }[] | undefined): string | undefined {
  return timeline?.filter((e) => e.status === "delivered").pop()?.at;
}

export function mapData(nowMs = Date.now()): MapData {
  const orgs = Object.values(ORGS);
  const seeded: MapDelivery[] = SEEDED.map((d) => ({
    listing_id: d.id,
    donor_org: d.donor,
    receiver_org: d.receiver,
    meals: d.meals,
    delivered_at: new Date(nowMs - d.hoursAgo * HOUR_MS).toISOString(),
  }));
  const live: MapDelivery[] = listingStore
    .filter((l) => l.status === "delivered" && l.receiver_org)
    .map((l) => ({
      listing_id: l.id,
      donor_org: l.donor_org,
      receiver_org: l.receiver_org!,
      meals: l.total_meals,
      delivered_at: deliveredAt(l.timeline) ?? l.created_at,
    }));
  return {
    donors: orgs.filter((o) => o.type === "donor"),
    receivers: orgs.filter((o) => o.type === "receiver"),
    recent: [...live, ...seeded]
      .filter((d) => {
        const age = nowMs - Date.parse(d.delivered_at);
        return age >= 0 && age <= DAY_MS;
      })
      .sort((a, b) => Date.parse(b.delivered_at) - Date.parse(a.delivered_at)),
  };
}
