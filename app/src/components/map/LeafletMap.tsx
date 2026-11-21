import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapLine, MapPoint } from "./geo";

// The Leaflet part of AreaMap. Only this file imports Leaflet, and AreaMap loads it lazily, so
// Leaflet is never in the first screen's bundle.

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
/** If no tile has loaded by then (offline, blocked, very slow), show the text instead. */
const TILE_TIMEOUT_MS = 8000;
const TILE_ERRORS_BEFORE_FALLBACK = 4;

const ICON: Record<MapPoint["kind"], string> = { donor: "🍲", receiver: "🏠" };

function markerIcon(kind: MapPoint["kind"]): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span class="al-map-pin al-map-pin-${kind}" aria-hidden="true">${ICON[kind]}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function LeafletMap({
  points,
  lines,
  onTilesFailed,
  className,
}: {
  points: MapPoint[];
  lines: MapLine[];
  onTilesFailed(): void;
  className: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const failed = useRef(onTilesFailed);
  const data = useRef({ points, lines });
  useEffect(() => {
    failed.current = onTilesFailed;
    data.current = { points, lines };
  });
  // Rebuild only when the places change, not on every render (screens refetch often).
  const signature = JSON.stringify([points, lines]);

  useEffect(() => {
    if (!el.current) return;
    const { points, lines } = data.current;
    const map = L.map(el.current, {
      scrollWheelZoom: false,
      // On phones one finger scrolls the page, not the map.
      dragging: !L.Browser.mobile,
      zoomControl: true,
      attributionControl: true,
    });

    let loaded = false;
    let errors = 0;
    const tiles = L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 18 });
    tiles.on("tileload", () => {
      loaded = true;
    });
    tiles.on("tileerror", () => {
      errors += 1;
      if (!loaded && errors >= TILE_ERRORS_BEFORE_FALLBACK) failed.current();
    });
    tiles.addTo(map);
    const timer = window.setTimeout(() => {
      if (!loaded) failed.current();
    }, TILE_TIMEOUT_MS);

    for (const line of lines) {
      L.polyline(
        [
          [line.from.lat, line.from.lng],
          [line.to.lat, line.to.lng],
        ],
        { color: "#14532d", weight: 3, opacity: 0.8, dashArray: "6 8" },
      ).addTo(map);
    }
    for (const p of points) {
      L.marker([p.lat, p.lng], { icon: markerIcon(p.kind), title: `${p.name}, ${p.area}` })
        .bindPopup(`<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(p.area)}`)
        .addTo(map);
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    if (points.length === 1) map.setView(bounds.getCenter(), 13);
    else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });

    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [signature]);

  return <div ref={el} className={className} />;
}
