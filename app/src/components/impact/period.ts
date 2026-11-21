// Date ranges for the impact views (local time, weeks start on Monday).

export type Period = "week" | "month";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** This week (Monday to now) or this month (1st to now). */
export function periodRange(period: Period, now = new Date()): { from: Date; to: Date } {
  const from = startOfDay(now);
  if (period === "week") from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
  else from.setDate(1);
  return { from, to: now };
}

/** The last `weeks` whole weeks up to now, for the weekly chart. */
export function chartRange(weeks: number, now = new Date()): { from: Date; to: Date } {
  const { from } = periodRange("week", now);
  from.setDate(from.getDate() - 7 * (weeks - 1));
  return { from, to: now };
}

/** "2026-11" for a date. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * The range of a YYYY-MM month: the 1st to the 1st of the next month, or to now for the current
 * month. Undefined for a bad or future month.
 */
export function monthRange(month: string, now = new Date()): { from: Date; to: Date } | undefined {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) return undefined;
  const from = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (from > now) return undefined;
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  return { from, to: next < now ? next : now };
}
