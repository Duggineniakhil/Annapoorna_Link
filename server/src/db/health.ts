import type { Db } from "./client.js";

export type DbStatus = "ok" | "down";

export async function checkDb(db: Db | null, timeoutMs = 1000): Promise<DbStatus> {
  if (!db) return "down";
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  try {
    const result = await Promise.race([db`SELECT 1`.then(() => "ok" as const), timeout]);
    return result === "ok" ? "ok" : "down";
  } catch {
    return "down";
  } finally {
    if (timer) clearTimeout(timer);
  }
}
