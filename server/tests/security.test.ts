import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp, type BuiltApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import { signToken } from "../src/middleware/auth.js";
import { DemoRepo } from "../src/data/repo.js";
import { Hub, MAX_STREAMS_PER_USER } from "../src/realtime.js";
import type { Response } from "express";

const SECRET = "test-secret-with-more-than-16-chars";
const base = { ALLOWED_ORIGIN: "http://localhost:5173", JWT_SECRET: SECRET, NODE_ENV: "test" };
const config = loadConfig(base);
const NOW = Date.parse("2026-11-20T21:45:00+05:30");

type Role = "donor" | "receiver" | "volunteer" | "sponsor";
const ROLES: Role[] = ["donor", "receiver", "volunteer", "sponsor"];
const IDENTITY: Record<Role, { userId: string; orgId: string | null }> = {
  donor: { userId: "demo-donor-sri-sai", orgId: "org-caterer-1" },
  receiver: { userId: "demo-receiver-annadanam", orgId: "org-kitchen-1" },
  volunteer: { userId: "demo-volunteer-ravi", orgId: null },
  sponsor: { userId: "demo-sponsor", orgId: null },
};
const bearer = (role: Role) => `Bearer ${signToken({ ...IDENTITY[role], role }, SECRET)}`;

let built: BuiltApp;
beforeEach(() => {
  built = createApp({
    config, logger: createLogger("test"), repo: new DemoRepo(), now: () => new Date(NOW),
    rateLimits: { generalMax: 10_000, voiceMax: 10_000, windowMs: 60_000 },
  });
});

// Every authenticated route and the roles allowed to call it. Disallowed roles must get 403,
// anonymous callers 401, and allowed roles anything except 401/403 (400/404/409 are fine for dummy input).
const ROUTES: { method: "get" | "post" | "put"; path: string; roles: Role[]; body?: object }[] = [
  { method: "get", path: "/api/me", roles: ROLES },
  { method: "get", path: "/api/guidance?categories=curry&storage=hot&cooked_at=2026-11-20T21:00:00%2B05:30", roles: ROLES },
  { method: "post", path: "/api/listings", roles: ["donor"], body: {} },
  { method: "get", path: "/api/listings", roles: ["donor"] },
  { method: "get", path: "/api/listings/nope", roles: ROLES },
  { method: "post", path: "/api/listings/nope/cancel", roles: ["donor"] },
  { method: "get", path: "/api/offers", roles: ["receiver"] },
  { method: "get", path: "/api/offers/nope", roles: ["receiver"] },
  { method: "post", path: "/api/offers/nope/accept", roles: ["receiver"] },
  { method: "post", path: "/api/offers/nope/decline", roles: ["receiver"] },
  { method: "get", path: "/api/receiver/history", roles: ["receiver"] },
  { method: "get", path: "/api/receiver/needs", roles: ["receiver"] },
  { method: "put", path: "/api/receiver/needs", roles: ["receiver"], body: {} },
  { method: "get", path: "/api/tasks", roles: ["volunteer"] },
  { method: "post", path: "/api/tasks/nope/accept", roles: ["volunteer"] },
  { method: "post", path: "/api/tasks/nope/pickup", roles: ["volunteer"], body: {} },
  { method: "post", path: "/api/tasks/nope/deliver", roles: ["volunteer"], body: {} },
  { method: "put", path: "/api/volunteer/availability", roles: ["volunteer"], body: {} },
  { method: "get", path: "/api/map", roles: ["sponsor"] },
  { method: "post", path: "/api/demo/scenario", roles: ["sponsor"], body: {} },
  { method: "post", path: "/api/voice-post", roles: ["donor"] },
];

describe("route x role matrix", () => {
  for (const r of ROUTES) {
    it(`${r.method.toUpperCase()} ${r.path}`, async () => {
      const call = (auth?: string) => {
        const req = request(built.app)[r.method](r.path);
        if (auth) req.set("Authorization", auth);
        return r.body ? req.send(r.body) : req;
      };
      expect((await call()).status).toBe(401);
      for (const role of ROLES) {
        const { status } = await call(bearer(role));
        if (r.roles.includes(role)) expect([401, 403], `${role} should be allowed`).not.toContain(status);
        else expect(status, `${role} should be refused`).toBe(403);
      }
    });
  }

  it("impact: donors see their own, sponsors the city, nobody the other scope", async () => {
    const get = (role: Role, q: string) => request(built.app).get(`/api/impact${q}`).set("Authorization", bearer(role));
    expect((await get("donor", "?scope=me")).status).toBe(200);
    expect((await get("sponsor", "?scope=city")).status).toBe(200);
    expect((await get("donor", "?scope=city")).status).toBe(403);
    expect((await get("sponsor", "?scope=me")).status).toBe(403);
    expect((await get("receiver", "?scope=me")).status).toBe(403);
    expect((await get("volunteer", "?scope=city")).status).toBe(403);
  });
});

describe("tokens", () => {
  const call = (auth: string) => request(built.app).get("/api/me").set("Authorization", auth);
  const claims = { ...IDENTITY.donor, role: "donor" };
  const forge = (opts: jwt.SignOptions, secret = SECRET) =>
    `Bearer ${jwt.sign({ sub: claims.userId, role: claims.role, org_id: claims.orgId }, secret, opts)}`;

  it("rejects a wrong secret, an expired token, alg none, garbage and a missing scheme", async () => {
    expect((await call(forge({ algorithm: "HS256" }, "another-secret-of-sufficient-length"))).status).toBe(401);
    expect((await call(forge({ algorithm: "HS256", expiresIn: -10 }))).status).toBe(401);
    expect((await call(forge({ algorithm: "HS512" }))).status).toBe(401); // only HS256 is accepted
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "demo-sponsor", role: "sponsor" })).toString("base64url")}.`;
    expect((await call(`Bearer ${none}`)).status).toBe(401);
    expect((await call("Bearer not-a-token")).status).toBe(401);
    expect((await call(bearer("donor").replace("Bearer ", ""))).status).toBe(401);
  });

  it("accepts a valid token in the header but not in the query outside /api/events", async () => {
    expect((await call(bearer("donor"))).status).toBe(200);
    const token = bearer("donor").slice(7);
    expect((await request(built.app).get(`/api/me?token=${token}`)).status).toBe(401);
    expect((await request(built.app).get("/api/events?token=garbage")).status).toBe(401);
    expect((await request(built.app).get("/api/events")).status).toBe(401);
  });
});

describe("codes never leak", () => {
  it("each role sees only its own code, and no response carries both", async () => {
    const body = {
      items: [{ name: "Dal", category: "curry", qty_meals: 60 }], veg: true, allergens: [], storage: "hot",
      cooked_at: new Date(NOW - 30 * 60_000).toISOString(), pickup_by: new Date(NOW + 3_600_000).toISOString(),
    };
    const posted = await request(built.app).post("/api/listings").set("Authorization", bearer("donor")).send(body);
    const offer = built.flow.repo.offersFor(posted.body.id).find((o) => o.status === "pending");
    if (!offer) throw new Error("no offer");
    const rcvAuth = `Bearer ${signToken({ userId: built.flow.repo.usersOfOrg(offer.receiver_org_id)[0].id, role: "receiver", orgId: offer.receiver_org_id }, SECRET)}`;
    await request(built.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", rcvAuth);
    const vol = built.flow.repo.volunteers().find((v) => (v.capacity_meals ?? 0) >= 60);
    if (!vol) throw new Error("no volunteer");
    const volAuth = `Bearer ${signToken({ userId: vol.id, role: "volunteer", orgId: null }, SECRET)}`;
    await request(built.app).post(`/api/tasks/${posted.body.id}/accept`).set("Authorization", volAuth);

    const view = async (auth: string) => (await request(built.app).get(`/api/listings/${posted.body.id}`).set("Authorization", auth)).body;
    const donorView = await view(bearer("donor"));
    const rcvView = await view(rcvAuth);
    const volView = await view(volAuth);
    expect(donorView.pickup_code).toBeDefined();
    expect(donorView.delivery_code).toBeUndefined();
    expect(rcvView.delivery_code).toBeDefined();
    expect(rcvView.pickup_code).toBeUndefined();
    expect(JSON.stringify(volView)).not.toMatch(/pickup_code|delivery_code/);
    expect((await request(built.app).get(`/api/listings/${posted.body.id}`).set("Authorization", bearer("sponsor"))).status).toBe(404);
    const tasks = await request(built.app).get("/api/tasks").set("Authorization", volAuth);
    expect(JSON.stringify(tasks.body)).not.toMatch(/pickup_code|delivery_code/);
    const timeline = JSON.stringify(donorView.timeline);
    expect(timeline).not.toContain(donorView.pickup_code ?? "never");
  });
});

describe("abuse limits and error hygiene", () => {
  it("rejects bodies over 100 KB and malformed JSON with the standard error shape", async () => {
    const big = await request(built.app).post("/api/auth/demo-login").send({ account_id: "x".repeat(150_000) });
    expect(big.status).toBe(400);
    expect(Object.keys(big.body).sort()).toEqual(["error_code", "message", "message_te"]);
    const bad = await request(built.app).post("/api/auth/demo-login").set("Content-Type", "application/json").send("{oops");
    expect(bad.status).toBe(400);
  });

  it("caps listing items and allergens", async () => {
    const item = { name: "Dal", category: "curry", qty_meals: 1 };
    const res = await request(built.app).post("/api/listings").set("Authorization", bearer("donor")).send({
      items: Array.from({ length: 21 }, () => item), veg: true, allergens: [], storage: "hot",
      cooked_at: new Date(NOW - 60_000).toISOString(), pickup_by: new Date(NOW + 3_600_000).toISOString(),
    });
    expect(res.status).toBe(400);
  });

  it("rate-limits per user and returns 429 in the standard shape", async () => {
    const limited = createApp({ config, logger: createLogger("test"), rateLimits: { generalMax: 3, voiceMax: 3, windowMs: 60_000 } });
    const hit = () => request(limited.app).get("/api/me").set("Authorization", bearer("donor"));
    const statuses = [(await hit()).status, (await hit()).status, (await hit()).status, (await hit()).status];
    expect(statuses).toEqual([200, 200, 200, 429]);
    // a different user has their own bucket
    expect((await request(limited.app).get("/api/me").set("Authorization", bearer("sponsor"))).status).toBe(200);
    const last = await hit();
    expect(last.body.error_code).toBe("RATE_LIMITED");
  });

  it("answers unknown routes and wrong methods without leaking internals", async () => {
    const res = await request(built.app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(Object.keys(res.body).sort()).toEqual(["error_code", "message", "message_te"]);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules|\bat \S+\(/);
    expect((await request(built.app).get("/nope")).status).toBe(404);
  });

  it("allows only the configured CORS origin and sends security headers", async () => {
    const ok = await request(built.app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const other = await request(built.app).get("/api/health").set("Origin", "https://evil.example");
    // The header always names the one allowed origin, so a browser on another origin is refused.
    expect(other.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(other.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
    expect(ok.headers["x-content-type-options"]).toBe("nosniff");
    expect(ok.headers["x-powered-by"]).toBeUndefined();
    expect(ok.headers["x-request-id"]).toBeTruthy();
  });

  it("limits open event streams per user", () => {
    const hub = new Hub();
    const ended: number[] = [];
    const streams = Array.from({ length: MAX_STREAMS_PER_USER + 2 }, (_, i) => ({ end: () => ended.push(i), write: () => true }) as unknown as Response);
    streams.forEach((s) => hub.add("u1", s));
    expect(ended).toEqual([0, 1]); // oldest dropped first
  });
});

describe("config", () => {
  it("requires a 32+ character JWT secret in production", () => {
    expect(() => loadConfig({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(20) })).toThrow(/JWT_SECRET/);
    expect(loadConfig({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }).NODE_ENV).toBe("production");
    expect(() => loadConfig({ ...base, ALLOWED_ORIGIN: "*" })).toThrow(/ALLOWED_ORIGIN/);
  });
});
