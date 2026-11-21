// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe("GET /api/map", () => {
  it("gives sponsors donors, receivers and only the last 24 h of deliveries", async () => {
    const { handleMockRequest } = await import("./handlers");
    const sponsor = (await import("./demoData")).DEMO_ACCOUNTS.find(
      (a) => a.user.role === "sponsor",
    )!;
    const res = await handleMockRequest("GET", "/api/map", undefined, tokenFor(sponsor.user.id));
    expect(res.status).toBe(200);
    const body = res.body as {
      donors: { donor_type?: string }[];
      receivers: unknown[];
      recent: { listing_id: string; delivered_at: string }[];
    };
    expect(body.donors.map((d) => d.donor_type)).toContain("wedding_hall");
    expect(body.receivers.length).toBeGreaterThan(0);
    const now = Date.now();
    for (const d of body.recent) {
      expect(now - Date.parse(d.delivered_at)).toBeLessThanOrEqual(24 * 60 * 60_000);
    }
    expect(body.recent.some((d) => d.listing_id === "map-6")).toBe(false);
  });

  it("is only for sponsors", async () => {
    const { handleMockRequest } = await import("./handlers");
    const res = await handleMockRequest("GET", "/api/map", undefined, tokenFor("user-sri-sai"));
    expect(res.status).toBe(403);
  });
});
