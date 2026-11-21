import postgres from "postgres";

export type Db = postgres.Sql;

export function createDb(databaseUrl: string): Db {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const local = /localhost|127\.0\.0\.1/.test(databaseUrl);
  return postgres(databaseUrl, {
    ssl: local ? false : "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
    connection: { statement_timeout: 10_000 }, // no query may hold a connection longer than 10 s
    prepare: false,
    onnotice: () => undefined, // "already exists, skipping" notices are expected on re-runs
  });
}
