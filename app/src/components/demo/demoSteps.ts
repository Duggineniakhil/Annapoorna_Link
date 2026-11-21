import type { Listing } from "../../types/api";

// Wedding-night demo (A14): the steps the floating panel ticks through, and how a listing's
// status maps onto them. Kept free of React so it can be tested on its own.

export const SCENARIO_NAME = "wedding_night";
export const DEMO_STEPS = ["posted", "offered", "claimed", "picked_up", "delivered"] as const;
export type DemoStep = (typeof DEMO_STEPS)[number];

/** Index of the step a status has reached; -1 for statuses outside the flow. */
export function stepIndex(status: string | null | undefined): number {
  switch (status) {
    case "posted":
      return 0;
    case "offered":
      return 1;
    case "claimed":
    case "volunteer_assigned":
      return 2;
    case "picked_up":
      return 3;
    case "delivered":
      return 4;
    default:
      return -1;
  }
}

/** The run stopped early: someone cancelled the food or it ran out of time. */
export function isStopped(status: string | null | undefined): boolean {
  return status === "cancelled" || status === "expired";
}

/** Look back this far for the scenario's listing (it may have started a moment before we asked). */
export const LOOKBACK_MS = 3 * 60_000;

/**
 * The scenario's listing among the donor's listings: the newest 150-meal hot biryani posted since
 * the demo started (minus a margin for clock differences and an already-running demo).
 */
export function findScenarioListing(listings: Listing[], startedAtMs: number): Listing | undefined {
  return listings
    .filter(
      (l) =>
        Date.parse(l.created_at) >= startedAtMs - LOOKBACK_MS &&
        l.total_meals === 150 &&
        l.items.some((i) => /biryani/i.test(i.name)),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
}

export interface DemoState {
  phase: "idle" | "starting" | "running" | "done" | "stopped";
  startedAt?: number;
  listingId?: string;
  status?: string;
  /** Set when the start request found a demo already running (we follow that one). */
  joined?: boolean;
  error?: string;
}

const KEY = "annapoorna.demo";

export function readDemoState(): DemoState {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    return parsed && parsed.phase !== "starting" ? parsed : { phase: "idle" };
  } catch {
    return { phase: "idle" };
  }
}

export function writeDemoState(state: DemoState): void {
  try {
    if (state.phase === "idle") sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the panel lasts until the page reloads.
  }
}

/** "1:05" */
export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
