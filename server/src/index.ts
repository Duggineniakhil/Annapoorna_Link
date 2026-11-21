import "dotenv/config";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDb } from "./db/client.js";
import { loadFromDb } from "./db/load.js";
import { PgPersister } from "./db/persist.js";
import { DemoRepo } from "./data/repo.js";
import { createLogger } from "./logger.js";

const TICK_MS = 30_000;

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.NODE_ENV);
  const db = config.DATABASE_URL ? createDb(config.DATABASE_URL) : null;

  let repo: DemoRepo | undefined;
  let persister: PgPersister | undefined;
  if (db) {
    const data = await loadFromDb(db);
    if (!data) throw new Error("Database is empty. Run `npm run migrate` and `npm run seed`, then start again.");
    repo = new DemoRepo(data, { live: false });
    data.codes.forEach((c) => repo?.restoreCodes(c));
    persister = new PgPersister(db, () => logger.error("database write failed"));
    logger.info({ listings: data.listings.length }, "loaded state from database");
  } else {
    logger.warn("DATABASE_URL not set: running in memory, state resets on restart");
  }

  const { app, flow, hub } = createApp({ config, logger, db, repo, persister });

  // Offer timeouts, expiry at pickup-by, retries for unmatched listings.
  const timer = setInterval(() => {
    try {
      flow.tick();
    } catch {
      logger.error("scheduler tick failed");
    }
  }, TICK_MS);

  const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, "listening"));

  const shutdown = (): void => {
    clearInterval(timer);
    hub.closeAll();
    server.close(() => {
      void (persister?.idle() ?? Promise.resolve())
        .then(() => db?.end({ timeout: 5 }))
        .finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : "startup failed");
  process.exit(1);
});
