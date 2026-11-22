import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useT } from "../../i18n";
import { prefersTextMap, type MapLine, type MapPoint } from "./geo";

// Area-level map (A10): donor 🍲 and receiver 🏠 markers, a straight line for an active
// listing or task, and a distance label. Leaflet loads lazily; offline, on a slow connection or
// when tiles fail, a text version (area names and distance) is shown instead.

const LeafletMap = lazy(() => import("./LeafletMap"));

/** A failed lazy import (offline) falls back to the text map. */
class LoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const ICON: Record<MapPoint["kind"], string> = { donor: "🍲", receiver: "🏠" };

function TextMap({ points, distanceKm }: { points: MapPoint[]; distanceKm?: number }) {
  const { t, lang } = useT();
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-800/10">
      <ul className="flex flex-col gap-1.5">
        {points.map((p, i) => (
          <li key={`${p.kind}-${p.name}-${i}`} className="flex items-start gap-2 text-ink">
            <span aria-hidden="true">{ICON[p.kind]}</span>
            <span>
              <span className="font-bold">{p.area}</span>
              <span className="text-ink/70"> · {p.name}</span>
            </span>
          </li>
        ))}
      </ul>
      {distanceKm !== undefined && (
        <p className="font-bold text-leaf-800">
          {t("map.distance", { km: distanceKm.toLocaleString(lang === "te" ? "te-IN" : "en-IN") })}
        </p>
      )}
      <p className="text-xs text-ink/70">{t("map.textOnly")}</p>
    </div>
  );
}

export function AreaMap({
  points,
  lines = [],
  distanceKm,
  label,
  tall = false,
}: {
  points: MapPoint[];
  lines?: MapLine[];
  /** Shown under the map (and in the text version). */
  distanceKm?: number;
  /** Accessible name for the map region. */
  label: string;
  tall?: boolean;
}) {
  const { t, lang } = useT();
  const [textOnly, setTextOnly] = useState(prefersTextMap);

  useEffect(() => {
    const goOffline = () => setTextOnly(true);
    // Back online: try the real map again (unless the device asks to save data).
    const goOnline = () => setTextOnly(prefersTextMap());
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (points.length === 0) return null;
  const text = <TextMap points={points} distanceKm={distanceKm} />;

  return (
    <section aria-label={label} className="flex flex-col gap-2">
      {textOnly ? (
        text
      ) : (
        <LoadBoundary fallback={text}>
          <Suspense
            fallback={
              <div
                className={`${tall ? "h-80 lg:h-[34rem]" : "h-52 lg:h-64"} animate-pulse rounded-2xl bg-leaf-50 ring-1 ring-leaf-800/10`}
              />
            }
          >
            <LeafletMap
              points={points}
              lines={lines}
              onTilesFailed={() => setTextOnly(true)}
              className={`${tall ? "h-80 lg:h-[34rem]" : "h-52 lg:h-64"} relative isolate z-0 overflow-hidden rounded-2xl ring-1 ring-leaf-800/10`}
            />
          </Suspense>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/70">
            <span className="flex gap-3">
              <span>🍲 {t("map.legend.donor")}</span>
              <span>🏠 {t("map.legend.receiver")}</span>
            </span>
            {distanceKm !== undefined && (
              <span className="font-bold text-leaf-800">
                {t("map.distance", {
                  km: distanceKm.toLocaleString(lang === "te" ? "te-IN" : "en-IN"),
                })}
              </span>
            )}
          </div>
        </LoadBoundary>
      )}
    </section>
  );
}
