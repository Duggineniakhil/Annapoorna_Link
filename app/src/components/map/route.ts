import { ORGS } from "../../mocks/fixtures";
import { distanceKm, roundKm, type LatLng, type MapLine, type MapPoint } from "./geo";

export interface MapRoute {
  points: MapPoint[];
  lines: MapLine[];
  distanceKm: number;
}

/** Donor → receiver for a listing, offer or task. Undefined if either place is unknown. */
export function routeBetween(
  pickup: (LatLng & { name: string; area: string }) | undefined,
  drop: (LatLng & { name: string; area: string }) | undefined,
  knownKm?: number,
): MapRoute | undefined {
  if (!pickup || !drop) return undefined;
  return {
    points: [
      { ...pickup, kind: "donor" },
      { ...drop, kind: "receiver" },
    ],
    lines: [{ from: pickup, to: drop }],
    distanceKm: roundKm(knownKm ?? distanceKm(pickup, drop)),
  };
}

/** The same, from org ids (area-level coordinates). */
export function routeBetweenOrgs(
  donorOrgId: string | undefined,
  receiverOrgId: string | undefined,
  knownKm?: number,
): MapRoute | undefined {
  const donor = donorOrgId ? ORGS[donorOrgId] : undefined;
  const receiver = receiverOrgId ? ORGS[receiverOrgId] : undefined;
  return routeBetween(donor, receiver, knownKm);
}
