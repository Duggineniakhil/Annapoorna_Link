import type { Org, User } from "../types/api";
import { DEMO_ACCOUNTS } from "./demoData";

export interface MockResponse {
  status: number;
  body: unknown;
}

interface MockSession {
  user: User;
  org: Org | undefined;
}

// token -> session, populated by POST /api/auth/demo-login and read by GET /api/me.
const sessions = new Map<string, MockSession>();

function encodeToken(user: User): string {
  const payload = JSON.stringify({ sub: user.id, role: user.role, org_id: user.org_id ?? null });
  return "mock." + btoa(payload) + ".mock";
}

function stripQuery(path: string): string {
  const q = path.indexOf("?");
  return q === -1 ? path : path.slice(0, q);
}

function readAccountId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const id = (body as Record<string, unknown>).account_id;
  return typeof id === "string" ? id : null;
}

const NOT_FOUND_DEMO = {
  error_code: "NOT_FOUND",
  message: "Demo account not found.",
  message_te: "డెమో ఖాతా కనుగొనబడలేదు.",
};

const UNAUTHORIZED = {
  error_code: "UNAUTHORIZED",
  message: "Please log in again.",
  message_te: "దయచేసి మళ్లీ లాగిన్ అవ్వండి.",
};

const NOT_FOUND_ROUTE = {
  error_code: "NOT_FOUND",
  message: "Not found.",
  message_te: "కనుగొనబడలేదు.",
};

export async function handleMockRequest(
  method: "GET" | "POST" | "PUT",
  path: string,
  body: unknown,
  token: string | null,
): Promise<MockResponse> {
  const pathname = stripQuery(path);

  if (method === "GET" && pathname === "/api/demo/accounts") {
    return {
      status: 200,
      body: DEMO_ACCOUNTS.map((a) => ({
        account_id: a.account_id,
        role: a.role,
        label: a.label,
        area: a.area,
      })),
    };
  }

  if (method === "POST" && pathname === "/api/auth/demo-login") {
    const accountId = readAccountId(body);
    const account = DEMO_ACCOUNTS.find((a) => a.account_id === accountId);
    if (!account) {
      return { status: 404, body: { ...NOT_FOUND_DEMO } };
    }
    const newToken = encodeToken(account.user);
    sessions.set(newToken, { user: account.user, org: account.org });
    const responseBody = account.org
      ? { token: newToken, user: account.user, org: account.org }
      : { token: newToken, user: account.user };
    return { status: 200, body: responseBody };
  }

  if (method === "GET" && pathname === "/api/me") {
    const session = token ? sessions.get(token) : undefined;
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    const responseBody = session.org
      ? { user: session.user, org: session.org }
      : { user: session.user };
    return { status: 200, body: responseBody };
  }

  return { status: 404, body: { ...NOT_FOUND_ROUTE } };
}
