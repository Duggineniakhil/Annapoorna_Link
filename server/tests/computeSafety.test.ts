import { describe, expect, it } from "vitest";
import { computeSafety } from "../src/guidance/computeSafety.js";
import { buildSeed } from "../src/seed/generate.js";
import { AppError } from "../src/errors.js";

const rules = buildSeed().guidance;
const cooked_at = new Date("2026-11-20T18:00:00Z");
const now = new Date("2026-11-20T18:10:00Z");
const hours = (h: number) => new Date(cooked_at.getTime() + h * 3600_000).toISOString();

describe("computeSafety", () => {
  it("applies the default window per storage", () => {
    const run = (storage: "hot" | "room" | "chilled", cats: ("rice_dish" | "curry")[] = ["rice_dish"]) =>
      computeSafety({ categories: cats, storage, cooked_at, veg: true, rules, now });
    expect(run("hot").max_pickup_by).toBe(hours(3));
    expect(run("room").max_pickup_by).toBe(hours(1.5));
    expect(run("chilled").max_pickup_by).toBe(hours(6));
  });

  it("applies category and non-veg overrides at room temperature", () => {
    const base = { storage: "room" as const, cooked_at, rules, now };
    expect(computeSafety({ ...base, categories: ["dairy_based"], veg: true }).max_pickup_by).toBe(hours(1));
    expect(computeSafety({ ...base, categories: ["rice_dish"], veg: false }).max_pickup_by).toBe(hours(1));
  });

  it("uses the strictest item in a mixed listing", () => {
    const r = computeSafety({ categories: ["rice_dish", "dairy_based"], storage: "room", cooked_at, veg: true, rules, now });
    expect(r.max_pickup_by).toBe(hours(1));
  });

  it("rejects a cooked_at in the future and empty categories", () => {
    const future = new Date(now.getTime() + 60_000);
    expect(() => computeSafety({ categories: ["curry"], storage: "hot", cooked_at: future, veg: true, rules, now })).toThrow(AppError);
    expect(() => computeSafety({ categories: [], storage: "hot", cooked_at, veg: true, rules, now })).toThrow(AppError);
  });
});
