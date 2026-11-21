import type { ApiErrorBody } from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "al2.token";

export class ApiError extends Error {
  constructor(readonly status: number, readonly body: ApiErrorBody) {
    super(body.error_code);
  }
}

export const tokenStore = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null): void => {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode: the session simply won't survive a reload */
    }
  },
};

const NETWORK: ApiErrorBody = {
  error_code: "NETWORK",
  message: "Can't reach the server. Check your connection and try again.",
  message_te: "సర్వర్‌ను చేరుకోలేకపోయాం. కనెక్షన్ చూసి మళ్లీ ప్రయత్నించండి.",
};

// One fetch wrapper: JSON in and out, bearer token, and the server's bilingual error body on failure.
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, NETWORK);
  }
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const body = (data as ApiErrorBody | null) ?? { ...NETWORK, error_code: `HTTP_${res.status}` };
    throw new ApiError(res.status, body);
  }
  return data as T;
}

export const eventsUrl = (token: string): string => `${BASE}/api/events?token=${encodeURIComponent(token)}`;
