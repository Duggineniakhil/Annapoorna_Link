import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { apiRequest, SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from "../services/api";
import type { Org, User } from "../types/api";

export const ORG_KEY = "al.org";

export interface AuthValue {
  token: string | null;
  user: User | null;
  org: Org | null;
  isLoggedIn: boolean;
  login(accountId: string): Promise<User>;
  switchAccount(accountId: string): Promise<User>;
  logout(): void;
}

interface SessionState {
  token: string | null;
  user: User | null;
  org: Org | null;
}

interface DemoLoginResponse {
  token: string;
  user: User;
  org?: Org;
}

const EMPTY_SESSION: SessionState = { token: null, user: null, org: null };

function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.role === "string" &&
    typeof obj.display_name === "string"
  );
}

function parseOrg(raw: string | null): Org | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Org) : null;
  } catch {
    return null;
  }
}

/**
 * Pure reader for a persisted session. Returns null when the token or user is
 * missing, or when the stored user JSON does not parse into a user.
 */
export function readStoredSession(
  storage: Pick<Storage, "getItem">,
): { token: string; user: User; org: Org | null } | null {
  let token: string | null;
  let rawUser: string | null;
  let rawOrg: string | null;
  try {
    token = storage.getItem(TOKEN_KEY);
    rawUser = storage.getItem(USER_KEY);
    rawOrg = storage.getItem(ORG_KEY);
  } catch {
    return null;
  }
  if (!token || !rawUser) {
    return null;
  }
  let user: unknown;
  try {
    user = JSON.parse(rawUser);
  } catch {
    return null;
  }
  if (!isUser(user)) {
    return null;
  }
  return { token, user, org: parseOrg(rawOrg) };
}

// The session is kept per tab (sessionStorage) and as the browser default (localStorage).
// A tab keeps its own account across refreshes, so a demo can show the donor in one window and
// the receiver in another; a new tab starts with the account last signed in.
function storages(): Storage[] {
  const list: Storage[] = [];
  try {
    list.push(sessionStorage);
  } catch {
    // sessionStorage unavailable.
  }
  try {
    list.push(localStorage);
  } catch {
    // localStorage unavailable.
  }
  return list;
}

function clearStoredSession(): void {
  for (const storage of storages()) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
      storage.removeItem(ORG_KEY);
    } catch {
      // Storage unavailable; nothing persisted to clear.
    }
  }
}

function writeTo(storage: Storage, token: string, user: User, org: Org | null): void {
  try {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    if (org) {
      storage.setItem(ORG_KEY, JSON.stringify(org));
    } else {
      storage.removeItem(ORG_KEY);
    }
  } catch {
    // Storage unavailable; in-memory state still reflects the session.
  }
}

function hydrateSession(): SessionState {
  const [first, ...rest] = storages();
  for (const storage of [first, ...rest].filter(Boolean)) {
    const stored = readStoredSession(storage);
    if (stored) {
      // Pin this tab to the account it opened with.
      if (first && storage !== first) writeTo(first, stored.token, stored.user, stored.org);
      return { token: stored.token, user: stored.user, org: stored.org };
    }
  }
  clearStoredSession();
  return EMPTY_SESSION;
}

function writeStoredSession(token: string, user: User, org: Org | null): void {
  for (const storage of storages()) writeTo(storage, token, user, org);
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<SessionState>(hydrateSession);

  // Shared by login and switchAccount. Storage and state are only touched after
  // the request succeeds, so a failed switch keeps the previous session intact.
  const startSession = useCallback(async (accountId: string): Promise<User> => {
    const res = await apiRequest<DemoLoginResponse>("POST", "/api/auth/demo-login", {
      account_id: accountId,
    });
    const org = res.org ?? null;
    writeStoredSession(res.token, res.user, org);
    setSession({ token: res.token, user: res.user, org });
    return res.user;
  }, []);

  const login = useCallback((accountId: string) => startSession(accountId), [startSession]);
  const switchAccount = useCallback((accountId: string) => startSession(accountId), [startSession]);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(EMPTY_SESSION);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onExpired = () => {
      clearStoredSession();
      setSession(EMPTY_SESSION);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const isLoggedIn = session.token !== null && session.user !== null;

  const value = useMemo<AuthValue>(
    () => ({
      token: session.token,
      user: session.user,
      org: session.org,
      isLoggedIn,
      login,
      switchAccount,
      logout,
    }),
    [session.token, session.user, session.org, isLoggedIn, login, switchAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
