// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  config: { apiBaseUrl: "http://test.local", useMocks: false },
}));

import {
  ApiError,
  API_TIMEOUT_MS,
  SESSION_EXPIRED_EVENT,
  TOKEN_KEY,
  USER_KEY,
  apiRequest,
  busyError,
  mapErrorBody,
} from "./api";

describe("mapErrorBody", () => {
  const body = { error_code: "VALIDATION_FAILED", message: "Bad input", message_te: "తప్పు ఇన్పుట్" };

  it("returns the English message for lang en", () => {
    const err = mapErrorBody(body, 400, "en");
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Bad input");
    expect(err.error_code).toBe("VALIDATION_FAILED");
    expect(err.status).toBe(400);
  });

  it("returns message_te for lang te", () => {
    const err = mapErrorBody(body, 400, "te");
    expect(err.message).toBe("తప్పు ఇన్పుట్");
  });

  it("is not retryable for VALIDATION_FAILED with status 400", () => {
    expect(mapErrorBody(body, 400, "en").retryable).toBe(false);
  });

  it("is retryable for SERVER_BUSY", () => {
    const err = mapErrorBody(
      { error_code: "SERVER_BUSY", message: "x", message_te: "y" },
      503,
      "en",
    );
    expect(err.retryable).toBe(true);
  });
});

describe("busyError", () => {
  it("is a retryable SERVER_BUSY 503 error", () => {
    const err = busyError("en");
    expect(err.error_code).toBe("SERVER_BUSY");
    expect(err.retryable).toBe(true);
    expect(err.status).toBe(503);
  });
});

describe("apiRequest", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("maps a timeout (abort) to a retryable SERVER_BUSY error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("The operation was aborted.", "AbortError")),
            );
          }),
      ),
    );

    const promise = apiRequest("GET", "/api/me", undefined, { timeoutMs: 20 });
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).error_code).toBe("SERVER_BUSY");
    expect((error as ApiError).retryable).toBe(true);
    expect(API_TIMEOUT_MS).toBe(15000);
  });

  it("on 401 clears the stored session, dispatches the expiry event and keeps status 401", async () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    localStorage.setItem(USER_KEY, "{}");
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 401,
          text: () =>
            Promise.resolve(
              JSON.stringify({ error_code: "UNAUTHORIZED", message: "x", message_te: "y" }),
            ),
        }),
      ),
    );

    const error = await apiRequest("GET", "/api/me").catch((e: unknown) => e);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
