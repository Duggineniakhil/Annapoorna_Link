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
import { PgPersister } from "../src/db/persist.js";

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

// Real Postgres round trip, run with `npm run test:db` (not part of `npm test`).
// It needs TEST_DATABASE_URL pointing at a throwaway database: the seed step TRUNCATES the demo
// tables. The default suite covers persistence with a fake persister (tests/persist.test.ts).
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a throwaway Postgres database to run npm run test:db");

describe("Postgres round trip", () => {
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
