import { describe, expect, it } from "vitest";
import { floorToMinute, futureFromTimeValue, pastFromTimeValue, toTimeValue } from "./timeInput";

// Local-time dates so the tests pass in any timezone.
const local = (d: number, h: number, m: number) => new Date(2026, 10, d, h, m, 0, 0);

describe("time input helpers", () => {
  it("formats HH:MM", () => {
    expect(toTimeValue(local(21, 9, 5))).toBe("09:05");
  });

  it("cooked-at earlier today stays today", () => {
    expect(pastFromTimeValue("21:30", local(21, 22, 0))).toEqual(local(21, 21, 30));
  });

  it("cooked-at after now means yesterday", () => {
    expect(pastFromTimeValue("23:40", local(22, 0, 20))).toEqual(local(21, 23, 40));
  });

  it("pickup-by later today stays today", () => {
    expect(futureFromTimeValue("23:15", local(21, 22, 0))).toEqual(local(21, 23, 15));
  });

  it("pickup-by after midnight means tomorrow", () => {
    expect(futureFromTimeValue("00:30", local(21, 23, 40))).toEqual(local(22, 0, 30));
  });

  it("rejects bad values", () => {
    expect(pastFromTimeValue("", local(21, 22, 0))).toBeNull();
    expect(futureFromTimeValue("25:00", local(21, 22, 0))).toBeNull();
  });

  it("floors to the minute", () => {
    expect(floorToMinute(new Date(2026, 10, 21, 22, 10, 45, 500))).toEqual(local(21, 22, 10));
  });
});
