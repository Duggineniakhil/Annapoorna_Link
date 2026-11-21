import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { config } from "../config";
import { useAuth } from "../auth/AuthContext";
import { subscribeMockEvents } from "../mocks/events";
import { createLiveClient, type LiveEvent, type LiveMode } from "../services/liveEvents";

export const LIVE_POLL_MS = 15_000;

type Listener = (e: LiveEvent) => void;

interface LiveContextValue {
  mode: LiveMode;
  /** Goes up each time the connection comes back, so screens refetch what they missed. */
  resync: number;
  subscribe(listener: Listener): () => void;
}

const LiveContext = createContext<LiveContextValue | null>(null);

/**
 * Holds the live connection (mock emitter in mock mode, SSE otherwise) and fans events out to
 * subscribers through a ref-held Set, so an event does not re-render the whole tree.
 * Must sit inside AuthProvider.
 */
export function LiveEventsProvider({ children }: { children?: ReactNode }) {
  const { token, user, org } = useAuth();
  const role = user?.role;
  const orgId = org?.id;
  const [mode, setMode] = useState<LiveMode>("connecting");
  const [resync, setResync] = useState(0);

  useEffect(() => {
    const back = () => setResync((n) => n + 1);
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);
  const listenersRef = useRef(new Set<Listener>());

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const dispatch: Listener = (e) => {
      for (const listener of [...listenersRef.current]) listener(e);
    };
    if (!token || !role) {
      setMode("connecting");
      return;
    }
    if (config.useMocks) {
      setMode("live");
      return subscribeMockEvents({ role, org_id: orgId }, dispatch);
    }
    const client = createLiveClient({
      url: config.apiBaseUrl + "/api/events?token=" + encodeURIComponent(token),
      onEvent: dispatch,
      onMode: setMode,
    });
    return () => client.close();
  }, [token, role, orgId]);

  const value = useMemo(() => ({ mode, resync, subscribe }), [mode, resync, subscribe]);
  return createElement(LiveContext.Provider, { value }, children);
}

function useLiveContext(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (ctx === null) {
    throw new Error("Live hooks must be used inside <LiveEventsProvider>");
  }
  return ctx;
}

/** Subscribes to every live event for the component's lifetime. The latest listener is used. */
export function useLiveEvents(listener: Listener): void {
  const { subscribe } = useLiveContext();
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => subscribe((e) => latest.current(e)), [subscribe]);
}

/** Current live mode: "connecting", "live" or "polling". */
export function useLiveStatus(): LiveMode {
  return useLiveContext().mode;
}

/**
 * Calls refetch on matching events (all events when listingId is undefined). In polling mode it
 * also refetches every LIVE_POLL_MS. It refetches once when the mode becomes live, to catch up.
 */
export function useLiveRefetch(refetch: () => void, listingId?: string): void {
  const { mode, resync, subscribe } = useLiveContext();
  const latest = useRef(refetch);
  const lastMode = useRef<LiveMode>(mode);
  const lastResync = useRef(resync);

  useEffect(() => {
    latest.current = refetch;
  });

  useEffect(
    () =>
      subscribe((e) => {
        if (listingId === undefined || e.listing_id === listingId) latest.current();
      }),
    [subscribe, listingId],
  );

  useEffect(() => {
    if (mode !== "polling") return;
    const id = setInterval(() => latest.current(), LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [mode]);

  // Back online: refetch once (the offline banner promises that actions retry).
  useEffect(() => {
    if (resync !== lastResync.current) {
      lastResync.current = resync;
      latest.current();
    }
  }, [resync]);

  useEffect(() => {
    const previous = lastMode.current;
    lastMode.current = mode;
    if (mode === "live" && previous !== "live") latest.current();
  }, [mode]);
}
