// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe("GET /api/map", () => {
  it("gives sponsors donors, receivers and the 10 newest deliveries in the server shape", async () => {
    const { handleMockRequest } = await import("./handlers");
    const sponsor = (await import("./demoData")).DEMO_ACCOUNTS.find(
      (a) => a.user.role === "sponsor",
    )!;
    const res = await handleMockRequest("GET", "/api/map", undefined, tokenFor(sponsor.user.id));
    expect(res.status).toBe(200);
    const body = res.body as {
      donors: { donor_type?: string }[];
      receivers: unknown[];
      recent: Record<string, unknown>[];
    };
    expect(body.donors.map((d) => d.donor_type)).toContain("wedding_hall");
    expect(body.receivers.length).toBeGreaterThan(0);
    expect(body.recent.length).toBeGreaterThan(0);
    expect(body.recent.length).toBeLessThanOrEqual(10);
    // Same item shape as server/src/routes/api.ts: { listing_id, area, meals, at }.
    for (const d of body.recent) {
      expect(Object.keys(d).sort()).toEqual(["area", "at", "listing_id", "meals"]);
      expect(typeof d.area).toBe("string");
      expect(typeof d.meals).toBe("number");
      expect(Number.isNaN(Date.parse(d.at as string))).toBe(false);
    }
    const times = body.recent.map((d) => Date.parse(d.at as string));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("is only for sponsors", async () => {
    const { handleMockRequest } = await import("./handlers");
    const res = await handleMockRequest("GET", "/api/map", undefined, tokenFor("user-sri-sai"));
    expect(res.status).toBe(403);
  });
});
