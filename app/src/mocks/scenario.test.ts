// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import type { LiveEvent } from "../services/liveEvents";
import { handleMockRequest } from "./handlers";
import { listingStore } from "./listings";
import { subscribeMockEvents } from "./events";
import { OFFER_DELAY_MS, SCENARIO_DELAYS_MS, resetScenario, runWeddingNight } from "./scenario";
import {
  DEMO_STEPS,
  findScenarioListing,
  formatElapsed,
  isStopped,
  stepIndex,
} from "../components/demo/demoSteps";
import { scenarioAccounts } from "../components/demo/demoAccounts";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const SPONSOR = tokenFor("user-csr");

/** Collects timers so the test can run them in order with a fake clock. */
function fakeTimers(start: number) {
  const queue: { at: number; fn: () => void }[] = [];
  let now = start;
  return {
    schedule: (fn: () => void, ms: number) => queue.push({ at: start + ms, fn }),
    clock: () => now,
    runAll() {
      for (const job of [...queue].sort((a, b) => a.at - b.at)) {
        now = job.at;
        job.fn();
      }
    },
  };
}

afterEach(() => resetScenario());

describe("wedding-night scenario (mock of B13)", () => {
  it("posts 150 hot veg plates for Sri Sai and walks them to delivered in a minute", () => {
    const start = Date.now();
    const timers = fakeTimers(start);
    const seen: LiveEvent[] = [];
    const stop = subscribeMockEvents({ role: "donor", org_id: "org-sri-sai" }, (e) => seen.push(e));

    const id = runWeddingNight(start, SCENARIO_DELAYS_MS, timers.schedule, timers.clock);
    expect(id).not.toBeNull();
    const listing = listingStore.find((l) => l.id === id)!;
    expect(listing.donor_org).toBe("org-sri-sai");
    expect(listing.total_meals).toBe(150);
    expect(listing.veg).toBe(true);
    expect(listing.storage).toBe("hot");
    expect(listing.status).toBe("posted");

    // Only one at a time.
    expect(runWeddingNight(start, SCENARIO_DELAYS_MS, timers.schedule, timers.clock)).toBeNull();

    timers.runAll();
    stop();
    expect(listing.status).toBe("delivered");
    expect(listing.receiver_org).toBe("org-annadanam");
    expect(listing.volunteer).toBe("Arjun");
    const statuses = seen.filter((e) => e.listing_id === id).map((e) => e.status);
    expect(statuses).toEqual([
      "posted",
      "offered",
      "claimed",
      "volunteer_assigned",
      "picked_up",
      "delivered",
    ]);
    expect(SCENARIO_DELAYS_MS[2]).toBeLessThanOrEqual(120_000);
    expect(OFFER_DELAY_MS).toBeLessThan(SCENARIO_DELAYS_MS[0]);

    // Finished: a new one may start.
    expect(runWeddingNight(start, SCENARIO_DELAYS_MS, () => undefined)).not.toBeNull();
  });

  it("stops quietly when the food was cancelled by hand", () => {
    const start = Date.now();
    const timers = fakeTimers(start);
    const id = runWeddingNight(start, SCENARIO_DELAYS_MS, timers.schedule, timers.clock)!;
    listingStore.find((l) => l.id === id)!.status = "cancelled";
    timers.runAll();
    expect(listingStore.find((l) => l.id === id)!.status).toBe("cancelled");
    expect(runWeddingNight(start, SCENARIO_DELAYS_MS, () => undefined)).not.toBeNull();
  });

  it("POST /api/demo/scenario: 202, then INVALID_STATE while running; bad name and no token fail", async () => {
    const ok = await handleMockRequest(
      "POST",
      "/api/demo/scenario",
      { name: "wedding_night" },
      SPONSOR,
    );
    expect(ok).toEqual({ status: 202, body: { started: true } });
    const again = await handleMockRequest(
      "POST",
      "/api/demo/scenario",
      { name: "wedding_night" },
      SPONSOR,
    );
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ error_code: "INVALID_STATE" });
    expect((again.body as { message_te: string }).message_te).toBeTruthy();
    const bad = await handleMockRequest("POST", "/api/demo/scenario", { name: "nope" }, SPONSOR);
    expect(bad.status).toBe(400);
    const anon = await handleMockRequest(
      "POST",
      "/api/demo/scenario",
      { name: "wedding_night" },
      null,
    );
    expect(anon.status).toBe(401);
  });
});

describe("demo panel steps", () => {
  it("maps statuses onto the five steps", () => {
    expect(DEMO_STEPS).toEqual(["posted", "offered", "claimed", "picked_up", "delivered"]);
    expect(stepIndex("posted")).toBe(0);
    expect(stepIndex("offered")).toBe(1);
    expect(stepIndex("claimed")).toBe(2);
    expect(stepIndex("volunteer_assigned")).toBe(2);
    expect(stepIndex("picked_up")).toBe(3);
    expect(stepIndex("delivered")).toBe(4);
    expect(stepIndex("cancelled")).toBe(-1);
    expect(isStopped("expired")).toBe(true);
    expect(isStopped("picked_up")).toBe(false);
    expect(formatElapsed(65_400)).toBe("1:05");
  });

  it("finds the scenario listing among the donor's posts", () => {
    const start = Date.now();
    const id = runWeddingNight(start, SCENARIO_DELAYS_MS, () => undefined)!;
    const own = listingStore.filter((l) => l.donor_org === "org-sri-sai");
    expect(findScenarioListing(own, start)?.id).toBe(id);
    expect(findScenarioListing(own, start + 60 * 60_000)).toBeUndefined();
  });

  it("starts as the sponsor and watches as Sri Sai, with mock or server account ids", () => {
    const server = [
      {
        account_id: "demo-donor-green-valley",
        role: "donor" as const,
        label: "Green Valley Hostel Mess",
        area: "Ameerpet",
      },
      {
        account_id: "demo-donor-sri-sai",
        role: "donor" as const,
        label: "Sri Sai Caterers",
        area: "Kukatpally",
      },
      {
        account_id: "demo-sponsor",
        role: "sponsor" as const,
        label: "Demo CSR Sponsor",
        area: "Hyderabad",
      },
    ];
    const picked = scenarioAccounts(server);
    expect(picked.donor?.account_id).toBe("demo-donor-sri-sai");
    expect(picked.sponsor?.account_id).toBe("demo-sponsor");
  });
});
