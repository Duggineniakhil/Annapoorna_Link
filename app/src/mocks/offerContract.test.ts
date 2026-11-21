// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, Offer, ReceiverHistoryItem } from "../types/api";

// Doc 12 (from Member B): accept returns the Listing with the kitchen's delivery_code and no
// pickup_code; GET /api/offers/:id is the kitchen's own offer in any status (others get 404);
// history items are { offer_id, offer_status, listing, meals_delivered, at }, newest first,
// at most 50; offers always carry status, volunteer_first_name and volunteer_eta_min.

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const ANNADANAM = tokenFor("user-annadanam");
const ASHA = tokenFor("user-asha");
const SRI_SAI = tokenFor("user-sri-sai");
const RAVI = tokenFor("user-ravi");

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

async function api() {
  const { handleMockRequest } = await import("./handlers");
  return handleMockRequest;
}

describe("offer contract", () => {
  it("accept returns the delivery code and never the pickup code", async () => {
    const call = await api();
    const res = await call("POST", "/api/offers/off-1/accept", undefined, ANNADANAM);
    const listing = res.body as Listing;
    expect(res.status).toBe(200);
    expect(listing.delivery_code).toMatch(/^\d{4}$/);
    expect(listing.pickup_code).toBeUndefined();
    // The donor never gets the kitchen's code.
    const donor = await call("GET", `/api/listings/${listing.id}`, undefined, SRI_SAI);
    expect((donor.body as Listing).delivery_code).toBeUndefined();
  });

  it("offers never carry the pickup code and always have status and volunteer fields", async () => {
    const call = await api();
    const offers = (await call("GET", "/api/offers", undefined, ANNADANAM)).body as Offer[];
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer.listing.pickup_code).toBeUndefined();
      expect(offer.status).toBe("open");
      expect(offer).toHaveProperty("volunteer_first_name");
      expect(offer).toHaveProperty("volunteer_eta_min");
      // Both set or both null.
      expect(offer.volunteer_first_name === null).toBe(offer.volunteer_eta_min === null);
    }
  });

  it("an open offer shows the best free volunteer, and their minutes to the donor", async () => {
    const call = await api();
    const offer = (await call("GET", "/api/offers/off-2", undefined, ANNADANAM)).body as Offer;
    // Ravi is busy with his own delivery at the start of the demo; another volunteer is free.
    expect(offer.volunteer_first_name).not.toBe("Ravi");
    expect(offer.volunteer_first_name).toEqual(expect.any(String));
    expect(offer.volunteer_eta_min).toBeGreaterThan(0);
  });

  it("once a volunteer takes the task, the kitchen's offer shows them", async () => {
    const call = await api();
    await call("POST", "/api/offers/off-1/accept", undefined, ANNADANAM);
    // Free Ravi up by delivering his current task first.
    const { listingStore } = await import("./listings");
    const lst101 = listingStore.find((l) => l.id === "lst-101")!;
    await call("POST", "/api/tasks/tsk-lst-101/pickup", { code: lst101.pickup_code }, RAVI);
    await call(
      "POST",
      "/api/tasks/tsk-lst-101/deliver",
      { code: lst101.delivery_code, meals_delivered: 150 },
      RAVI,
    );
    const offer1 = (await call("GET", "/api/offers/off-1", undefined, ANNADANAM)).body as Offer;
    await call("POST", `/api/tasks/tsk-${offer1.listing.id}/accept`, undefined, RAVI);
    const after = (await call("GET", "/api/offers/off-1", undefined, ANNADANAM)).body as Offer;
    expect(after.status).toBe("accepted");
    expect(after.volunteer_first_name).toBe("Ravi");
    expect(after.volunteer_eta_min).toEqual(expect.any(Number));
  });

  it("GET /api/offers/:id: own offer in any status; another kitchen gets 404", async () => {
    const call = await api();
    await call("POST", "/api/offers/off-2/decline", {}, ANNADANAM);
    const own = await call("GET", "/api/offers/off-2", undefined, ANNADANAM);
    expect(own.status).toBe(200);
    expect((own.body as Offer).status).toBe("declined");
    const other = await call("GET", "/api/offers/off-2", undefined, ASHA);
    expect(other.status).toBe(404);
  });

  it("history: the new item shape, newest first, decisions included", async () => {
    const call = await api();
    await call("POST", "/api/offers/off-2/decline", {}, ANNADANAM);
    const rows = (await call("GET", "/api/receiver/history", undefined, ANNADANAM))
      .body as ReceiverHistoryItem[];
    expect(rows.length).toBeLessThanOrEqual(50);
    const declined = rows.find((r) => r.offer_id === "off-2")!;
    expect(declined).toMatchObject({ offer_status: "declined", meals_delivered: null });
    expect(declined.listing.pickup_code).toBeUndefined();
    const delivered = rows.find((r) => r.offer_id === "rcv-1")!;
    expect(delivered).toMatchObject({ offer_status: "accepted", meals_delivered: 60 });
    const times = rows.map((r) => Date.parse(r.at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
