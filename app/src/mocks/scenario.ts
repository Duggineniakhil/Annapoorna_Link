import {
  assignVolunteer,
  claimListing,
  createListing,
  guidanceFor,
  markDelivered,
  markOffered,
  markPickedUp,
} from "./listings";
import { emitListingEvent } from "./events";
import { orgDistanceKm } from "./fixtures";

// POST /api/demo/scenario { name: "wedding_night" } mock (A14), mirroring B13
// (server/src/services/scenario.ts): Sri Sai Caterers posts 150 plates (veg biryani 100 + dal 50,
// hot, cooked 30 minutes ago); at 20 s Annadanam accepts and a car volunteer takes the run, at 40 s
// the food is picked up, at 60 s it is delivered. Every step sends a live event. One at a time.

export const SCENARIO_NAMES = ["wedding_night"] as const;
export const SCENARIO_DELAYS_MS: [number, number, number] = [20_000, 40_000, 60_000];
/** Matching sends the offer a moment after posting. */
export const OFFER_DELAY_MS = 2_000;

const DONOR_ORG = "org-sri-sai";
const RECEIVER_ORG = "org-annadanam";
const VOLUNTEER = { name: "Arjun", vehicle: "car" };
const MINUTE_MS = 60_000;

let running = false;

export function scenarioRunning(): boolean {
  return running;
}

type Timer = (fn: () => void, ms: number) => unknown;

/**
 * Starts the wedding-night scenario. Returns the new listing id, or null when one is already
 * running. `schedule` is setTimeout (tests pass their own).
 */
export function runWeddingNight(
  nowMs = Date.now(),
  delays: [number, number, number] = SCENARIO_DELAYS_MS,
  schedule: Timer = (fn, ms) => setTimeout(fn, ms),
  clock: () => number = Date.now,
): string | null {
  if (running) return null;
  const cookedAt = new Date(nowMs - 30 * MINUTE_MS);
  const items = [
    { name: "Veg biryani", category: "rice_dish" as const, qty_meals: 100 },
    { name: "Dal", category: "curry" as const, qty_meals: 50 },
  ];
  // Two hours, or the safe limit if that is sooner.
  const safeMax = Date.parse(
    guidanceFor({
      items: items.map((i) => ({ category: i.category, veg: true })),
      storage: "hot",
      cooked_at: cookedAt,
    }).max_pickup_by,
  );
  const pickupBy = Math.min(nowMs + 2 * 60 * MINUTE_MS, safeMax);
  const created = createListing(
    DONOR_ORG,
    {
      items,
      veg: true,
      allergens: [],
      storage: "hot",
      cooked_at: cookedAt.toISOString(),
      pickup_by: new Date(pickupBy).toISOString(),
      posted_in_ms: 42_000,
    },
    nowMs,
  );
  if (!created.ok) return null;
  running = true;
  const id = created.listing.id;
  emitListingEvent(id, nowMs);

  // A step that no longer applies (someone cancelled or took it by hand) ends the scenario.
  const step = (ms: number, fn: (at: number) => unknown, last = false) =>
    schedule(() => {
      const at = clock();
      if (!fn(at)) {
        running = false;
        return;
      }
      emitListingEvent(id, at);
      if (last) running = false;
    }, ms);

  step(OFFER_DELAY_MS, (at) => markOffered(id, at));
  step(delays[0], (at) => {
    const km = orgDistanceKm(DONOR_ORG, RECEIVER_ORG) ?? 5;
    if (!claimListing(id, RECEIVER_ORG, km, at)) return false;
    emitListingEvent(id, at);
    return assignVolunteer(id, VOLUNTEER.name, VOLUNTEER.vehicle, at);
  });
  step(delays[1], (at) => markPickedUp(id, at));
  step(delays[2], (at) => markDelivered(id, at, created.listing.total_meals), true);
  return id;
}

/** Test helper: forget a running scenario. */
export function resetScenario(): void {
  running = false;
}
