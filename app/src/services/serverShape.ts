import type { Org } from "../types/api";
import { ORGS, orgDistanceKm } from "../mocks/fixtures";

// Turns the real server's response shapes into the ones the app uses (doc 12 vs server/src/views.ts).
//
// The server sends organisations and the volunteer as objects inside listings and tasks:
//   donor_org / receiver_org: Org (receiver_org is null before a claim)
//   volunteer: { id, display_name, vehicle } | null
// The app works with org ids and the volunteer's name, and looks up org names, areas and distances
// by id. So every org the server sends is remembered, then replaced by its id, and a claimed
// listing gets matched_receiver (name, area, distance) like the mock gives it.
// Only used for real server responses; the mock already answers in the app's shapes.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function isOrg(v: unknown): v is Org {
  return (
    isObj(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.area === "string" &&
    (v.type === "donor" || v.type === "receiver")
  );
}

/** Remembers an org from the server so orgName / orgArea / orgDistanceKm know it. */
export function rememberOrg(org: Org): void {
  ORGS[org.id] = { ...ORGS[org.id], ...org };
}

function orgId(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (isOrg(v)) {
    rememberOrg(v);
    return v.id;
  }
  return undefined;
}

function fixObject(o: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) out[k] = fromServer(v);

  if ("donor_org" in out) {
    const id = orgId(o.donor_org);
    if (id) out.donor_org = id;
  }
  if ("receiver_org" in out) {
    const id = orgId(o.receiver_org);
    if (id) out.receiver_org = id;
    else delete out.receiver_org;
  }
  if ("volunteer" in out) {
    const v = o.volunteer;
    if (isObj(v) && typeof v.display_name === "string") {
      out.volunteer = v.display_name;
      if (typeof v.vehicle === "string" && out.volunteer_vehicle === undefined) {
        out.volunteer_vehicle = v.vehicle;
      }
    } else if (v === null) {
      delete out.volunteer;
    }
  }
  // A listing (it has items and safety) claimed by a kitchen: show who and how far, like the mock.
  if (
    Array.isArray(out.items) &&
    isObj(out.safety) &&
    out.matched_receiver === undefined &&
    isOrg(o.receiver_org)
  ) {
    const km = orgDistanceKm(out.donor_org as string, o.receiver_org.id);
    out.matched_receiver = {
      name: o.receiver_org.name,
      area: o.receiver_org.area,
      ...(km !== undefined ? { distance_km: km } : {}),
    };
  }
  // Orgs elsewhere (login, map) are remembered too.
  if (isOrg(o)) rememberOrg(o);
  return out;
}

/** Deep-converts a successful server response body into the app's shapes. */
export function fromServer(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(fromServer);
  if (isObj(body)) return fixObject(body);
  return body;
}
