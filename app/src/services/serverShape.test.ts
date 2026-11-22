import { describe, expect, it } from "vitest";
import type { Listing, Task } from "../types/api";
import { fromServer } from "./serverShape";
import { orgArea, orgName } from "../mocks/fixtures";

// Shapes as server/src/views.ts sends them (toOrg, toListing, toTask).
const donor = {
  id: "org-caterer-1",
  type: "donor",
  name: "Sri Sai Caterers",
  area: "Kukatpally",
  lat: 17.4849,
  lng: 78.4138,
  donor_type: "caterer",
};
const kitchen = {
  id: "org-kitchen-1",
  type: "receiver",
  name: "Annadanam Community Kitchen",
  area: "Begumpet",
  lat: 17.4447,
  lng: 78.4664,
  veg_only: false,
};
const listing = (over: Record<string, unknown> = {}) => ({
  id: "lst-1",
  donor_org: donor,
  items: [{ name: "Veg biryani", category: "rice_dish", qty_meals: 100 }],
  total_meals: 100,
  veg: true,
  allergens: [],
  storage: "hot",
  cooked_at: "2026-11-22T20:00:00.000Z",
  pickup_by: "2026-11-22T22:00:00.000Z",
  status: "posted",
  created_at: "2026-11-22T20:30:00.000Z",
  posted_in_ms: 42000,
  receiver_org: null,
  volunteer: null,
  safety: { max_pickup_by: "x", serve_by: "y", guidance_en: "", guidance_te: "" },
  ...over,
});

describe("fromServer", () => {
  it("turns a posted listing's org object into its id and drops the nulls", () => {
    const out = fromServer(listing()) as Listing;
    expect(out.donor_org).toBe("org-caterer-1");
    expect("receiver_org" in out).toBe(false);
    expect("volunteer" in out).toBe(false);
    expect(out.matched_receiver).toBeUndefined();
    // The org is remembered, so name and area lookups work with server ids.
    expect(orgName("org-caterer-1")).toBe("Sri Sai Caterers");
    expect(orgArea("org-caterer-1")).toBe("Kukatpally");
  });

  it("gives a claimed listing the kitchen id, matched_receiver and the volunteer's name", () => {
    const out = fromServer(
      listing({
        status: "volunteer_assigned",
        receiver_org: kitchen,
        volunteer: { id: "demo-volunteer-arjun", display_name: "Arjun S.", vehicle: "car" },
        delivery_code: "1234",
      }),
    ) as Listing;
    expect(out.receiver_org).toBe("org-kitchen-1");
    expect(out.volunteer).toBe("Arjun S.");
    expect(out.volunteer_vehicle).toBe("car");
    expect(out.matched_receiver?.name).toBe("Annadanam Community Kitchen");
    expect(out.matched_receiver?.area).toBe("Begumpet");
    expect(out.matched_receiver?.distance_km).toBeGreaterThan(0);
    expect(out.delivery_code).toBe("1234");
  });

  it("converts tasks, offers and lists, deep inside", () => {
    const task = fromServer({
      id: "lst-1",
      listing: listing({ status: "claimed", receiver_org: kitchen }),
      donor_org: donor,
      receiver_org: kitchen,
      status: "open",
    }) as Task;
    expect(task.donor_org).toBe("org-caterer-1");
    expect(task.receiver_org).toBe("org-kitchen-1");
    expect(task.listing.donor_org).toBe("org-caterer-1");

    const list = fromServer([{ id: "off-1", listing: listing(), status: "open" }]) as {
      listing: Listing;
    }[];
    expect(list[0].listing.donor_org).toBe("org-caterer-1");
  });

  it("leaves app-shaped data alone", () => {
    const appShaped = {
      donor_org: "org-sri-sai",
      receiver_org: "org-annadanam",
      volunteer: "Ravi K.",
    };
    expect(fromServer(appShaped)).toEqual(appShaped);
    expect(fromServer({ started: true })).toEqual({ started: true });
    expect(fromServer(null)).toBeNull();
  });
});
