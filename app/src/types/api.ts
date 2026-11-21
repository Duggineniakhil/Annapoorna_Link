export type Role = "donor" | "receiver" | "volunteer" | "sponsor";

export type DonorType = "caterer" | "wedding_hall" | "hostel_mess" | "restaurant";

export type Storage = "hot" | "room" | "chilled";

export type Category =
  "rice_dish" | "curry" | "bread" | "dry_snack" | "sweet" | "dairy_based" | "salad_cut_fruit";

export type Allergen =
  "nuts" | "peanuts" | "dairy" | "gluten" | "egg" | "seafood" | "soy" | "sesame";

export type Status =
  | "posted"
  | "offered"
  | "claimed"
  | "volunteer_assigned"
  | "picked_up"
  | "delivered"
  | "expired"
  | "cancelled";

export interface Org {
  id: string;
  type: "donor" | "receiver";
  donor_type?: DonorType;
  name: string;
  area: string;
  lat: number;
  lng: number;
  veg_only?: boolean;
  open_from?: string;
  open_to?: string;
}

export interface User {
  id: string;
  role: Role;
  display_name: string;
  org_id?: string;
  lang: "en" | "te";
  vehicle?: string;
  capacity_meals?: number;
  available?: boolean;
}

export interface ListingItem {
  name: string;
  category: Category;
  qty_meals: number;
  qty_kg?: number;
}

export interface Listing {
  id: string;
  donor_org: string;
  items: ListingItem[];
  total_meals: number;
  veg: boolean;
  allergens: Allergen[];
  storage: Storage;
  cooked_at: string;
  pickup_by: string;
  status: Status;
  created_at: string;
  posted_in_ms: number;
  receiver_org?: string;
  volunteer?: string;
  volunteer_vehicle?: string;
  matched_receiver?: { name: string; area: string; distance_km?: number };
  timeline?: TimelineEvent[];
  pickup_code?: string;
  delivery_code?: string;
  safety: {
    max_pickup_by: string;
    serve_by: string;
    guidance_en: string;
    guidance_te: string;
  };
}

export interface Offer {
  id: string;
  listing: Listing;
  rank: number;
  score: number;
  reasons: { en: string; te: string }[];
  expires_at: string;
  distance_km: number;
  eta_min: number;
  // Contract (doc 12). The receiver's delivery code is listing.delivery_code, once accepted.
  status: OfferStatus;
  /** The assigned volunteer, or else the best available candidate; null if nobody can make it. */
  volunteer_first_name?: string | null;
  /** Minutes for that volunteer to reach the donor; null (or missing) with the name. */
  volunteer_eta_min?: number | null;
}

export type OfferStatus = "open" | "accepted" | "declined" | "expired";

/** An offer as the demo data seeds it, before status and volunteer are worked out. */
export type OfferSeed = Omit<Offer, "status" | "volunteer_first_name" | "volunteer_eta_min">;

export type DeclineReason = "too_far" | "cant_accept_type" | "no_space" | "closing";

export type ReceiverNeeds = {
  meals_needed: number;
  veg_only: boolean;
  open_from: string; // HH:MM
  open_to: string; // HH:MM
};

/** GET /api/receiver/history item (doc 12): newest first, at most 50. */
export type ReceiverHistoryItem = {
  offer_id: string;
  offer_status: OfferStatus;
  listing: Listing;
  /** Meals the volunteer confirmed delivering; null until delivered. */
  meals_delivered: number | null;
  /** When it last changed: delivered, decided or expired. */
  at: string;
};

export type TaskStatus = "open" | "accepted" | "picked_up" | "delivered";

export interface TaskPlace {
  name: string;
  area: string;
  lat: number;
  lng: number;
}

// Client view of a task. The donor's pickup_code and the receiver's delivery_code are never sent.
// status, meals, vehicle_fit, pickup, delivery and volunteer_id were added in A8 (B to confirm).
export interface Task {
  id: string;
  listing: Listing;
  donor_org: string;
  receiver_org: string;
  distance_km: number;
  deadline: string;
  status: TaskStatus;
  meals: number;
  /** Whether the volunteer's vehicle suits the task (mock: meals within the vehicle's capacity). */
  vehicle_fit: boolean;
  pickup: TaskPlace;
  delivery: TaskPlace & { serve_by: string };
  volunteer_id?: string;
}

/** The fields the mock seeds before status and volunteer are known. */
export type TaskSeed = Pick<
  Task,
  "id" | "listing" | "donor_org" | "receiver_org" | "distance_km" | "deadline"
>;

export interface VolunteerAvailability {
  available: boolean;
}

export interface DeliverInput {
  code: string;
  meals_delivered: number;
}

export interface VolunteerHistoryItem {
  id: string;
  items_title: string;
  meals: number;
  delivered_at: string;
  donor_area: string;
  receiver_area: string;
}

export interface TimelineEvent {
  type: string;
  status: Status;
  at: string;
  actor_role: Role;
  note?: string;
}

export interface ImpactAssumption {
  key: string;
  label_en: string;
  label_te: string;
  value: number;
  source?: string;
}

export interface Impact {
  meals: number;
  kg: number;
  co2e_kg: number;
  on_time_rate: number;
  median_claim_min: number;
  rescue_rate: number;
  assumptions: ImpactAssumption[];
}

/** One delivery on the sponsor activity map (added in A10, B to confirm). */
export interface MapDelivery {
  listing_id: string;
  donor_org: string;
  receiver_org: string;
  meals: number;
  delivered_at: string;
}

/** GET /api/map. recent = deliveries in the last 24 h. */
export interface MapData {
  donors: Org[];
  receivers: Org[];
  recent: MapDelivery[];
}

/** One bar of the weekly chart: meals delivered in the week starting week_start (A11, B to confirm). */
export interface ImpactWeek {
  week_start: string;
  meals: number;
}

/** A breakdown row (by area or donor type) on the city dashboard (A11, B to confirm). */
export interface ImpactBreakdown {
  key: string;
  meals: number;
}

/** GET /api/impact: Impact plus the period, the weekly series, and breakdowns for scope=city. */
export interface ImpactReport extends Impact {
  from: string;
  to: string;
  weekly: ImpactWeek[];
  by_area?: ImpactBreakdown[];
  by_donor_type?: ImpactBreakdown[];
}
