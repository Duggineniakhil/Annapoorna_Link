// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { ApiError, mapErrorBody, userMessage } from "../services/api";
import { ERROR_MESSAGES, errorText } from "./errorMessages";
import {
  DEFAULT_SETTINGS,
  TEXT_SCALE,
  applyTextSize,
  readSettings,
  writeSettings,
} from "./settings";

beforeEach(() => localStorage.clear());

describe("error messages", () => {
  it("every code has English and Telugu text", () => {
    for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
      expect(text.en, code).not.toBe("");
      expect(text.te, code).toMatch(/[ఀ-౿]/);
    }
  });

  it("a body without a message gets the code's message in the user's language", () => {
    expect(mapErrorBody({ error_code: "RATE_LIMITED" }, 429, "te").message).toBe(
      ERROR_MESSAGES.RATE_LIMITED.te,
    );
    expect(mapErrorBody({ error_code: "WRONG_CODE" }, 422, "en").message).toBe(
      ERROR_MESSAGES.WRONG_CODE.en,
    );
  });

  it("the server's own message wins; unknown codes get the generic message", () => {
    expect(
      mapErrorBody({ error_code: "X", message: "Hi", message_te: "హాయ్" }, 400, "en").message,
    ).toBe("Hi");
    expect(mapErrorBody({}, 500, "en").message).toBe(errorText(undefined).en);
    expect(mapErrorBody({}, 500, "en").retryable).toBe(true);
  });

  it("never shows a raw JavaScript error", () => {
    expect(userMessage(new TypeError("Cannot read properties of undefined"))).toBe(
      errorText(undefined).en,
    );
    expect(userMessage(new ApiError("NOT_FOUND", "Gone", "పోయింది", 404))).toBe("Gone");
  });
});

describe("settings", () => {
  it("defaults, saves and ignores bad values", () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
    writeSettings({ sound: false, textSize: "larger" });
    expect(readSettings()).toEqual({ sound: false, textSize: "larger" });
    localStorage.setItem("annapoorna.settings", JSON.stringify({ sound: "yes", textSize: "huge" }));
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("text size scales the root font", () => {
    applyTextSize("large");
    expect(document.documentElement.style.fontSize).toBe(TEXT_SCALE.large);
    applyTextSize("normal");
  });
});
