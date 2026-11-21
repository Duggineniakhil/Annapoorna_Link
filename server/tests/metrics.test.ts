import { describe, expect, it } from "vitest";
import { DemoRepo } from "../src/data/repo.js";
import { computeMetrics, percentile, renderMarkdown } from "../src/metrics/compute.js";
import { computeImpact } from "../src/impact/calc.js";

describe("percentile", () => {
  it("uses nearest rank", () => {
    expect(percentile([], 90)).toBe(0);
    expect(percentile([5], 90)).toBe(5);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
    expect(percentile([10, 1, 5], 50)).toBe(5);
  });
});

describe("computeMetrics on the seed", () => {
  const repo = new DemoRepo(undefined, { live: false });
  const m = computeMetrics(repo);

  it("counts every listing and orders p90 above the median", () => {
    expect(m.listings).toBe(120);
    expect(m.deliverMin.n).toBe(108);
    expect(m.deliverMin.p90).toBeGreaterThanOrEqual(m.deliverMin.median);
    expect(m.claimMin.median).toBeGreaterThan(0);
    expect(m.deliverMin.median).toBeGreaterThan(m.claimMin.median);
  });

  it("matches the impact calculator and the seed's status mix", () => {
    const impact = computeImpact(repo, {});
    expect(m.rescueRate).toBe(impact.rescue_rate);
    expect(m.byDonorType.reduce((s, r) => s + r.meals, 0)).toBe(impact.meals);
    expect(m.byArea.reduce((s, r) => s + r.meals, 0)).toBe(impact.meals);
    expect(m.expiryRate).toBeGreaterThan(0);
    expect(m.cascadeDepth.mean).toBeGreaterThanOrEqual(1);
    expect(m.cascadeDepth.mean).toBeLessThanOrEqual(3);
  });

  it("renders a labelled markdown table", () => {
    const md = renderMarkdown(m);
    expect(md).toContain("based on demo data");
    expect(md).toContain("| Metric | Value |");
    expect(md).not.toMatch(/NaN|undefined/);
  });
});
