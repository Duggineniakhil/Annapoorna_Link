import { beforeEach, describe, expect, it } from "vitest";
import { createListing, listingStore, type ListingInput } from "./listings";

const cookedAt = "2026-11-21T10:00:00.000Z";
const nowMs = Date.parse(cookedAt);

function makeInput(overrides: Partial<ListingInput> = {}): ListingInput {
  return {
    items: [
      {
        name: "Vegetable rice",
        category: "rice_dish",
        qty_meals: 10,
        veg: true,
      },
      {
        name: "Chicken curry",
        category: "curry",
        qty_meals: 5,
        veg: false,
      },
    ],
    veg: true,
    allergens: [],
    storage: "room",
    cooked_at: cookedAt,
    pickup_by: "2026-11-21T10:50:00.000Z",
    posted_in_ms: 500,
    ...overrides,
  };
}

describe("createListing food safety validation", () => {
  beforeEach(() => {
    listingStore.length = 0;
  });

  it("uses per-item veg status when calculating the pickup deadline", () => {
    const result = createListing("donor-1", makeInput(), nowMs);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.listing.safety.max_pickup_by).toBe("2026-11-21T11:00:00.000Z");
    }
  });

  it("rejects pickup beyond the per-item non-veg deadline", () => {
    const result = createListing(
      "donor-1",
      makeInput({ pickup_by: "2026-11-21T11:15:00.000Z" }),
      nowMs,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error_code).toBe("PICKUP_BY_TOO_LATE");
    }
  });

  it("rejects an invalid food category", () => {
    const input = makeInput({
      items: [
        {
          name: "Pizza",
          category: "pizza" as ListingInput["items"][number]["category"],
          qty_meals: 10,
        },
      ],
    });

    const result = createListing("donor-1", input, nowMs);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error_code).toBe("VALIDATION_FAILED");
    }
  });

  it("rejects invalid storage", () => {
    const input = makeInput({
      storage: "frozen" as ListingInput["storage"],
    });

    const result = createListing("donor-1", input, nowMs);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error_code).toBe("VALIDATION_FAILED");
    }
  });

  it("rejects pickup times that have already passed", () => {
    const input = makeInput({
      pickup_by: "2026-11-21T09:00:00.000Z",
    });

    const result = createListing("donor-1", input, nowMs);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error_code).toBe("PICKUP_IN_PAST");
    }
  });
});
