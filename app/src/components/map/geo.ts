// Small geometry helpers for area-level maps (no street addresses anywhere).

export type LatLng = { lat: number; lng: number };

export type MapPoint = LatLng & {
  kind: "donor" | "receiver";
  /** Org name, shown in the marker popup and the text fallback. */
  name: string;
  area: string;
};

export type MapLine = { from: LatLng; to: LatLng };

/** Straight-line distance in km (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** One decimal, at least 0.1 km. */
export function roundKm(km: number): number {
  return Math.max(0.1, Math.round(km * 10) / 10);
}

/** True when the device says it is offline or asks to save data / is on a very slow network. */
export function prefersTextMap(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.onLine === false) return true;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  return Boolean(
    connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? ""),
  );
}
