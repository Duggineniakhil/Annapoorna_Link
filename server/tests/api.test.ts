import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { AddressInfo } from "node:net";
import { createApp, type BuiltApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import { signToken } from "../src/middleware/auth.js";
import { DemoRepo } from "../src/data/repo.js";
import { ListingSchema, OfferSchema, ReceiverHistoryItemSchema, ImpactSchema, TaskSchema, ApiErrorSchema } from "../src/schemas.js";

const SECRET = "test-secret-with-more-than-16-chars";
const config = loadConfig({ ALLOWED_ORIGIN: "http://localhost:5173", JWT_SECRET: SECRET, NODE_ENV: "test" });
const START = Date.parse("2026-11-20T21:45:00+05:30");

let clock = START;
let built: BuiltApp;
let repo: DemoRepo;

beforeEach(() => {
  clock = START;
  repo = new DemoRepo();
  built = createApp({
    config,
    logger: createLogger("test"),
    repo,
    now: () => new Date(clock),
    rateLimits: { generalMax: 10_000, voiceMax: 10_000, windowMs: 60_000 },
  });
});

const tokenFor = (userId: string, role: "donor" | "receiver" | "volunteer" | "sponsor", orgId: string | null) =>
  `Bearer ${signToken({ userId, role, orgId }, SECRET)}`;
const donor = () => tokenFor("demo-donor-sri-sai", "donor", "org-caterer-1");
const asReceiver = (orgId: string) => tokenFor(repo.usersOfOrg(orgId)[0].id, "receiver", orgId);
const carVolunteer = () => {
  const v = repo.volunteers().find((x) => (x.capacity_meals ?? 0) >= 150);
  if (!v) throw new Error("no car volunteer in seed");
  return tokenFor(v.id, "volunteer", null);
};

const listingBody = () => ({
  items: [
    { name: "Veg biryani", category: "rice_dish", qty_meals: 100 },
    { name: "Dal", category: "curry", qty_meals: 50 },
  ],
  veg: true,
  allergens: [],
  storage: "hot",
  cooked_at: new Date(clock - 30 * 60_000).toISOString(),
  pickup_by: new Date(clock + 2 * 3_600_000).toISOString(),
  posted_in_ms: 40_000,
});

async function post(): Promise<{ id: string; pickup_code: string }> {
  const res = await request(built.app).post("/api/listings").set("Authorization", donor()).send(listingBody());
  expect(res.status).toBe(201);
  return res.body;
}
const pendingOffer = (listingId: string) => repo.offersFor(listingId).find((o) => o.status === "pending");

describe("full flow", () => {
  it("post -> offer -> accept (delivery code) -> task -> pickup -> deliver -> impact", async () => {
    const posted = await post();
    expect(ListingSchema.parse(posted).status).toBe("offered");
    expect(posted.pickup_code).toMatch(/^\d{4}$/);

    const offer = pendingOffer(posted.id);
    if (!offer) throw new Error("no offer created");
    const rcv = asReceiver(offer.receiver_org_id);

    const list = await request(built.app).get("/api/offers").set("Authorization", rcv);
    expect(list.body.map((o: { id: string }) => o.id)).toContain(offer.id);

    const one = await request(built.app).get(`/api/offers/${offer.id}`).set("Authorization", rcv);
    expect(one.status).toBe(200);
    const parsed = OfferSchema.parse(one.body);
    expect(parsed.status).toBe("open");
    expect(parsed).toHaveProperty("volunteer_first_name");
    expect(parsed).toHaveProperty("volunteer_eta_min");
    expect(parsed.listing.delivery_code).toBeUndefined(); // not claimed yet

    const accepted = await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", rcv);
    expect(accepted.status).toBe(200);
    expect(ListingSchema.parse(accepted.body).status).toBe("claimed");
    expect(accepted.body.delivery_code).toMatch(/^\d{4}$/);
    expect(accepted.body.pickup_code).toBeUndefined();

    // a second accept (double tap) is refused
    const again = await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", rcv);
    expect(again.status).toBe(409);

    const vol = carVolunteer();
    const task = await request(built.app).post(`/api/tasks/${posted.id}/accept`).set("Authorization", vol);
    expect(task.status).toBe(200);
    const parsedTask = TaskSchema.parse(task.body);
    expect(parsedTask).toMatchObject({ status: "accepted", meals: 150, vehicle_fit: true });
    expect(parsedTask.pickup.name).toBe("Sri Sai Caterers");
    expect(parsedTask.volunteer_id).toBeDefined();
    const second = await request(built.app).post(`/api/tasks/${posted.id}/accept`).set("Authorization", carVolunteer());
    expect(second.status).toBe(409);

    const wrong = await request(built.app).post(`/api/tasks/${posted.id}/pickup`).set("Authorization", vol).send({ code: "0000" === posted.pickup_code ? "1111" : "0000" });
    expect(wrong.status).toBe(422);
    expect(wrong.body.remaining_tries).toBe(4);

    const picked = await request(built.app).post(`/api/tasks/${posted.id}/pickup`).set("Authorization", vol).send({ code: posted.pickup_code });
    expect(picked.status).toBe(200);
    expect(picked.body.status).toBe("picked_up");
    expect(picked.body.pickup_code).toBeUndefined();
    expect(picked.body.delivery_code).toBeUndefined();

    const deliveryCode = accepted.body.delivery_code as string;
    const tooMany = await request(built.app).post(`/api/tasks/${posted.id}/deliver`).set("Authorization", vol).send({ code: deliveryCode, meals_delivered: 151 });
    expect(tooMany.status).toBe(400);
    const done = await request(built.app).post(`/api/tasks/${posted.id}/deliver`).set("Authorization", vol).send({ code: deliveryCode, meals_delivered: 150 });
    expect(done.body.status).toBe("delivered");

    const history = await request(built.app).get("/api/receiver/history").set("Authorization", rcv);
    expect(history.status).toBe(200);
    const item = history.body.map((h: unknown) => ReceiverHistoryItemSchema.parse(h)).find((h: { offer_id: string }) => h.offer_id === offer.id);
    expect(item.meals_delivered).toBe(150);

    const timeline = await request(built.app).get(`/api/listings/${posted.id}`).set("Authorization", donor());
    expect(timeline.body.timeline.map((e: { status: string }) => e.status)).toEqual(
      expect.arrayContaining(["posted", "offered", "claimed", "volunteer_assigned", "picked_up", "delivered"]),
    );

    const mine = await request(built.app).get("/api/impact?scope=me").set("Authorization", donor());
    expect(ImpactSchema.parse(mine.body).meals).toBeGreaterThanOrEqual(150);
    const city = await request(built.app).get("/api/impact?scope=city").set("Authorization", tokenFor("demo-sponsor", "sponsor", null));
    expect(city.body.meals).toBeGreaterThanOrEqual(mine.body.meals);
    const wrongScope = await request(built.app).get("/api/impact?scope=city").set("Authorization", donor());
    expect(wrongScope.status).toBe(403);
  });

  it("locks the code after 5 wrong tries, even for the right code", async () => {
    const posted = await post();
    const offer = pendingOffer(posted.id);
    if (!offer) throw new Error("no offer");
    await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", asReceiver(offer.receiver_org_id));
    const vol = carVolunteer();
    await request(built.app).post(`/api/tasks/${posted.id}/accept`).set("Authorization", vol);
    const bad = posted.pickup_code === "0000" ? "1111" : "0000";
    for (let i = 0; i < 4; i++) {
      expect((await request(built.app).post(`/api/tasks/${posted.id}/pickup`).set("Authorization", vol).send({ code: bad })).status).toBe(422);
    }
    expect((await request(built.app).post(`/api/tasks/${posted.id}/pickup`).set("Authorization", vol).send({ code: bad })).status).toBe(423);
    expect((await request(built.app).post(`/api/tasks/${posted.id}/pickup`).set("Authorization", vol).send({ code: posted.pickup_code })).status).toBe(423);
  });
});

describe("offer cascade and expiry", () => {
  it("decline moves the offer to the next receiver", async () => {
    const posted = await post();
    const first = pendingOffer(posted.id);
    if (!first) throw new Error("no offer");
    const res = await request(built.app).post(`/api/offers/${first.id}/decline`).set("Authorization", asReceiver(first.receiver_org_id));
    expect(res.body).toEqual({ ok: true });
    const next = pendingOffer(posted.id);
    expect(next?.receiver_org_id).toBeDefined();
    expect(next?.receiver_org_id).not.toBe(first.receiver_org_id);
  });

  it("a timed-out offer moves to the next receiver", async () => {
    const posted = await post();
    const first = pendingOffer(posted.id);
    clock += 11 * 60_000;
    built.flow.tick();
    expect(repo.offerById(first?.id ?? "")?.status).toBe("expired");
    expect(pendingOffer(posted.id)?.receiver_org_id).not.toBe(first?.receiver_org_id);
  });

  it("after 5 offers, the rest are opened to everyone and only one accept wins", async () => {
    const posted = await post();
    for (let i = 0; i < 5; i++) {
      const o = pendingOffer(posted.id);
      if (!o) break;
      await request(built.app).post(`/api/offers/${o.id}/decline`).set("Authorization", asReceiver(o.receiver_org_id));
    }
    const open = repo.offersFor(posted.id).filter((o) => o.status === "pending");
    if (open.length >= 2) {
      const [a, b] = open;
      const r1 = await request(built.app).post(`/api/offers/${a.id}/accept`).set("Authorization", asReceiver(a.receiver_org_id));
      const r2 = await request(built.app).post(`/api/offers/${b.id}/accept`).set("Authorization", asReceiver(b.receiver_org_id));
      expect([r1.status, r2.status]).toEqual([200, 409]);
    }
    expect(repo.offersFor(posted.id).length).toBeGreaterThanOrEqual(5);
  });

  it("expires a listing at pickup-by", async () => {
    const posted = await post();
    clock += 2 * 3_600_000 + 1000;
    built.flow.tick();
    expect(repo.listingById(posted.id)?.status).toBe("expired");
    const cancel = await request(built.app).post(`/api/listings/${posted.id}/cancel`).set("Authorization", donor());
    expect(cancel.status).toBe(409);
  });

  it("rejects a pickup-by later than the safe window", async () => {
    const body = { ...listingBody(), pickup_by: new Date(clock + 4 * 3_600_000).toISOString() };
    const res = await request(built.app).post("/api/listings").set("Authorization", donor()).send(body);
    expect(res.status).toBe(422);
    expect(ApiErrorSchema.parse(res.body).error_code).toBe("PICKUP_BY_TOO_LATE");
  });

  it("cancel twice gives one success", async () => {
    const posted = await post();
    const a = await request(built.app).post(`/api/listings/${posted.id}/cancel`).set("Authorization", donor());
    const b = await request(built.app).post(`/api/listings/${posted.id}/cancel`).set("Authorization", donor());
    expect([a.status, b.status]).toEqual([200, 409]);
  });
});

describe("authorization", () => {
  it("hides other organisations' offers and listings", async () => {
    const posted = await post();
    const offer = pendingOffer(posted.id);
    if (!offer) throw new Error("no offer");
    const otherOrg = repo.allOrgs().find((o) => o.type === "receiver" && o.id !== offer.receiver_org_id)?.id ?? "";
    expect((await request(built.app).get(`/api/offers/${offer.id}`).set("Authorization", asReceiver(otherOrg))).status).toBe(404);
    expect((await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", asReceiver(otherOrg))).status).toBe(404);
    const otherDonor = tokenFor("demo-donor-green-valley", "donor", "org-mess-1");
    expect((await request(built.app).get(`/api/listings/${posted.id}`).set("Authorization", otherDonor)).status).toBe(404);
    expect((await request(built.app).get(`/api/listings/${posted.id}`).set("Authorization", carVolunteer())).status).toBe(404);
  });

  it("enforces roles and authentication", async () => {
    expect((await request(built.app).get("/api/offers")).status).toBe(401);
    expect((await request(built.app).get("/api/offers").set("Authorization", donor())).status).toBe(403);
    expect((await request(built.app).get("/api/map").set("Authorization", donor())).status).toBe(403);
    expect((await request(built.app).get("/api/map").set("Authorization", tokenFor("demo-sponsor", "sponsor", null))).status).toBe(200);
  });

  it("demo login works and a volunteer response never carries codes", async () => {
    const login = await request(built.app).post("/api/auth/demo-login").send({ account_id: "demo-volunteer-ravi" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
    const tasks = await request(built.app).get("/api/tasks").set("Authorization", `Bearer ${login.body.token}`);
    expect(JSON.stringify(tasks.body)).not.toMatch(/pickup_code|delivery_code/);
    expect((await request(built.app).post("/api/auth/demo-login").send({ account_id: "nope" })).status).toBe(404);
  });

  it("returns the stub header and the health shape", async () => {
    const res = await request(built.app).get("/api/health");
    expect(res.headers["x-stub"]).toBe("true");
    expect(res.body).toMatchObject({ ok: true, db: "memory" });
  });
});

describe("realtime", () => {
  it("streams events to the donor of a listing", async () => {
    const server = built.app.listen(0);
    const port = (server.address() as AddressInfo).port;
    const ctl = new AbortController();
    try {
      const token = donor().slice("Bearer ".length);
      const res = await fetch(`http://127.0.0.1:${port}/api/events?token=${token}`, { signal: ctl.signal });
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      await reader.read(); // ": connected"
      await post();
      let text = "";
      while (!text.includes("data:")) text += decoder.decode((await reader.read()).value);
      expect(text).toMatch(/"type":"listing_status"/);
      expect(text).not.toMatch(/code/);
    } finally {
      ctl.abort();
      built.hub.closeAll();
      server.close();
    }
  });
});
