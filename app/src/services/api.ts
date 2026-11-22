import { config } from "../config";
import { fromServer } from "./serverShape";
import { handleMockRequest } from "../mocks/handlers";
import { errorText } from "../lib/errorMessages";
import type {
  DeclineReason,
  DeliverInput,
  ImpactReport,
  VoicePostResult,
  Listing,
  Offer,
  ReceiverHistoryItem,
  ReceiverNeeds,
  Task,
  VolunteerAvailability,
  VolunteerHistoryItem,
} from "../types/api";

export const TOKEN_KEY = "al.token";
export const USER_KEY = "al.user";
export const SESSION_EXPIRED_EVENT = "al:session-expired";
export const API_TIMEOUT_MS = 15000;

const LANG_KEY = "annapoorna.lang";
const GENERIC_EN = "Something went wrong. Please try again.";
const GENERIC_TE = "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.";
const BUSY_EN = "The server is busy right now. Please try again.";
const NETWORK_EN = "No connection. Check your internet and try again.";
const NETWORK_TE = "కనెక్షన్ లేదు. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.";
const BUSY_TE = "సర్వర్ ప్రస్తుతం బిజీగా ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.";

export type HttpMethod = "GET" | "POST" | "PUT";
export type Lang = "en" | "te";

export class ApiError extends Error {
  error_code: string;
  message_te: string;
  status: number;
  retryable: boolean;
  /** Set on WRONG_CODE: how many code attempts are left before the code locks. */
  tries_left?: number;

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
  // The server's own message first; else the app's message for the code; else a generic one.
  const known = errorText(errorCode);
  const messageEn = nonEmptyString(obj.message) ?? known.en;
  const messageTe = nonEmptyString(obj.message_te) ?? known.te;
  const retryable =
    errorCode === "SERVER_BUSY" || errorCode === "RATE_LIMITED" || status === 503 || status >= 500;

  const err = new ApiError(errorCode, messageEn, messageTe, status, retryable);
  err.message = lang === "te" ? messageTe : messageEn;
  if (typeof obj.tries_left === "number") {
    err.tries_left = obj.tries_left;
  }
  return err;
}

/**
 * Text safe to show for any caught error: an ApiError's translated message, otherwise a generic
 * message in the current language (never a raw JavaScript error).
 */
export function userMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return currentLang() === "te" ? GENERIC_TE : GENERIC_EN;
}

export function busyError(lang: Lang): ApiError {
  const err = new ApiError("SERVER_BUSY", BUSY_EN, BUSY_TE, 503, true);
  err.message = lang === "te" ? BUSY_TE : BUSY_EN;
  return err;
}

export function networkError(lang: Lang): ApiError {
  const err = new ApiError("NETWORK_ERROR", NETWORK_EN, NETWORK_TE, 0, true);
  err.message = lang === "te" ? NETWORK_TE : NETWORK_EN;
  return err;
}

function isAbortError(err: unknown): boolean {
  return isRecord(err) && err.name === "AbortError";
}

/** This tab's token first (see AuthContext), then the browser default. */
function readToken(): string | null {
  try {
    if (typeof sessionStorage !== "undefined") {
      const own = sessionStorage.getItem(TOKEN_KEY);
      if (own) return own;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function expireSession(): void {
  try {
    for (const storage of [sessionStorage, localStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }
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
    // FormData (voice upload) sets its own multipart Content-Type with the boundary.
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    const res = await fetch(config.apiBaseUrl + path, {
      method,
      headers,
      body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    status = res.status;
    if (status !== 204) {
      const text = await res.text();
      parsed = parseJson(text);
    }
  } catch (err) {
    // Timeout (abort) keeps the retryable SERVER_BUSY ApiError.
    if (isAbortError(err)) {
      throw busyError(lang);
    }
    // Network failure or body read failure: a translated, retryable error (never raw text in the UI).
    throw networkError(lang);
  } finally {
    clearTimeout(timer);
  }

  if (status === 204) {
    return undefined as T;
  }
  // The real server nests orgs and the volunteer as objects; the app uses ids and names.
  return settle<T>(status, status < 400 ? fromServer(parsed) : parsed, lang);
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

// Volunteer API. Thin typed wrappers over apiRequest.
//
// The real server has no GET /api/volunteer/availability, GET /api/volunteer/history or
// GET /api/tasks/:id yet. On a 404 the app falls back to what it does have, so the volunteer
// screens keep working against either.

function isMissingRoute(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

/** GET /api/volunteer/availability, else `available` from GET /api/me. */
export async function getVolunteerAvailability(): Promise<VolunteerAvailability> {
  try {
    return await apiRequest<VolunteerAvailability>("GET", "/api/volunteer/availability");
  } catch (err) {
    if (!isMissingRoute(err)) throw err;
    const me = await apiRequest<{ user: { available?: boolean } }>("GET", "/api/me");
    return { available: me.user.available ?? false };
  }
}

/** PUT /api/volunteer/availability → { ok } (contract). */
export function setVolunteerAvailability(input: { available: boolean }): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("PUT", "/api/volunteer/availability", input);
}

/** GET /api/tasks: open tasks plus this volunteer's own tasks. */
export function listTasks(): Promise<Task[]> {
  return apiRequest<Task[]>("GET", "/api/tasks");
}

/** GET /api/tasks/:id */
/**
 * POST /api/voice-post (multipart): field "audio" with the recording (its own Content-Type,
 * e.g. audio/webm;codecs=opus) and an optional "lang" hint for speech-to-text.
 * Returns a draft to prefill Quick Post; nothing is posted.
 */
export function postVoice(audio: Blob, filename: string): Promise<VoicePostResult> {
  const form = new FormData();
  form.append("audio", audio, filename);
  form.append("lang", currentLang());
  return apiRequest<VoicePostResult>("POST", "/api/voice-post", form, { timeoutMs: 30_000 });
}

/** GET /api/impact?scope=me|city&from=&to= (dates as ISO strings). */
export function getImpact(scope: "me" | "city", from: Date, to: Date): Promise<ImpactReport> {
  const query = new URLSearchParams({
    scope,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return apiRequest<ImpactReport>("GET", `/api/impact?${query.toString()}`);
}

/** GET /api/tasks/:id, else the task from GET /api/tasks (404 if it is not there). */
export async function getTask(id: string): Promise<Task> {
  try {
    return await apiRequest<Task>("GET", `/api/tasks/${encodeURIComponent(id)}`);
  } catch (err) {
    if (!isMissingRoute(err)) throw err;
    const task = (await listTasks()).find((t) => t.id === id);
    if (!task) throw err;
    return task;
  }
}

/** POST /api/tasks/:id/accept → the accepted Task. */
export function acceptTask(id: string): Promise<Task> {
  return apiRequest<Task>("POST", `/api/tasks/${encodeURIComponent(id)}/accept`);
}

/** POST /api/tasks/:id/pickup { code } → the Listing, now picked_up. WRONG_CODE carries tries_left. */
export function submitPickupCode(id: string, code: string): Promise<Listing> {
  return apiRequest<Listing>("POST", `/api/tasks/${encodeURIComponent(id)}/pickup`, { code });
}

/** POST /api/tasks/:id/deliver { code, meals_delivered } */
export function deliverTask(id: string, input: DeliverInput): Promise<Listing> {
  return apiRequest<Listing>("POST", `/api/tasks/${encodeURIComponent(id)}/deliver`, input);
}

/** GET /api/volunteer/history: delivered tasks, newest first (empty if the server has none). */
export async function getVolunteerHistory(): Promise<VolunteerHistoryItem[]> {
  try {
    return await apiRequest<VolunteerHistoryItem[]>("GET", "/api/volunteer/history");
  } catch (err) {
    if (isMissingRoute(err)) return [];
    throw err;
  }
}
