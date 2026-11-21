// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleMockRequest } from "./handlers";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const RECEIVER = tokenFor("user-annadanam");

afterEach(() => {
  vi.useRealTimers();
});

describe("receiver offers", () => {
  it("accepts an open offer and returns a 4-digit delivery code", async () => {
    const res = await handleMockRequest("POST", "/api/offers/off-2/accept", undefined, RECEIVER);
    expect(res.status).toBe(200);
    // Contract: accept returns the claimed Listing with this receiver's delivery code.
    const listing = res.body as { status: string; delivery_code: string };
    expect(listing.status).toBe("claimed");
    expect(listing.delivery_code).toMatch(/^\d{4}$/);
  });

  it("returns 409 when declining an accepted offer", async () => {
    await handleMockRequest("POST", "/api/offers/off-3/accept", undefined, RECEIVER);
    const res = await handleMockRequest(
      "POST",
      "/api/offers/off-3/decline",
      { reason: "closing" },
      RECEIVER,
    );
    expect(res.status).toBe(409);
  });

  it("reports an offer whose expires_at has passed as expired, and refuses to accept it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 3 * 60_000);
    const res = await handleMockRequest("GET", "/api/offers/off-1", undefined, RECEIVER);
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe("expired");
    const accept = await handleMockRequest("POST", "/api/offers/off-1/accept", undefined, RECEIVER);
    expect(accept.status).toBe(409);
  });

  it("rejects a PUT of receiver needs with a bad time string", async () => {
    const res = await handleMockRequest(
      "PUT",
      "/api/receiver/needs",
      { meals_needed: 120, veg_only: false, open_from: "25:00", open_to: "18:00" },
      RECEIVER,
    );
    expect(res.status).toBe(400);
  });
});

describe("receiver data per kitchen", () => {
  const ASHA = tokenFor("user-asha");

  it("a veg-only kitchen is only offered veg food", async () => {
    const res = await handleMockRequest("GET", "/api/offers", undefined, ASHA);
    const offers = res.body as { listing: { veg: boolean } }[];
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.listing.veg)).toBe(true);
  });

  it("needs default to the kitchen's own veg-only rule and are kept per kitchen", async () => {
    const asha = await handleMockRequest("GET", "/api/receiver/needs", undefined, ASHA);
    expect((asha.body as { veg_only: boolean }).veg_only).toBe(true);
    await handleMockRequest(
      "PUT",
      "/api/receiver/needs",
      { meals_needed: 90, veg_only: false, open_from: "20:00", open_to: "01:00" },
      RECEIVER,
    );
    const again = await handleMockRequest("GET", "/api/receiver/needs", undefined, ASHA);
    expect((again.body as { meals_needed: number }).meals_needed).not.toBe(90);
  });

  it("accepts an overnight intake window", async () => {
    const res = await handleMockRequest(
      "PUT",
      "/api/receiver/needs",
      { meals_needed: 60, veg_only: true, open_from: "20:00", open_to: "01:00" },
      ASHA,
    );
    expect(res.status).toBe(200);
  });

  it("decline returns { ok } as in the contract", async () => {
    const list = await handleMockRequest("GET", "/api/offers", undefined, ASHA);
    const first = (list.body as { id: string }[])[0];
    const res = await handleMockRequest(
      "POST",
      `/api/offers/${first.id}/decline`,
      { reason: "no_space" },
      ASHA,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("history only shows the kitchen's own deliveries", async () => {
    const res = await handleMockRequest("GET", "/api/receiver/history", undefined, ASHA);
    const rows = res.body as { offer_id: string; listing: { receiver_org?: string } }[];
    const past = rows.filter((r) => r.offer_id.startsWith("rcv-")).map((r) => r.offer_id);
    expect(past.sort()).toEqual(["rcv-4", "rcv-5", "rcv-6"]);
    expect(rows.every((r) => r.listing.receiver_org !== "org-annadanam")).toBe(true);
  });
});

describe("offers close once another kitchen claims the food", () => {
  it("hides the offer and refuses to accept it", async () => {
    const { listingStore } = await import("./listings");
    const { OFFERS } = await import("./fixtures");
    const listing = OFFERS.find((o) => o.id === "off-3")!.listing;
    listingStore.push({ ...listing, status: "claimed", receiver_org: "org-annadanam" });
    const ASHA = tokenFor("user-asha");
    const list = await handleMockRequest("GET", "/api/offers", undefined, ASHA);
    expect(
      (list.body as { listing: { id: string } }[]).some((o) => o.listing.id === listing.id),
    ).toBe(false);
    const res = await handleMockRequest("POST", "/api/offers/off-3-asha/accept", undefined, ASHA);
    expect(res.status).toBe(409);
    listingStore.pop();
  });
});
