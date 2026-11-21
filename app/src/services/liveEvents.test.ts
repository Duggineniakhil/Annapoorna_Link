import { describe, expect, it } from "vitest";
import {
  backoffDelay,
  createLiveClient,
  POLLING_RETRY_MS,
  RETRY_CAP_MS,
  type LiveEvent,
  type LiveMode,
  type LiveSource,
} from "./liveEvents";

class FakeSource implements LiveSource {
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  closed = false;
  close(): void {
    this.closed = true;
  }
}

interface Pending {
  id: number;
  ms: number;
  fn: () => void;
}

class FakeTimers {
  pending: Pending[] = [];
  private nextId = 1;
  setTimeout(fn: () => void, ms: number): unknown {
    const id = this.nextId++;
    this.pending.push({ id, ms, fn });
    return id;
  }
  clearTimeout(handle: unknown): void {
    this.pending = this.pending.filter((p) => p.id !== handle);
  }
  /** Fires the earliest pending timer and returns its delay. */
  fireNext(): number {
    const next = this.pending.shift();
    if (!next) throw new Error("no pending timer");
    next.fn();
    return next.ms;
  }
}

function setup() {
  const sources: FakeSource[] = [];
  const timers = new FakeTimers();
  const modes: LiveMode[] = [];
  const events: LiveEvent[] = [];
  const client = createLiveClient({
    url: "http://test/api/events?token=t",
    onEvent: (e) => events.push(e),
    onMode: (m) => modes.push(m),
    createSource: () => {
      const s = new FakeSource();
      sources.push(s);
      return s;
    },
    timers,
  });
  return { sources, timers, modes, events, client };
}

describe("backoffDelay", () => {
  it("doubles from 1 s and caps at 30 s", () => {
    expect(backoffDelay(1)).toBe(1000);
    expect(backoffDelay(2)).toBe(2000);
    expect(backoffDelay(3)).toBe(4000);
    expect(backoffDelay(10)).toBe(RETRY_CAP_MS);
  });
});

describe("createLiveClient reconnect", () => {
  it("reconnects after 1 s then 2 s, and on the third failure switches to polling", () => {
    const { sources, timers, modes } = setup();
    expect(sources).toHaveLength(1);

    sources[0].onerror?.({});
    expect(timers.fireNext()).toBe(1000);
    expect(sources).toHaveLength(2);

    sources[1].onerror?.({});
    expect(timers.fireNext()).toBe(2000);
    expect(sources).toHaveLength(3);

    sources[2].onerror?.({});
    expect(modes).toEqual(["polling"]);
    expect(timers.fireNext()).toBe(POLLING_RETRY_MS);
    expect(sources).toHaveLength(4);
  });

  it("sets live on a successful open and resets the failure count", () => {
    const { sources, timers, modes } = setup();
    sources[0].onerror?.({});
    timers.fireNext();
    sources[1].onopen?.({});
    expect(modes).toEqual(["live"]);

    sources[1].onerror?.({});
    expect(timers.fireNext()).toBe(1000);
  });

  it("recovers from polling back to live when the background retry opens", () => {
    const { sources, timers, modes } = setup();
    sources[0].onerror?.({});
    timers.fireNext();
    sources[1].onerror?.({});
    timers.fireNext();
    sources[2].onerror?.({});
    timers.fireNext();
    sources[3].onopen?.({});
    expect(modes).toEqual(["polling", "live"]);
  });

  it("stops reconnecting after close()", () => {
    const { sources, timers, client } = setup();
    sources[0].onerror?.({});
    client.close();
    expect(timers.pending).toHaveLength(0);
    expect(sources).toHaveLength(1);
  });
});

describe("createLiveClient messages", () => {
  it("passes parsed events to onEvent and ignores malformed data", () => {
    const { sources, events } = setup();
    const good = {
      type: "listing.status_changed",
      listing_id: "lst-1",
      status: "claimed",
      at: "t",
    };
    sources[0].onmessage?.({ data: JSON.stringify(good) });
    sources[0].onmessage?.({ data: "not json" });
    sources[0].onmessage?.({ data: JSON.stringify({ type: 1 }) });
    expect(events).toEqual([good]);
  });
});
