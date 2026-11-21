import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, eventsUrl, tokenStore } from "../api/client";
import type { Org, Role, User } from "../api/types";

interface SessionState {
  user: User | null;
  org: Org | null;
  ready: boolean;
  live: boolean;
  signIn: (token: string, user: User, org?: Org) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);

  // Restore a session from this tab after a reload.
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api<{ user: User; org?: Org }>("/me")
      .then((me) => {
        setUser(me.user);
        setOrg(me.org ?? null);
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) tokenStore.set(null);
      })
      .finally(() => setReady(true));
  }, []);

  // Live updates: events carry only ids and status, so we refetch whatever is on screen (decision D7).
  useEffect(() => {
    const token = tokenStore.get();
    if (!user || !token || typeof EventSource === "undefined") return;
    const es = new EventSource(eventsUrl(token));
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = () => void qc.invalidateQueries();
    return () => {
      es.close();
      setLive(false);
    };
  }, [user, qc]);

  const signIn = useCallback((token: string, u: User, o?: Org) => {
    tokenStore.set(token);
    setUser(u);
    setOrg(o ?? null);
  }, []);
  const signOut = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setOrg(null);
    qc.clear();
  }, [qc]);

  const value = useMemo(() => ({ user, org, ready, live, signIn, signOut }), [user, org, ready, live, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}

export const homeFor = (role: Role): string => `/${role}`;
