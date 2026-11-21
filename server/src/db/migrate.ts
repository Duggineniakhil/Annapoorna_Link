import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import { createDb } from "./client.js";

// Applies each migrations/*.sql file once, in filename order, and records it in schema_migrations.
const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migrations");

async function main(): Promise<void> {
  const db = createDb(process.env.DATABASE_URL ?? "");
  try {
    await db.unsafe("CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    const done = new Set((await db<{ filename: string }[]>`SELECT filename FROM schema_migrations`).map((r) => r.filename));
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const text = await readFile(path.join(migrationsDir, file), "utf8");
      await db.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      });
      console.log(`applied ${file}`);
    }
    console.log("migrations up to date");
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "unknown error";
  console.error(`migration failed: ${message}`);
  process.exitCode = 1;
});
