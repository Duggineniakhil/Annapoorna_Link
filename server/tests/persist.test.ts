import { describe, expect, it } from "vitest";
import request from "supertest";
import { execSync } from "node:child_process";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import { signToken } from "../src/middleware/auth.js";
import { DemoRepo } from "../src/data/repo.js";
import { createDb } from "../src/db/client.js";
import { loadFromDb } from "../src/db/load.js";
import { PgPersister, type Batch, type Persister } from "../src/db/persist.js";

const SECRET = "test-secret-with-more-than-16-chars";
const config = loadConfig({ ALLOWED_ORIGIN: "http://localhost:5173", JWT_SECRET: SECRET, NODE_ENV: "test" });
const NOW = Date.parse("2026-11-20T21:45:00+05:30");
const auth = (userId: string, role: "donor" | "receiver" | "volunteer", orgId: string | null) =>
  `Bearer ${signToken({ userId, role, orgId }, SECRET)}`;
const body = () => ({
  items: [{ name: "Veg biryani", category: "rice_dish", qty_meals: 100 }],
  veg: true, allergens: [], storage: "hot",
  cooked_at: new Date(NOW - 30 * 60_000).toISOString(),
  pickup_by: new Date(NOW + 2 * 3_600_000).toISOString(),
});
const tick = () => new Promise((r) => setTimeout(r, 0)); // lets the batched flush run

class FakePersister implements Persister {
  batches: Batch[] = [];
  save(b: Batch): void {
    this.batches.push(b);
  }
  idle(): Promise<void> {
    return Promise.resolve();
  }
}

describe("write-through batches", () => {
  it("sends one batch per request with the listing, codes, offers, events and receiver need", async () => {
    const fake = new FakePersister();
    const repo = new DemoRepo();
    const { app } = createApp({
      config, logger: createLogger("test"), repo, persister: fake, now: () => new Date(NOW),
      rateLimits: { generalMax: 1000, voiceMax: 1000, windowMs: 60_000 },
    });
    const donor = auth("demo-donor-sri-sai", "donor", "org-caterer-1");
    const posted = await request(app).post("/api/listings").set("Authorization", donor).send(body());
    await tick();
    expect(fake.batches).toHaveLength(1);
    const first = fake.batches[0];
    expect(first.listings[0]).toMatchObject({ id: posted.body.id, status: "offered", pickup_code: posted.body.pickup_code });
    expect(first.listings[0].delivery_code).toMatch(/^\d{4}$/);
    expect(first.offers.filter((o) => o.status === "pending")).toHaveLength(1);
    expect(first.events.map((e) => e.type)).toEqual(["posted", "offered"]);

    const offer = first.offers[0];
    const rcvUser = repo.usersOfOrg(offer.receiver_org_id)[0].id;
    await request(app).post(`/api/offers/${offer.id}/accept`).set("Authorization", auth(rcvUser, "receiver", offer.receiver_org_id));
    await tick();
    expect(fake.batches).toHaveLength(2);
    const second = fake.batches[1];
    expect(second.listings[0].status).toBe("claimed");
    expect(second.pickups[0]).toMatchObject({ listing_id: posted.body.id, receiver_org_id: offer.receiver_org_id });
    expect(second.needs[0].org_id).toBe(offer.receiver_org_id);
    expect(second.events.map((e) => e.type)).toEqual(["claimed"]); // earlier events are not sent twice
  });

  it("sends nothing for reads", async () => {
    const fake = new FakePersister();
    const { app } = createApp({ config, logger: createLogger("test"), persister: fake, now: () => new Date(NOW) });
    await request(app).get("/api/demo/accounts");
    await tick();
    expect(fake.batches).toHaveLength(0);
  });
});

// Real Postgres round trip. Runs only when TEST_DATABASE_URL points at a throwaway database
// (the seed step TRUNCATES the demo tables).
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("Postgres round trip", () => {
  it("survives a restart: state, codes and events come back from the database", async () => {
    const env = { ...process.env, DATABASE_URL: url, NODE_ENV: "test" };
    execSync("npm run migrate", { env, stdio: "pipe" });
    execSync("npm run seed", { env, stdio: "pipe" });

    const db = createDb(url ?? "");
    try {
      const boot = async () => {
        const data = await loadFromDb(db);
        if (!data) throw new Error("empty database");
        const repo = new DemoRepo(data, { live: false });
        data.codes.forEach((c) => repo.restoreCodes(c));
        const persister = new PgPersister(db, (e) => {
          throw e;
        });
        return { repo, persister, ...createApp({ config, logger: createLogger("test"), db, repo, persister, now: () => new Date(NOW) }) };
      };

      const a = await boot();
      const donor = auth("demo-donor-sri-sai", "donor", "org-caterer-1");
      const posted = await request(a.app).post("/api/listings").set("Authorization", donor).send(body());
      expect(posted.status).toBe(201);
      const offer = a.repo.offersFor(posted.body.id).find((o) => o.status === "pending");
      if (!offer) throw new Error("no offer");
      const rcv = auth(a.repo.usersOfOrg(offer.receiver_org_id)[0].id, "receiver", offer.receiver_org_id);
      const accepted = await request(a.app).post(`/api/offers/${offer.id}/accept`).set("Authorization", rcv);
      await tick();
      await a.persister.idle();

      const b = await boot(); // "restart"
      const row = b.repo.listingById(posted.body.id);
      expect(row?.status).toBe("claimed");
      expect(b.repo.codeFor(posted.body.id, "pickup")).toBe(posted.body.pickup_code);
      expect(b.repo.codeFor(posted.body.id, "delivery")).toBe(accepted.body.delivery_code);
      expect(b.repo.pickupFor(posted.body.id)?.receiver_org_id).toBe(offer.receiver_org_id);
      expect(b.repo.eventsFor(posted.body.id).map((e) => e.type)).toEqual(["posted", "offered", "claimed"]);
      const again = await request(b.app).get(`/api/offers/${offer.id}`).set("Authorization", rcv);
      expect(again.body.status).toBe("accepted");
      expect(a.repo.remainingNeed(offer.receiver_org_id)).toBe(b.repo.remainingNeed(offer.receiver_org_id));
    } finally {
      await db.end({ timeout: 5 });
    }
  }, 60_000);
});
