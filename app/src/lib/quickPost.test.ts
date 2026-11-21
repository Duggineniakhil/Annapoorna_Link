import { describe, expect, it } from "vitest";
import { isPickupAllowed, maxPickupBy, serveByFor, totalMeals } from "./quickPost";

const cookedAt = new Date("2026-11-21T10:00:00.000Z");

describe("maxPickupBy", () => {
  it("allows 3 hours for hot food", () => {
    expect(maxPickupBy(cookedAt, "hot", []).toISOString()).toBe("2026-11-21T13:00:00.000Z");
  });

  it("allows 90 minutes for room-temperature food", () => {
    expect(maxPickupBy(cookedAt, "room", []).toISOString()).toBe("2026-11-21T11:30:00.000Z");
  });

  it("allows 6 hours for chilled food", () => {
    expect(maxPickupBy(cookedAt, "chilled", []).toISOString()).toBe("2026-11-21T16:00:00.000Z");
  });

  it("limits room-temperature dairy to 1 hour", () => {
    expect(
      maxPickupBy(cookedAt, "room", [{ category: "dairy_based", veg: true }]).toISOString(),
    ).toBe("2026-11-21T11:00:00.000Z");
  });

  it("limits room-temperature cut fruit and salad to 1 hour", () => {
    expect(
      maxPickupBy(cookedAt, "room", [{ category: "salad_cut_fruit", veg: true }]).toISOString(),
    ).toBe("2026-11-21T11:00:00.000Z");
  });

  it("limits room-temperature non-veg food to 1 hour", () => {
    expect(
      maxPickupBy(cookedAt, "room", [{ category: "rice_dish", veg: false }]).toISOString(),
    ).toBe("2026-11-21T11:00:00.000Z");
  });

  it("does not apply room-temperature overrides to hot or chilled food", () => {
    const items = [{ category: "dairy_based" as const, veg: true }];

    expect(maxPickupBy(cookedAt, "hot", items).toISOString()).toBe("2026-11-21T13:00:00.000Z");

    expect(maxPickupBy(cookedAt, "chilled", items).toISOString()).toBe("2026-11-21T16:00:00.000Z");
  });
});

describe("serveByFor", () => {
  it.each([
    ["hot", "2026-11-21T14:00:00.000Z"],
    ["room", "2026-11-21T12:00:00.000Z"],
    ["chilled", "2026-11-21T22:00:00.000Z"],
  ] as const)("calculates the %s serve-by time", (storage, expected) => {
    expect(serveByFor(cookedAt, storage).toISOString()).toBe(expected);
  });
});

describe("isPickupAllowed", () => {
  const max = new Date("2026-11-21T13:00:00.000Z");

  it("allows pickup exactly at the deadline", () => {
    expect(isPickupAllowed(max, max)).toBe(true);
  });

  it("allows pickup before the deadline", () => {
    expect(isPickupAllowed(new Date("2026-11-21T12:00:00.000Z"), max)).toBe(true);
  });

  it("rejects pickup after the deadline", () => {
    expect(isPickupAllowed(new Date("2026-11-21T14:00:00.000Z"), max)).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(isPickupAllowed(new Date("invalid"), max)).toBe(false);
  });
});

describe("totalMeals", () => {
  it("adds meal quantities across all items", () => {
    expect(totalMeals([{ qty_meals: 20 }, { qty_meals: 15 }, { qty_meals: 5 }])).toBe(40);
  });

  it("returns zero for an empty list", () => {
    expect(totalMeals([])).toBe(0);
  });
});
