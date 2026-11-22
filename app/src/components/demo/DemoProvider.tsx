import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Listing } from "../../types/api";
import { useAuth } from "../../auth/useAuth";
import { useLiveEvents } from "../../hooks/useLiveEvents";
import { ApiError, apiRequest, userMessage } from "../../services/api";
import { DemoContext, type DemoValue } from "./demoContext";
import { demoAccounts, scenarioAccounts } from "./demoAccounts";
import {
  SCENARIO_NAME,
  findScenarioListing,
  isStopped,
  readDemoState,
  stepIndex,
  writeDemoState,
  type DemoState,
} from "./demoSteps";
import { DemoPanel } from "./DemoPanel";

/** How often the panel re-reads the listing, on top of live events (events can be missed). */
export const DEMO_POLL_MS = 4_000;

// Wedding-night demo (A14). The scenario runs on the server (B13): only the sponsor may start it
// (unless DEMO_MODE is on), and the sponsor gets no live events about other people's food. So the
// button starts it as the sponsor, then signs in as the donor, Sri Sai Caterers, whose live events
// tick the floating panel: posted → offered → claimed → picked up → delivered.

export function DemoProvider({ children }: { children: ReactNode }) {
  const { user, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [state, setStateRaw] = useState<DemoState>(readDemoState);
  const stateRef = useRef(state);

  const setState = useCallback((next: DemoState) => {
    stateRef.current = next;
    writeDemoState(next);
    setStateRaw(next);
  }, []);

  /** A new status for the scenario's listing. */
  const applyStatus = useCallback(
    (listingId: string, status: string) => {
      const cur = stateRef.current;
      if (cur.phase !== "running") return;
      if (cur.listingId && cur.listingId !== listingId) return;
      // Never step backwards (an old poll answer arriving after a newer event).
      if (cur.status && stepIndex(status) < stepIndex(cur.status) && !isStopped(status)) return;
      const phase = status === "delivered" ? "done" : isStopped(status) ? "stopped" : "running";
      setState({ ...cur, listingId, status, phase });
    },
    [setState],
  );

  const start = useCallback(async () => {
    if (stateRef.current.phase === "starting" || stateRef.current.phase === "running") return;
    setState({ phase: "starting" });
    try {
      const { donor, sponsor } = scenarioAccounts(await demoAccounts());
      if (!donor || !sponsor) throw new ApiError("NOT_FOUND", "", "", 404, false);
      if (user?.role !== "sponsor") await switchAccount(sponsor.account_id);
      let joined = false;
      try {
        await apiRequest("POST", "/api/demo/scenario", { name: SCENARIO_NAME });
      } catch (err) {
        // One scenario at a time: if one is already running, follow it instead.
        if (err instanceof ApiError && err.error_code === "INVALID_STATE") joined = true;
        else throw err;
      }
      const startedAt = Date.now();
      await switchAccount(donor.account_id);
      setState({ phase: "running", startedAt, status: "posted", joined });
      navigate("/donor");
    } catch (err) {
      setState({ phase: "idle", error: userMessage(err) });
    }
  }, [navigate, setState, switchAccount, user?.role]);

  const close = useCallback(() => setState({ phase: "idle" }), [setState]);

  // Polling as a fallback, and to find the listing id when we joined a run already going.
  const poll = useCallback(async () => {
    const cur = stateRef.current;
    if (cur.phase !== "running" || (user?.role !== "donor" && user?.role !== "receiver")) return;
    try {
      const listings = await apiRequest<Listing[]>("GET", "/api/listings");
      const found = cur.listingId
        ? listings.find((l) => l.id === cur.listingId)
        : findScenarioListing(listings, cur.startedAt ?? Date.now());
      if (found) applyStatus(found.id, found.status);
    } catch {
      // Offline or signed out for a moment: the next poll or event catches up.
    }
  }, [applyStatus, user?.role]);

  // Live events: the donor hears every step of their own listing.
  useLiveEvents((e) => {
    const cur = stateRef.current;
    if (cur.phase !== "running") return;
    if (cur.listingId) applyStatus(e.listing_id, e.status);
    else void poll();
  });

  useEffect(() => {
    if (state.phase !== "running") return;
    void poll();
    const timer = window.setInterval(() => void poll(), DEMO_POLL_MS);
    return () => window.clearInterval(timer);
  }, [poll, state.phase]);

  const value = useMemo<DemoValue>(() => ({ state, start, close }), [state, start, close]);
  return (
    <DemoContext.Provider value={value}>
      {children}
      <DemoPanel />
    </DemoContext.Provider>
  );
}
