import "dotenv/config";
import { DemoRepo } from "../data/repo.js";
import { createDb } from "../db/client.js";
import { loadFromDb } from "../db/load.js";
import { computeMetrics, renderMarkdown } from "./compute.js";

// Prints the pitch metrics table from the database (seeded + live data).
// `npm run metrics -- --seed-only` computes it from the in-code seed instead (no database needed).
async function main(): Promise<void> {
  let repo: DemoRepo;
  if (process.argv.includes("--seed-only")) {
    repo = new DemoRepo(undefined, { live: false });
  } else {
    const db = createDb(process.env.DATABASE_URL ?? "");
    try {
      const data = await loadFromDb(db);
      if (!data) throw new Error("Database is empty. Run `npm run migrate` and `npm run seed` first.");
      repo = new DemoRepo(data, { live: false });
    } finally {
      await db.end({ timeout: 5 });
    }
  }
  console.log(renderMarkdown(computeMetrics(repo)));
}

main().catch((err: unknown) => {
  console.error(`metrics failed: ${err instanceof Error ? err.message : "unknown error"}`);
  process.exitCode = 1;
});
