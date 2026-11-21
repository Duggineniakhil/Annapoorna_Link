import { config } from "../config";
import { handleMockRequest } from "../mocks/handlers";
import type {
  DeclineReason,
  Listing,
  Offer,
  ReceiverHistoryItem,
  ReceiverNeeds,
} from "../types/api";

export const TOKEN_KEY = "al.token";
export const USER_KEY = "al.user";
export const SESSION_EXPIRED_EVENT = "al:session-expired";
export const API_TIMEOUT_MS = 15000;

const LANG_KEY = "annapoorna.lang";
const GENERIC_EN = "Something went wrong. Please try again.";
const GENERIC_TE = "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.";
const BUSY_EN = "The server is busy right now. Please try again.";
const BUSY_TE = "సర్వర్ ప్రస్తుతం బిజీగా ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.";

export type HttpMethod = "GET" | "POST" | "PUT";
export type Lang = "en" | "te";

export class ApiError extends Error {
  error_code: string;
  message_te: string;
  status: number;
  retryable: boolean;

  constructor(
    errorCode: string,
    message: string,
    messageTe: string,
    status: number,
    retryable = false,
  ) {
    super(currentLang() === "te" ? messageTe : message);
    this.name = "ApiError";
    this.error_code = errorCode;
    this.message_te = messageTe;
    this.status = status;
    this.retryable = retryable;
  }
}

export function currentLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "te" ? "te" : "en";
  } catch {
    return "en";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function mapErrorBody(body: unknown, status: number, lang: Lang): ApiError {
  const obj: Record<string, unknown> = isRecord(body) ? body : {};
  const errorCode = nonEmptyString(obj.error_code) ?? "UNKNOWN_ERROR";
  const rawEn = nonEmptyString(obj.message);
  const rawTe = nonEmptyString(obj.message_te);
  const messageEn = rawEn ?? GENERIC_EN;
  const messageTe = rawTe ?? GENERIC_TE;
  const retryable = errorCode === "SERVER_BUSY" || status === 503;

  const err = new ApiError(errorCode, messageEn, messageTe, status, retryable);
  err.message = lang === "te" ? (rawTe ?? rawEn ?? GENERIC_TE) : (rawEn ?? rawTe ?? GENERIC_EN);
  return err;
}

export function busyError(lang: Lang): ApiError {
  const err = new ApiError("SERVER_BUSY", BUSY_EN, BUSY_TE, 503, true);
  err.message = lang === "te" ? BUSY_TE : BUSY_EN;
  return err;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function expireSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Storage unavailable; still notify listeners below.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

// Shared by the mock and fetch paths: 401 expires the session, errors are mapped,
// successful bodies are returned as T.
function settle<T>(status: number, body: unknown, lang: Lang): T {
  if (status >= 400) {
    if (status === 401) {
      expireSession();
    }
    throw mapErrorBody(body, status, lang);
  }
  return body as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts?: { timeoutMs?: number },
): Promise<T> {
  const lang = currentLang();
  const token = readToken();

  if (config.useMocks) {
    const res = await handleMockRequest(method, path, body, token);
    return settle<T>(res.status, res.body, lang);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? API_TIMEOUT_MS);
  let status = 0;
  let parsed: unknown = undefined;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    const res = await fetch(config.apiBaseUrl + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    status = res.status;
    if (status !== 204) {
      const text = await res.text();
      parsed = parseJson(text);
    }
  } catch {
    // Timeout (abort), network failure, or body read failure.
    throw busyError(lang);
  } finally {
    clearTimeout(timer);
  }

  if (status === 204) {
    return undefined as T;
  }
  return settle<T>(status, parsed, lang);
}

// Receiver API (docs/12-team-split.md). Thin typed wrappers over apiRequest.

/** GET /api/offers: open and expired offers for the receiver's org. */
export function listOffers(): Promise<Offer[]> {
  return apiRequest<Offer[]>("GET", "/api/offers");
}

/** GET /api/offers/:id */
export function getOffer(id: string): Promise<Offer> {
  return apiRequest<Offer>("GET", `/api/offers/${encodeURIComponent(id)}`);
}

/** POST /api/offers/:id/accept → the claimed Listing (with this receiver's delivery_code). */
export function acceptOffer(id: string): Promise<Listing> {
  return apiRequest<Listing>("POST", `/api/offers/${encodeURIComponent(id)}/accept`);
}

/** POST /api/offers/:id/decline with an optional reason. */
export function declineOffer(id: string, reason?: DeclineReason): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", `/api/offers/${encodeURIComponent(id)}/decline`, {
    reason,
  });
}

/** GET /api/receiver/needs */
export function getReceiverNeeds(): Promise<ReceiverNeeds> {
  return apiRequest<ReceiverNeeds>("GET", "/api/receiver/needs");
}

/** PUT /api/receiver/needs */
export function saveReceiverNeeds(input: ReceiverNeeds): Promise<ReceiverNeeds> {
  return apiRequest<ReceiverNeeds>("PUT", "/api/receiver/needs", input);
}

/** GET /api/receiver/history, newest first. */
export function getReceiverHistory(): Promise<ReceiverHistoryItem[]> {
  return apiRequest<ReceiverHistoryItem[]>("GET", "/api/receiver/history");
}
