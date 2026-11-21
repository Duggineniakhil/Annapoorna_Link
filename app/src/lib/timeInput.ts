// Helpers for <input type="time"> values ("HH:MM", local time) on Quick Post.

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** "21:30" for a date, in local time. */
export function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function atTime(value: string, base: Date): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * A past time ("cooked at"). A time later than now means yesterday
 * (e.g. 23:40 chosen at 00:20 is last night).
 */
export function pastFromTimeValue(value: string, now: Date): Date | null {
  const d = atTime(value, now);
  if (!d) return null;
  return d.getTime() > now.getTime() + 60_000 ? new Date(d.getTime() - DAY_MS) : d;
}

/**
 * A future time ("pickup by"). A time more than a minute before now means tomorrow
 * (e.g. 00:30 chosen at 23:40 is after midnight).
 */
export function futureFromTimeValue(value: string, now: Date): Date | null {
  const d = atTime(value, now);
  if (!d) return null;
  return d.getTime() < now.getTime() - 60_000 ? new Date(d.getTime() + DAY_MS) : d;
}

/** Rounds down to the minute (time inputs have minute precision). */
export function floorToMinute(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}
