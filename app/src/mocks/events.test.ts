// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveEvent } from "../services/liveEvents";
import type { ListingInput } from "./listings";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const ANNADANAM = tokenFor("user-annadanam");
const RAVI = tokenFor("user-ravi");

const cookedAt = "2026-11-21T10:00:00.000Z";
const nowMs = Date.parse(cookedAt);

function makeInput(): ListingInput {
  return {
    items: [{ name: "Vegetable rice", category: "rice_dish", qty_meals: 10, veg: true }],
    veg: true,
    allergens: [],
    storage: "room",
    cooked_at: cookedAt,
    pickup_by: "2026-11-21T10:50:00.000Z",
    posted_in_ms: 500,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  localStorage.clear();
});

async function modules() {
  const listings = await import("./listings");
  const events = await import("./events");
  const { handleMockRequest } = await import("./handlers");
  return { ...listings, ...events, handleMockRequest };
}

describe("events from real changes", () => {
  it("a kitchen accepting tells the donor, the volunteers and the kitchen, not other donors", async () => {
    const m = await modules();
    const seen: Record<string, LiveEvent[]> = { sriSai: [], green: [], annadanam: [], ravi: [] };
    m.subscribeMockEvents({ role: "donor", org_id: "org-sri-sai" }, (e) => seen.sriSai.push(e));
    m.subscribeMockEvents({ role: "donor", org_id: "org-green-valley" }, (e) => seen.green.push(e));
    m.subscribeMockEvents({ role: "receiver", org_id: "org-annadanam" }, (e) =>
      seen.annadanam.push(e),
    );
    m.subscribeMockEvents({ role: "volunteer" }, (e) => seen.ravi.push(e));

    const res = await m.handleMockRequest("POST", "/api/offers/off-1/accept", undefined, ANNADANAM);
    expect(res.status).toBe(200);
    const listingId = (res.body as { id: string }).id;
    const donorOrg = m.listingStore.find((l) => l.id === listingId)!.donor_org;

    const expected = { type: "listing_status", listing_id: listingId, status: "claimed" };
    expect(seen.annadanam).toEqual([expect.objectContaining(expected)]);
    expect(seen.ravi).toEqual([expect.objectContaining(expected)]);
    const donorSeen = donorOrg === "org-sri-sai" ? seen.sriSai : seen.green;
    const otherSeen = donorOrg === "org-sri-sai" ? seen.green : seen.sriSai;
    expect(donorSeen).toEqual([expect.objectContaining(expected)]);
    expect(otherSeen).toEqual([]);
  });

  it("reads and failed actions send nothing", async () => {
    const m = await modules();
    const seen: LiveEvent[] = [];
    m.subscribeMockEvents({ role: "volunteer" }, (e) => seen.push(e));
    await m.handleMockRequest("GET", "/api/tasks", undefined, RAVI);
    await m.handleMockRequest("POST", "/api/tasks/tsk-lst-101/pickup", { code: "0000" }, RAVI);
    expect(seen).toEqual([]);
  });

  it("a volunteer accepting tells the kitchen the volunteer is on the way", async () => {
    const m = await modules();
    const kitchen: LiveEvent[] = [];
    m.subscribeMockEvents({ role: "receiver", org_id: "org-annadanam" }, (e) => kitchen.push(e));
    // Assign a volunteer to a claimed listing of this kitchen, as the task accept does.
    const claimed = m.listingStore.find(
      (l) => l.status === "claimed" && l.receiver_org === "org-annadanam",
    )!;
    m.assignVolunteer(claimed.id, "Ravi K.", "two_wheeler", Date.now());
    m.emitListingEvent(claimed.id);
    expect(kitchen.map((e) => e.status)).toEqual(["volunteer_assigned"]);
  });

  it("reloadMockState picks up changes another tab saved", async () => {
    const m = await modules();
    const before = m.listingStore.length;
    // Another tab posts a listing: it lands in localStorage, not in this tab's memory.
    const saved = JSON.parse(localStorage.getItem("al.mock.listings") ?? "[]") as unknown[];
    const created = m.createListing("org-sri-sai", makeInput(), nowMs);
    if (!created.ok) throw new Error("setup failed");
    const stored = JSON.parse(localStorage.getItem("al.mock.listings")!) as unknown[];
    m.listingStore.splice(m.listingStore.indexOf(created.listing), 1);
    expect(m.listingStore).toHaveLength(before);
    expect(stored).toHaveLength(saved.length + 1);
    m.reloadMockState();
    expect(m.listingStore.some((l) => l.id === created.listing.id)).toBe(true);
  });
});

describe("test-only auto-advance", () => {
  it("walks a posted listing through the steps, one per call", async () => {
    const m = await modules();
    m.listingStore.length = 0;
    const created = m.createListing("org-donor", makeInput(), nowMs);
    if (!created.ok) throw new Error("setup failed");
    const steps: LiveEvent[] = [];
    for (let i = 0; i < 4; i++) {
      const e = m.advanceOnce(nowMs + i * 1000);
      if (e === null) throw new Error("expected an event");
      steps.push(e);
    }
    expect(steps.map((e) => e.status)).toEqual([
      "claimed",
      "volunteer_assigned",
      "picked_up",
      "delivered",
    ]);
    expect(m.advanceOnce(nowMs)).toBeNull();
  });

  it("is off by default and ticks only when asked", async () => {
    const m = await modules();
    vi.useFakeTimers();
    m.listingStore.length = 0;
    const created = m.createListing("org-donor", makeInput(), nowMs);
    if (!created.ok) throw new Error("setup failed");

    const seen: LiveEvent[] = [];
    const viewer = { role: "donor" as const, org_id: "org-donor" };
    const offByDefault = m.subscribeMockEvents(viewer, (e) => seen.push(e));
    vi.advanceTimersByTime(m.MOCK_INTERVAL_MS * 2);
    expect(seen).toHaveLength(0);
    offByDefault();

    const ticking = m.subscribeMockEvents(viewer, (e) => seen.push(e), { autoAdvance: true });
    vi.advanceTimersByTime(m.MOCK_INTERVAL_MS);
    expect(seen.map((e) => e.status)).toEqual(["claimed"]);
    ticking();
    vi.advanceTimersByTime(m.MOCK_INTERVAL_MS * 3);
    expect(seen).toHaveLength(1);
    vi.useRealTimers();
  });
});
