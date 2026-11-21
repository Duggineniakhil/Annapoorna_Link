// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImpactReport } from "../types/api";
import { CO2E_PER_KG, KG_PER_MEAL, computeImpact, type ImpactRecord } from "./impact";

const MIN = 60_000;
const T0 = Date.parse("2026-11-02T00:00:00");

function record(partial: Partial<ImpactRecord>): ImpactRecord {
  return {
    id: Math.random().toString(36),
    donor_org: "org-sri-sai",
    status: "delivered",
    meals: 100,
    posted_at: T0 + 60 * MIN,
    claimed_at: T0 + 66 * MIN,
    picked_up_at: T0 + 100 * MIN,
    pickup_by: T0 + 150 * MIN,
    ...partial,
  };
}

describe("impact formulas (docs/11)", () => {
  it("counts only delivered food; expired and cancelled count as zero", () => {
    const r = computeImpact(
      [
        record({ meals: 100 }),
        record({ status: "expired", meals: 500, picked_up_at: undefined }),
        record({ status: "cancelled", meals: 300, claimed_at: undefined }),
      ],
      T0,
      T0 + 7 * 24 * 60 * MIN,
    );
    expect(r.meals).toBe(100);
    expect(r.kg).toBe(100 * KG_PER_MEAL);
    expect(r.co2e_kg).toBe(Math.round(100 * KG_PER_MEAL * CO2E_PER_KG));
    // Rescue rate leaves out cancelled: 1 delivered of 2.
    expect(r.rescue_rate).toBe(0.5);
  });

  it("uses delivered kg when the donor entered kg", () => {
    const r = computeImpact([record({ meals: 10, kg: 7 })], T0, T0 + 24 * 60 * MIN);
    expect(r.kg).toBe(7);
  });

  it("on-time rate and median time to claim", () => {
    const r = computeImpact(
      [
        record({ claimed_at: T0 + 62 * MIN }),
        record({ claimed_at: T0 + 70 * MIN, picked_up_at: T0 + 160 * MIN }),
        record({ claimed_at: T0 + 66 * MIN }),
      ],
      T0,
      T0 + 24 * 60 * MIN,
    );
    expect(r.on_time_rate).toBe(0.67);
    expect(r.median_claim_min).toBe(6);
  });

  it("lists the assumptions with the CO₂e source", () => {
    const r = computeImpact([], T0, T0 + MIN);
    expect(r.meals).toBe(0);
    const factor = r.assumptions.find((a) => a.key === "co2e_per_kg")!;
    expect(factor.value).toBe(CO2E_PER_KG);
    expect(factor.source).toMatch(/FAO/);
    expect(r.assumptions.find((a) => a.key === "kg_per_meal")!.source).toBeUndefined();
  });
});

describe("GET /api/impact", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });
  const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";

  it("city totals equal the sum of the donors' totals, with breakdowns", async () => {
    const { handleMockRequest } = await import("./handlers");
    const { DEMO_ACCOUNTS } = await import("./demoData");
    const { ORGS } = await import("./fixtures");
    const from = new Date(Date.now() - 30 * 24 * 60 * MIN).toISOString();
    const to = new Date().toISOString();
    const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const sponsor = DEMO_ACCOUNTS.find((a) => a.user.role === "sponsor")!;
    const city = (
      await handleMockRequest(
        "GET",
        `/api/impact?scope=city&${q}`,
        undefined,
        tokenFor(sponsor.user.id),
      )
    ).body as ImpactReport;

    const { impactReport } = await import("./impact");
    const donors = Object.values(ORGS).filter((o) => o.type === "donor");
    const sum = donors
      .map((d) => impactReport("me", d.id, Date.parse(from), Date.parse(to)).meals)
      .reduce((a, b) => a + b, 0);
    expect(city.meals).toBeGreaterThan(0);
    expect(city.meals).toBe(sum);
    expect(city.by_donor_type!.reduce((a, r) => a + r.meals, 0)).toBe(city.meals);
    expect(city.by_area!.reduce((a, r) => a + r.meals, 0)).toBe(city.meals);
    expect(city.weekly.reduce((a, w) => a + w.meals, 0)).toBe(city.meals);
  });

  it("donors get their own impact only; city is for sponsors", async () => {
    const { handleMockRequest } = await import("./handlers");
    const me = await handleMockRequest(
      "GET",
      "/api/impact?scope=me",
      undefined,
      tokenFor("user-sri-sai"),
    );
    expect(me.status).toBe(200);
    const city = await handleMockRequest(
      "GET",
      "/api/impact?scope=city",
      undefined,
      tokenFor("user-sri-sai"),
    );
    expect(city.status).toBe(403);
    const bad = await handleMockRequest(
      "GET",
      "/api/impact?scope=me&from=nope",
      undefined,
      tokenFor("user-sri-sai"),
    );
    expect(bad.status).toBe(400);
  });
});
