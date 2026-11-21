import type { Listing, Task, VolunteerAvailability, VolunteerHistoryItem } from "../types/api";
import { DEMO_ACCOUNTS } from "./demoData";
import { ORGS } from "./fixtures";
import { assignVolunteer, listingStore, markDelivered, markPickedUp } from "./listings";
// Receiver decisions re-apply their claims at load; tasks are derived from those claims.
import "./receiver";

// Volunteer-side mock server. There is no separate task list: a delivery task exists for every
// listing a kitchen has claimed. Accepting, pickup and delivery move the shared listing forward,
// so the donor and the kitchen see the same progress, and the codes are the same ones they see:
// the donor's pickup_code and the kitchen's delivery_code.
//
// Demo listings are re-seeded on every load, so the volunteer's progress on them is kept in
// localStorage and re-applied here (like the receiver's accepted offers).

const STORE_KEY = "al.mock.volunteer";
const DAY_MS = 24 * 60 * 60_000;

/** Wrong attempts allowed per code. The attempt after this is CODE_LOCKED. */
export const MAX_CODE_TRIES = 5;
export const DEFAULT_VEHICLE = "two-wheeler";
const VEHICLE_MEAL_CAPACITY: Record<string, number> = {
  "two-wheeler": 40,
  scooter: 40,
  bike: 40,
  car: 150,
  van: 300,
};

type Progress = "accepted" | "picked_up" | "delivered";

interface TaskState {
  progress?: Progress;
  volunteer_id?: string;
  pickup_attempts: number;
  delivery_attempts: number;
  meals_delivered?: number;
  delivered_at?: string;
}

interface VolunteerStore {
  available: boolean;
  tasks: Record<string, TaskState>; // keyed by listing id
}

export type VolunteerFailureReason =
  | "not_found"
  | "unavailable"
  | "already_active"
  | "not_open"
  | "not_accepted"
  | "not_picked_up"
  | "invalid_code"
  | "invalid_meals"
  | "locked"
  | "wrong_code";

export interface VolunteerFailure {
  ok: false;
  reason: VolunteerFailureReason;
  tries_left?: number;
}

export type VolunteerResult<T> = { ok: true; value: T } | VolunteerFailure;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; state stays in memory for this session.
  }
}

const saved = readJson<Partial<VolunteerStore>>(STORE_KEY, {});
const store: VolunteerStore = {
  available: typeof saved.available === "boolean" ? saved.available : true,
  tasks: saved.tasks ?? {},
};

function save(): void {
  writeJson(STORE_KEY, store);
}

function stateOf(listingId: string): TaskState {
  store.tasks[listingId] ??= { pickup_attempts: 0, delivery_attempts: 0 };
  return store.tasks[listingId];
}

function volunteerAccount(volunteerId: string) {
  return DEMO_ACCOUNTS.find((a) => a.user.id === volunteerId);
}

function volunteerName(volunteerId: string): string {
  return volunteerAccount(volunteerId)?.user.display_name ?? volunteerId;
}

function vehicleOf(volunteerId: string): string {
  return volunteerAccount(volunteerId)?.user.vehicle ?? DEFAULT_VEHICLE;
}

const taskIdOf = (listingId: string) => `tsk-${listingId}`;
const listingIdOf = (taskId: string) => (taskId.startsWith("tsk-") ? taskId.slice(4) : taskId);

// Re-apply saved progress to the freshly seeded demo listings.
for (const [listingId, st] of Object.entries(store.tasks)) {
  const name = st.volunteer_id ? volunteerName(st.volunteer_id) : undefined;
  const at = st.delivered_at ? Date.parse(st.delivered_at) : Date.now();
  if (name && st.progress) assignVolunteer(listingId, name, vehicleOf(st.volunteer_id!), at);
  if (st.progress === "picked_up" || st.progress === "delivered") markPickedUp(listingId, at);
  if (st.progress === "delivered") markDelivered(listingId, at);
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function taskStatus(listing: Listing): Task["status"] | undefined {
  switch (listing.status) {
    case "claimed":
      return "open";
    case "volunteer_assigned":
      return "accepted";
    case "picked_up":
      return "picked_up";
    case "delivered":
      return "delivered";
    default:
      return undefined;
  }
}

/** The task for a listing as a volunteer may see it: never the pickup or delivery code. */
function toTask(listing: Listing, volunteerId: string): Task | undefined {
  const status = taskStatus(listing);
  const donor = ORGS[listing.donor_org];
  const receiver = listing.receiver_org ? ORGS[listing.receiver_org] : undefined;
  if (!status || !donor || !receiver) return undefined;
  const view: Listing = { ...listing };
  delete view.pickup_code;
  delete view.delivery_code;
  const pickedUp = status === "picked_up" || status === "delivered";
  return {
    id: taskIdOf(listing.id),
    listing: view,
    donor_org: donor.id,
    receiver_org: receiver.id,
    distance_km: distanceKm(donor, receiver),
    deadline: pickedUp ? listing.safety.serve_by : listing.pickup_by,
    status,
    meals: listing.total_meals,
    vehicle_fit: listing.total_meals <= (VEHICLE_MEAL_CAPACITY[vehicleOf(volunteerId)] ?? 40),
    pickup: { name: donor.name, area: donor.area, lat: donor.lat, lng: donor.lng },
    delivery: {
      name: receiver.name,
      area: receiver.area,
      lat: receiver.lat,
      lng: receiver.lng,
      serve_by: listing.safety.serve_by,
    },
    volunteer_id: status === "open" ? undefined : ownerOf(listing, volunteerId),
  };
}

/** Who holds the task: the saved owner, or the demo volunteer named on the seeded listing. */
function ownerOf(listing: Listing, volunteerId: string): string | undefined {
  const saved = store.tasks[listing.id]?.volunteer_id;
  if (saved) return saved;
  return listing.volunteer === volunteerName(volunteerId) ? volunteerId : undefined;
}

function isVisibleTo(task: Task, volunteerId: string): boolean {
  if (task.status === "open") return Date.parse(task.listing.pickup_by) > Date.now();
  if (task.volunteer_id !== volunteerId) return false;
  // Keep delivered tasks out of the list after a day; they live in history.
  return task.status !== "delivered" || Date.now() - Date.parse(task.deadline) < DAY_MS;
}

function allTasks(volunteerId: string): Task[] {
  return listingStore.map((l) => toTask(l, volunteerId)).filter((t): t is Task => t !== undefined);
}

function findListing(taskId: string): Listing | undefined {
  return listingStore.find((l) => l.id === listingIdOf(taskId));
}

export function availabilityState(): VolunteerAvailability {
  return { available: store.available };
}

export function setAvailability(available: boolean): { ok: true } {
  store.available = available;
  save();
  return { ok: true };
}

/** GET /api/tasks: this volunteer's active task first, then open tasks by deadline. */
export function visibleTasks(volunteerId: string): Task[] {
  const rank = (t: Task) => (t.status === "open" ? 1 : 0);
  return allTasks(volunteerId)
    .filter((t) => t.status !== "delivered" && isVisibleTo(t, volunteerId))
    .filter((t) => store.available || t.status !== "open")
    .sort((a, b) => rank(a) - rank(b) || Date.parse(a.deadline) - Date.parse(b.deadline));
}

export function visibleTask(volunteerId: string, taskId: string): Task | undefined {
  const listing = findListing(taskId);
  const task = listing ? toTask(listing, volunteerId) : undefined;
  return task && isVisibleTo(task, volunteerId) ? task : undefined;
}

function hasActiveTask(volunteerId: string): boolean {
  return allTasks(volunteerId).some(
    (t) => t.volunteer_id === volunteerId && (t.status === "accepted" || t.status === "picked_up"),
  );
}

/** POST /api/tasks/:id/accept → Task. Claimed listing → volunteer assigned. */
export function acceptTask(
  volunteerId: string,
  taskId: string,
  nowMs = Date.now(),
): VolunteerResult<Task> {
  const listing = findListing(taskId);
  const task = listing ? toTask(listing, volunteerId) : undefined;
  if (!listing || !task || !isVisibleTo(task, volunteerId))
    return { ok: false, reason: "not_found" };
  if (!store.available) return { ok: false, reason: "unavailable" };
  if (task.status !== "open") return { ok: false, reason: "not_open" };
  if (hasActiveTask(volunteerId)) return { ok: false, reason: "already_active" };
  const st = stateOf(listing.id);
  st.progress = "accepted";
  st.volunteer_id = volunteerId;
  save();
  assignVolunteer(listing.id, volunteerName(volunteerId), vehicleOf(volunteerId), nowMs);
  return { ok: true, value: toTask(listing, volunteerId)! };
}

function ownedListing(volunteerId: string, taskId: string): Listing | undefined {
  const listing = findListing(taskId);
  const task = listing ? toTask(listing, volunteerId) : undefined;
  return task?.volunteer_id === volunteerId ? listing : undefined;
}

function checkCode(
  expected: string | undefined,
  code: unknown,
  attempts: number,
): VolunteerFailure | "ok" | "wrong" {
  if (typeof code !== "string" || !/^\d{4}$/.test(code))
    return { ok: false, reason: "invalid_code" };
  if (attempts >= MAX_CODE_TRIES) return { ok: false, reason: "locked" };
  return code === expected ? "ok" : "wrong";
}

/** POST /api/tasks/:id/pickup { code } → Listing (contract). Needs the donor's pickup code. */
export function submitPickup(
  volunteerId: string,
  taskId: string,
  code: unknown,
  nowMs = Date.now(),
): VolunteerResult<Listing> {
  const listing = ownedListing(volunteerId, taskId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "volunteer_assigned") return { ok: false, reason: "not_accepted" };
  const st = stateOf(listing.id);
  const check = checkCode(listing.pickup_code, code, st.pickup_attempts);
  if (typeof check === "object") return check;
  if (check === "wrong") {
    st.pickup_attempts += 1;
    save();
    return {
      ok: false,
      reason: "wrong_code",
      tries_left: Math.max(0, MAX_CODE_TRIES - st.pickup_attempts),
    };
  }
  st.progress = "picked_up";
  st.volunteer_id = volunteerId;
  save();
  markPickedUp(listing.id, nowMs);
  return { ok: true, value: toTask(listing, volunteerId)!.listing };
}

export interface DeliverRequest {
  code: unknown;
  meals_delivered: unknown;
}

/** POST /api/tasks/:id/deliver { code, meals_delivered } → Listing (contract). */
export function submitDelivery(
  volunteerId: string,
  taskId: string,
  input: DeliverRequest,
  nowMs = Date.now(),
): VolunteerResult<Listing> {
  const listing = ownedListing(volunteerId, taskId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "picked_up") return { ok: false, reason: "not_picked_up" };
  const meals = input.meals_delivered;
  if (
    typeof meals !== "number" ||
    !Number.isInteger(meals) ||
    meals < 1 ||
    meals > listing.total_meals
  ) {
    return { ok: false, reason: "invalid_meals" };
  }
  const st = stateOf(listing.id);
  const check = checkCode(listing.delivery_code, input.code, st.delivery_attempts);
  if (typeof check === "object") return check;
  if (check === "wrong") {
    st.delivery_attempts += 1;
    save();
    return {
      ok: false,
      reason: "wrong_code",
      tries_left: Math.max(0, MAX_CODE_TRIES - st.delivery_attempts),
    };
  }
  st.progress = "delivered";
  st.volunteer_id = volunteerId;
  st.meals_delivered = meals;
  st.delivered_at = new Date(nowMs).toISOString();
  save();
  markDelivered(listing.id, nowMs);
  return { ok: true, value: toTask(listing, volunteerId)!.listing };
}

/** GET /api/volunteer/history: this volunteer's deliveries, newest first. */
export function volunteerHistory(volunteerId: string): VolunteerHistoryItem[] {
  return allTasks(volunteerId)
    .filter((t) => t.status === "delivered" && t.volunteer_id === volunteerId)
    .map((t) => {
      const st = store.tasks[t.listing.id];
      const deliveredEvent = t.listing.timeline?.find((e) => e.status === "delivered");
      return {
        id: t.id,
        items_title: t.listing.items.map((i) => i.name).join(", "),
        meals: st?.meals_delivered ?? t.meals,
        delivered_at: st?.delivered_at ?? deliveredEvent?.at ?? t.listing.created_at,
        donor_area: t.pickup.area,
        receiver_area: t.delivery.area,
      };
    })
    .sort((a, b) => Date.parse(b.delivered_at) - Date.parse(a.delivered_at));
}
