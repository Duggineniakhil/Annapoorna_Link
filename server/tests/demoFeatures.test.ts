import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp, type BuiltApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import { signToken } from "../src/middleware/auth.js";
import { DemoRepo } from "../src/data/repo.js";
import { ImpactSchema } from "../src/schemas.js";
import { weekStartIst } from "../src/impact/calc.js";

// Volunteer history, weekly impact figures and DEMO_MODE matching (added for the live demo).

const SECRET = "test-secret-with-more-than-16-chars";
const DEMO_KITCHENS = ["org-kitchen-1", "org-shelter-1"];

function setup(opts: { demoMode: boolean; at: string }): { built: BuiltApp; repo: DemoRepo; clock: { now: number } } {
  const config = loadConfig({
    ALLOWED_ORIGIN: "http://localhost:5173",
    JWT_SECRET: SECRET,
    NODE_ENV: "test",
    DEMO_MODE: String(opts.demoMode),
  });
  const clock = { now: Date.parse(opts.at) };
  const repo = new DemoRepo();
  const built = createApp({
    config,
    logger: createLogger("test"),
    repo,
    now: () => new Date(clock.now),
    rateLimits: { generalMax: 10_000, voiceMax: 10_000, windowMs: 60_000 },
  });
  return { built, repo, clock };
}

const tokenFor = (userId: string, role: "donor" | "receiver" | "volunteer" | "sponsor", orgId: string | null) =>
  `Bearer ${signToken({ userId, role, orgId }, SECRET)}`;
const donor = () => tokenFor("demo-donor-sri-sai", "donor", "org-caterer-1");

const body = (now: number, meals = 30) => ({
  items: [{ name: "Lemon rice", category: "rice_dish", qty_meals: meals }],
  veg: true,
  allergens: [],
  storage: "hot",
  cooked_at: new Date(now - 20 * 60_000).toISOString(),
  pickup_by: new Date(now + 90 * 60_000).toISOString(),
  posted_in_ms: 30_000,
});

async function firstOfferOrg(at: string, demoMode: boolean): Promise<string | undefined> {
  const { built, repo, clock } = setup({ demoMode, at });
  const res = await request(built.app).post("/api/listings").set("Authorization", donor()).send(body(clock.now));
  expect(res.status).toBe(201);
  return repo.offersFor(res.body.id).find((o) => o.status === "pending")?.receiver_org_id;
}

describe("DEMO_MODE matching", () => {
  const AFTERNOON = "2026-11-22T15:30:00+05:30"; // demo kitchens are seeded open 18:00-23:00

  it("offers a demo donor's afternoon post to a demo kitchen first", async () => {
    expect(DEMO_KITCHENS).toContain(await firstOfferOrg(AFTERNOON, true));
  });

  it("leaves normal matching alone when DEMO_MODE is off", async () => {
    expect(DEMO_KITCHENS).not.toContain(await firstOfferOrg(AFTERNOON, false));
  });
});

describe("GET /api/volunteer/history", () => {
  it("lists this volunteer's deliveries, newest first, in the app's shape", async () => {
    const { built, repo, clock } = setup({ demoMode: false, at: "2026-11-20T21:45:00+05:30" });
    const posted = await request(built.app).post("/api/listings").set("Authorization", donor()).send(body(clock.now));
    const offer = repo.offersFor(posted.body.id).find((o) => o.status === "pending")!;
    const rcv = tokenFor(repo.usersOfOrg(offer.receiver_org_id)[0].id, "receiver", offer.receiver_org_id);
    const accepted = await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", rcv);
    const v = repo.volunteers().find((x) => (x.capacity_meals ?? 0) >= 30)!;
    const vol = tokenFor(v.id, "volunteer", null);
    await request(built.app).post(`/api/tasks/${posted.body.id}/accept`).set("Authorization", vol);
    await request(built.app).post(`/api/tasks/${posted.body.id}/pickup`).set("Authorization", vol).send({ code: posted.body.pickup_code });
    const done = await request(built.app)
      .post(`/api/tasks/${posted.body.id}/deliver`)
      .set("Authorization", vol)
      .send({ code: accepted.body.delivery_code, meals_delivered: 28 });
    expect(done.body.status).toBe("delivered");

    const res = await request(built.app).get("/api/volunteer/history").set("Authorization", vol);
    expect(res.status).toBe(200);
    const item = res.body.find((h: { id: string }) => h.id === posted.body.id);
    expect(item).toMatchObject({ items_title: "Lemon rice", meals: 28, donor_area: "Kukatpally" });
    expect(Object.keys(item).sort()).toEqual(["delivered_at", "donor_area", "id", "items_title", "meals", "receiver_area"]);
    const times = res.body.map((h: { delivered_at: string }) => Date.parse(h.delivered_at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);

    expect((await request(built.app).get("/api/volunteer/history").set("Authorization", donor())).status).toBe(403);
  });
});

describe("weekly impact", () => {
  it("weeks start on Monday in Hyderabad time", () => {
    // Sunday 23:30 IST belongs to the week that started the Monday before.
    expect(new Date(weekStartIst(Date.parse("2026-11-22T23:30:00+05:30"))).toISOString()).toBe(
      new Date("2026-11-16T00:00:00+05:30").toISOString(),
    );
    expect(new Date(weekStartIst(Date.parse("2026-11-23T00:10:00+05:30"))).toISOString()).toBe(
      new Date("2026-11-23T00:00:00+05:30").toISOString(),
    );
  });

  it("adds from, to and weekly bars that add up to the meals", async () => {
    const { built } = setup({ demoMode: false, at: "2026-11-22T12:00:00+05:30" });
    const from = new Date("2026-11-01T00:00:00+05:30").toISOString();
    const to = new Date("2026-11-22T12:00:00+05:30").toISOString();
    const res = await request(built.app)
      .get(`/api/impact?scope=city&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .set("Authorization", tokenFor("demo-sponsor", "sponsor", null));
    expect(res.status).toBe(200);
    const impact = ImpactSchema.parse(res.body);
    expect(impact.from).toBe(from);
    expect(impact.weekly!.length).toBeGreaterThanOrEqual(3);
    expect(impact.weekly![0].week_start).toBe(from); // the first bar starts where the period does
    expect(impact.weekly!.reduce((s, w) => s + w.meals, 0)).toBe(impact.meals);

    const open = await request(built.app)
      .get("/api/impact?scope=city")
      .set("Authorization", tokenFor("demo-sponsor", "sponsor", null));
    expect(open.body.weekly).toBeUndefined(); // no period, no bars
  });
});
