import { describe, expect, it } from "vitest";
import { pickVolunteer, rankReceivers } from "../src/matching/index.js";
import type { OrgRow, UserRow } from "../src/seed/generate.js";

const now = new Date("2026-11-20T21:45:00+05:30");
const donor = { lat: 17.4849, lng: 78.4138 };
const listing = { total_meals: 100, veg: false, pickup_by: "2026-11-20T23:45:00+05:30" };

const org = (id: string, lat: number, over: Partial<OrgRow> = {}): OrgRow => ({
  id, type: "receiver", donor_type: null, name: id, area: "x", lat, lng: 78.4138, veg_only: false,
  open_from: "18:00", open_to: "23:30", reliability: 0.8, ...over,
});

describe("rankReceivers", () => {
  it("excludes veg-only receivers for non-veg food", () => {
    const r = rankReceivers(listing, donor, [{ org: org("veg", 17.49, { veg_only: true }), remaining: 100 }, { org: org("any", 17.49), remaining: 100 }], now);
    expect(r.map((x) => x.receiver_org_id)).toEqual(["any"]);
  });

  it("excludes receivers that are closed at arrival or need too little", () => {
    const r = rankReceivers(listing, donor, [
      { org: org("closed", 17.49, { open_from: "06:00", open_to: "08:00" }), remaining: 100 },
      { org: org("full", 17.49), remaining: 5 },
      { org: org("ok", 17.49), remaining: 25 },
    ], now);
    expect(r.map((x) => x.receiver_org_id)).toEqual(["ok"]);
  });

  it("ranks nearer, needier receivers first and explains with EN and TE reasons", () => {
    const r = rankReceivers(listing, donor, [
      { org: org("far", 17.55), remaining: 100 },
      { org: org("near", 17.49), remaining: 100 },
    ], now);
    expect(r[0].receiver_org_id).toBe("near");
    expect(r[0].reasons).toHaveLength(3);
    expect(r[0].reasons[0].en).toMatch(/km away|Needs|spare|Reliable/);
    expect(r[0].reasons.every((x) => x.en && x.te)).toBe(true);
  });

  it("returns nothing when no receiver is eligible", () => {
    expect(rankReceivers(listing, donor, [], now)).toEqual([]);
  });
});

describe("pickVolunteer", () => {
  const vol = (id: string, over: Partial<UserRow> = {}): UserRow => ({
    id, org_id: null, role: "volunteer", display_name: id, lang: "en", vehicle: "car", capacity_meals: 150, available: true, ...over,
  });
  it("needs availability and capacity", () => {
    const l = { total_meals: 100, veg: true, pickup_by: "2026-11-20T23:45:00+05:30" };
    expect(pickVolunteer(l, donor, [vol("off", { available: false }), vol("small", { capacity_meals: 40 })], now)).toBeNull();
    expect(pickVolunteer(l, donor, [vol("ok")], now)?.user.id).toBe("ok");
  });
});
