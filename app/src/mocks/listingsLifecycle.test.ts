import { beforeEach, describe, expect, it } from "vitest";
import type { Listing } from "../types/api";
import { cancelListing, expireOverdue, listingDetail, listingStore } from "./listings";

const NOW = Date.parse("2026-11-21T18:00:00.000Z");
const iso = (minutesFromNow: number) => new Date(NOW + minutesFromNow * 60_000).toISOString();

function make(id: string, partial: Partial<Listing>): Listing {
  return {
    id,
    donor_org: "org-sri-sai",
    items: [{ name: "Dal", category: "curry", qty_meals: 20 }],
    total_meals: 20,
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: iso(-60),
    pickup_by: iso(60),
    status: "posted",
    created_at: iso(-30),
    posted_in_ms: 30_000,
    pickup_code: "1234",
    safety: { max_pickup_by: iso(120), serve_by: iso(180), guidance_en: "", guidance_te: "" },
    ...partial,
  };
}

beforeEach(() => {
  listingStore.length = 0;
});

describe("listing lifecycle in the mock server", () => {
  it("expires listings not picked up by pickup_by and records it on the timeline", () => {
    listingStore.push(make("a", { status: "offered", pickup_by: iso(-1) }));
    listingStore.push(make("b", { status: "picked_up", pickup_by: iso(-1) }));
    expireOverdue(NOW);
    expect(listingStore[0].status).toBe("expired");
    const timeline = listingStore[0].timeline ?? [];
    expect(timeline[timeline.length - 1]?.status).toBe("expired");
    expect(listingStore[1].status).toBe("picked_up");
  });

  it("shows the pickup code only before pickup", () => {
    expect(listingDetail(make("c", { status: "claimed" })).pickup_code).toBe("1234");
    for (const status of ["picked_up", "delivered", "cancelled"] as const) {
      expect(listingDetail(make("d", { status, pickup_by: iso(600) })).pickup_code).toBeUndefined();
    }
  });

  it("cancels only before pickup", () => {
    listingStore.push(make("e", { status: "volunteer_assigned" }));
    listingStore.push(make("f", { status: "picked_up" }));
    const ok = cancelListing("org-sri-sai", "e", NOW);
    expect(ok.ok && ok.listing.status).toBe("cancelled");
    expect(cancelListing("org-sri-sai", "f", NOW)).toEqual({ ok: false, reason: "invalid_state" });
  });

  it("will not cancel another donor's listing", () => {
    listingStore.push(make("g", { donor_org: "org-green-valley" }));
    expect(cancelListing("org-sri-sai", "g", NOW)).toEqual({ ok: false, reason: "not_found" });
  });
});
