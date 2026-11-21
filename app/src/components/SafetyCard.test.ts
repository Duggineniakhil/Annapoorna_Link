import { describe, expect, it } from "vitest";
import { safetyCountdown, safetyCountdownState } from "./safety";
import { en } from "../i18n/en";
import { te } from "../i18n/te";

const MIN = 60_000;

describe("safetyCountdownState", () => {
  it("is soon at exactly 10 minutes left", () => {
    expect(safetyCountdownState(10 * MIN)).toBe("soon");
  });

  it("is urgent just under 10 minutes left", () => {
    expect(safetyCountdownState(10 * MIN - 1)).toBe("urgent");
  });

  it("is ok at exactly 30 minutes left", () => {
    expect(safetyCountdownState(30 * MIN)).toBe("ok");
  });

  it("is soon just under 30 minutes left", () => {
    expect(safetyCountdownState(30 * MIN - 1)).toBe("soon");
  });

  it("is expired at zero", () => {
    expect(safetyCountdownState(0)).toBe("expired");
  });

  it("is expired when past the target", () => {
    expect(safetyCountdownState(-1)).toBe("expired");
  });
});

describe("safetyCard expired message", () => {
  it("has the exact English text", () => {
    expect(en["safetyCard.expired"]).toBe("Do not use. The safe window has passed.");
  });

  it("has a non-empty Telugu text", () => {
    expect(te["safetyCard.expired"].length).toBeGreaterThan(0);
  });
});

describe("safetyCountdown by status", () => {
  const base = {
    pickup_by: "2026-11-21T20:00:00.000Z",
    safety: {
      max_pickup_by: "2026-11-21T20:00:00.000Z",
      serve_by: "2026-11-21T22:00:00.000Z",
      guidance_en: "",
      guidance_te: "",
    },
  };

  it.each(["posted", "offered", "claimed", "volunteer_assigned"] as const)(
    "%s counts down to pickup_by",
    (status) => {
      expect(safetyCountdown({ ...base, status })).toEqual({
        kind: "pickup",
        target: base.pickup_by,
      });
    },
  );

  it.each(["picked_up", "delivered"] as const)("%s counts down to serve_by", (status) => {
    expect(safetyCountdown({ ...base, status })).toEqual({
      kind: "serve",
      target: base.safety.serve_by,
    });
  });

  it("an expired listing is always in the expired state", () => {
    expect(safetyCountdown({ ...base, status: "expired" })).toEqual({ kind: "expired" });
  });

  it("a cancelled listing has no countdown", () => {
    expect(safetyCountdown({ ...base, status: "cancelled" })).toEqual({ kind: "none" });
  });
});
