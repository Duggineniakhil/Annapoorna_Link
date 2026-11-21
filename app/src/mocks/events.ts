import {
  assignVolunteer,
  claimListing,
  listingStore,
  markDelivered,
  markPickedUp,
  reloadListings,
} from "./listings";
import { orgsOfferedListing, reloadReceiverState } from "./receiver";
import { reloadVolunteerState } from "./volunteer";
import type { LiveEvent } from "../services/liveEvents";
import type { Listing, Role, Status } from "../types/api";

// Mock live events (stand-in for GET /api/events).
//
// An event is sent when something really changes in the mock server (a listing is posted or
// cancelled, a kitchen accepts, a volunteer accepts, picks up or delivers). Like the real server,
// each subscriber only gets events about listings they are part of. Other tabs of the same browser
// hear about the change over a BroadcastChannel, reload the mock state from localStorage and get
// the event too, so a donor tab and a receiver tab update each other.
//
// For testing only, VITE_MOCK_AUTO_ADVANCE=true also moves one listing a step every 10 s.

export const MOCK_INTERVAL_MS = 10_000;
export const MOCK_EVENT_TYPE = "listing_status";
const CHANNEL = "al.mock.live";

/** Who is listening: the role and org of the signed-in user. */
export interface MockViewer {
  role: Role;
  org_id?: string;
}

interface Scope {
  donor_org: string;
  receiver_org?: string;
  /** Kitchens that were offered the food: told when it is taken or cancelled, so offers close. */
  offered_to: string[];
}

const CLOSES_OFFERS = ["claimed", "cancelled", "expired"];

interface Envelope {
  event: LiveEvent;
  scope: Scope;
}

/** The same rule the server uses: only parties to a listing hear about it. */
export function visibleTo(viewer: MockViewer, scope: Scope, status: string): boolean {
  switch (viewer.role) {
    case "donor":
      return scope.donor_org === viewer.org_id;
    case "receiver":
      if (viewer.org_id === undefined) return false;
      if (scope.receiver_org === viewer.org_id) return true;
      return CLOSES_OFFERS.includes(status) && scope.offered_to.includes(viewer.org_id);
    case "volunteer":
      // Volunteers see every claimed listing as a task, so they hear about all of them.
      return status !== "posted" && status !== "offered";
    default:
      return false;
  }
}

type Subscriber = { viewer: MockViewer; listener: (e: LiveEvent) => void };
const subscribers = new Set<Subscriber>();

function dispatch({ event, scope }: Envelope): void {
  for (const sub of [...subscribers]) {
    if (visibleTo(sub.viewer, scope, event.status)) sub.listener(event);
  }
}

const channel: BroadcastChannel | null =
  typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);

if (channel) {
  // In Node (tests) an open channel would keep the process alive.
  (channel as unknown as { unref?: () => void }).unref?.();
  channel.onmessage = (msg: MessageEvent<Envelope>) => {
    // Another tab changed the mock server: catch up from storage, then pass the event on.
    reloadMockState();
    dispatch(msg.data);
  };
}

/** Rebuilds the in-memory mock server from localStorage (listings, then claims, then tasks). */
export function reloadMockState(): void {
  reloadListings();
  reloadReceiverState();
  reloadVolunteerState();
}

function envelopeFor(listing: Listing, nowMs: number): Envelope {
  return {
    event: {
      type: MOCK_EVENT_TYPE,
      listing_id: listing.id,
      status: listing.status,
      at: new Date(nowMs).toISOString(),
    },
    scope: {
      donor_org: listing.donor_org,
      receiver_org: listing.receiver_org,
      offered_to: orgsOfferedListing(listing.id),
    },
  };
}

/** Called by the mock server after a change: tells this tab and the other tabs. */
export function emitListingEvent(listingId: string, nowMs: number = Date.now()): void {
  const listing = listingStore.find((l) => l.id === listingId);
  if (!listing) return;
  const envelope = envelopeFor(listing, nowMs);
  dispatch(envelope);
  channel?.postMessage(envelope);
}

// Test-only auto-advance.

const MOCK_RECEIVER_ORG = "org-annadanam";
const MOCK_DISTANCE_KM = 2;
const MOCK_VOLUNTEER = "Demo volunteer";
const ADVANCEABLE: Status[] = ["posted", "offered", "claimed", "volunteer_assigned", "picked_up"];

function stepListing(listing: Listing, nowMs: number): Listing | undefined {
  switch (listing.status) {
    case "posted":
    case "offered":
      return claimListing(listing.id, MOCK_RECEIVER_ORG, MOCK_DISTANCE_KM, nowMs);
    case "claimed":
      return assignVolunteer(listing.id, MOCK_VOLUNTEER, undefined, nowMs);
    case "volunteer_assigned":
      return markPickedUp(listing.id, nowMs);
    case "picked_up":
      return markDelivered(listing.id, nowMs);
    default:
      return undefined;
  }
}

/** Moves the first unfinished listing one step and sends its event. Null when nothing moved. */
export function advanceOnce(nowMs: number = Date.now()): LiveEvent | null {
  const target = listingStore.find((l) => ADVANCEABLE.includes(l.status));
  if (!target) return null;
  const moved = stepListing(target, nowMs);
  if (!moved) return null;
  const envelope = envelopeFor(moved, nowMs);
  dispatch(envelope);
  channel?.postMessage(envelope);
  return envelope.event;
}

const AUTO_ADVANCE = import.meta.env.VITE_MOCK_AUTO_ADVANCE === "true";
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Listens to mock events for this viewer until the returned function is called.
 * autoAdvance (default: VITE_MOCK_AUTO_ADVANCE) also runs the 10 s test ticker.
 */
export function subscribeMockEvents(
  viewer: MockViewer,
  listener: (e: LiveEvent) => void,
  options: { autoAdvance?: boolean; intervalMs?: number } = {},
): () => void {
  const sub: Subscriber = { viewer, listener };
  subscribers.add(sub);
  if ((options.autoAdvance ?? AUTO_ADVANCE) && timer === null) {
    timer = setInterval(() => advanceOnce(), options.intervalMs ?? MOCK_INTERVAL_MS);
  }
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    subscribers.delete(sub);
    if (subscribers.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}
