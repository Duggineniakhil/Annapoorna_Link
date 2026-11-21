import { useCallback, useEffect, useState } from "react";
import type { ImpactReport } from "../../types/api";
import { getImpact } from "../../services/api";
import { useLiveRefetch } from "../../hooks/useLiveEvents";

/**
 * Loads GET /api/impact for a range and reloads it when a delivery happens (live events).
 * fromMs/toMs are numbers so the effect only re-runs when the range really changes; leave toMs
 * out for "up to now" (each reload then counts up to that moment).
 */
export function useImpact(scope: "me" | "city", fromMs: number, toMs?: number) {
  const [data, setData] = useState<ImpactReport | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(
    () =>
      getImpact(scope, new Date(fromMs), new Date(toMs ?? Date.now()))
        .then((report) => {
          setData(report);
          setError(false);
        })
        .catch(() => setError(true)),
    [scope, fromMs, toMs],
  );

  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefetch(() => void load());

  return { data, error, reload: load };
}
