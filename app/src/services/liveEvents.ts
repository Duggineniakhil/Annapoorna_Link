// Live-update client: wraps EventSource with reconnect backoff and a polling signal.

export type LiveEvent = { type: string; listing_id: string; status: string; at: string };
export type LiveMode = "connecting" | "live" | "polling";

/** The subset of EventSource this client uses. Injected so tests run without a browser. */
export interface LiveSource {
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  close(): void;
}

export interface LiveTimers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface LiveClientOptions {
  url: string;
  onEvent(e: LiveEvent): void;
  onMode(m: LiveMode): void;
  /** Defaults to globalThis.EventSource. */
  createSource?: (url: string) => LiveSource;
  /** Defaults to the global timers. */
  timers?: LiveTimers;
}

export const FAILURES_BEFORE_POLLING = 3;
export const RETRY_CAP_MS = 30_000;
export const POLLING_RETRY_MS = 60_000;

/** Reconnect delay after the n-th consecutive failure (n >= 1): 1 s, 2 s, 4 s, ... capped at 30 s. */
export function backoffDelay(failures: number): number {
  return Math.min(1000 * 2 ** (failures - 1), RETRY_CAP_MS);
}

function isLiveEvent(v: unknown): v is LiveEvent {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.type === "string" &&
    typeof o.listing_id === "string" &&
    typeof o.status === "string" &&
    typeof o.at === "string"
  );
}

export function createLiveClient(opts: LiveClientOptions): { close(): void } {
  const createSource =
    opts.createSource ??
    ((url: string) => new globalThis.EventSource(url) as unknown as LiveSource);
  const timers: LiveTimers = opts.timers ?? {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (handle) =>
      globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
  };

  let failures = 0;
  let closed = false;
  let source: LiveSource | null = null;
  let timer: unknown = null;

  function scheduleConnect(ms: number): void {
    timer = timers.setTimeout(() => {
      timer = null;
      connect();
    }, ms);
  }

  function onFailure(): void {
    if (closed) return;
    source?.close();
    source = null;
    failures += 1;
    if (failures >= FAILURES_BEFORE_POLLING) {
      opts.onMode("polling");
      // Keep trying SSE in the background so live updates resume on their own.
      scheduleConnect(POLLING_RETRY_MS);
    } else {
      scheduleConnect(backoffDelay(failures));
    }
  }

  function connect(): void {
    if (closed) return;
    try {
      const s = createSource(opts.url);
      source = s;
      s.onopen = () => {
        failures = 0;
        opts.onMode("live");
      };
      s.onmessage = (ev) => {
        if (typeof ev.data !== "string") return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (isLiveEvent(parsed)) opts.onEvent(parsed);
      };
      s.onerror = () => onFailure();
    } catch {
      // EventSource missing or the constructor threw: treat as a failed attempt.
      onFailure();
    }
  }

  connect();

  return {
    close(): void {
      closed = true;
      if (timer !== null) {
        timers.clearTimeout(timer);
        timer = null;
      }
      source?.close();
      source = null;
    },
  };
}
