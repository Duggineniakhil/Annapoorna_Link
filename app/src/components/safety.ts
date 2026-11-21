import type { Listing, Status } from "../types/api";

// Pure rules behind the SafetyCard (kept apart from the component so they can be unit-tested).

export type SafetyState = "ok" | "soon" | "urgent" | "expired";

const TEN_MIN = 10 * 60_000;
const THIRTY_MIN = 30 * 60_000;

/** Countdown colour band. Exactly 10 min left is "soon"; exactly 30 min left is "ok". */
export function safetyCountdownState(msLeft: number): SafetyState {
  if (msLeft <= 0) return "expired";
  if (msLeft < TEN_MIN) return "urgent";
  if (msLeft < THIRTY_MIN) return "soon";
  return "ok";
}

const BEFORE_PICKUP: Status[] = ["posted", "offered", "claimed", "volunteer_assigned"];
const AFTER_PICKUP: Status[] = ["picked_up", "delivered"];

export type SafetyCountdown =
  { kind: "pickup" | "serve"; target: string } | { kind: "expired" } | { kind: "none" };

/**
 * What the safety card counts down to, decided by status (doc 10):
 * before pickup → pickup_by; after pickup → serve_by; expired → the "do not use" state;
 * cancelled → nothing (the food is no longer moving through the app).
 */
export function safetyCountdown(
  listing: Pick<Listing, "status" | "pickup_by" | "safety">,
): SafetyCountdown {
  if (listing.status === "expired") return { kind: "expired" };
  if (BEFORE_PICKUP.includes(listing.status)) return { kind: "pickup", target: listing.pickup_by };
  if (AFTER_PICKUP.includes(listing.status))
    return { kind: "serve", target: listing.safety.serve_by };
  return { kind: "none" };
}
