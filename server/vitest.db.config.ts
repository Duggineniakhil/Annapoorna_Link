import { defineConfig } from "vitest/config";

// Integration tests that need a real Postgres database (see tests/persist.db.dbtest.ts).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.dbtest.ts"],
  },
});
