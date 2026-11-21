// Server response shapes, as served by server/ (docs/12-team-split.md section 2).
// Screens read these through src/api/adapt.ts, so a contract change touches one file.

export type Role = "donor" | "receiver" | "volunteer" | "sponsor";
export type Storage = "hot" | "room" | "chilled";
export type Category = "rice_dish" | "curry" | "bread" | "dry_snack" | "sweet" | "dairy_based" | "salad_cut_fruit";
export type Allergen = "nuts" | "peanuts" | "dairy" | "gluten" | "egg" | "seafood" | "soy" | "sesame";
export type Status = "posted" | "offered" | "claimed" | "volunteer_assigned" | "picked_up" | "delivered" | "expired" | "cancelled";
export type Lang = "en" | "te";

export interface Bilingual { en: string; te: string }

export interface Org {
  id: string;
  type: "donor" | "receiver";
  donor_type?: "caterer" | "wedding_hall" | "hostel_mess" | "restaurant";
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
  org_id?: string | null;
  lang: Lang;
  vehicle?: "two_wheeler" | "car" | null;
  capacity_meals?: number;
  available?: boolean;
}

export interface ListingItem { name: string; category: Category; qty_meals: number; qty_kg?: number }

export interface TimelineEvent { type: string; status: Status; at: string; actor_role: Role; note?: string }

export interface Listing {
  id: string;
  donor_org: Org;
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
  receiver_org?: Org | null;
  volunteer?: { id: string; display_name: string; vehicle?: string | null } | null;
  pickup_code?: string | null;
  delivery_code?: string | null;
  safety: { max_pickup_by: string; serve_by: string; guidance_en: string; guidance_te: string };
  timeline?: TimelineEvent[];
}

export interface Offer {
  id: string;
  status: "open" | "accepted" | "declined" | "expired";
  listing: Listing;
  rank: number;
  score: number;
  reasons: Bilingual[];
  expires_at: string;
  distance_km: number;
  eta_min: number;
  volunteer_first_name?: string | null;
  volunteer_eta_min?: number | null;
}

export interface Place { name: string; area: string; lat: number; lng: number }

export interface Task {
  id: string;
  listing: Listing;
  donor_org: Org;
  receiver_org: Org;
  distance_km: number;
  deadline: string;
  status: "open" | "accepted" | "picked_up" | "delivered";
  meals: number;
  vehicle_fit: boolean;
  pickup: Place;
  delivery: Place & { serve_by: string };
  volunteer_id?: string;
}

export interface Assumption { key: string; label_en: string; label_te: string; value: string | number; source?: string }

export interface Impact {
  meals: number;
  kg: number;
  co2e_kg: number;
  on_time_rate: number;
  median_claim_min: number;
  rescue_rate: number;
  assumptions: Assumption[];
  by_area?: { area: string; meals: number; kg: number; co2e_kg: number }[];
  by_donor_type?: { donor_type: string; meals: number; kg: number; co2e_kg: number }[];
}

export interface DemoAccount { account_id: string; role: Role; label: string; area: string }
export interface Session { token: string; user: User; org?: Org }
export interface Guidance { max_pickup_by: string; serve_by: string; guidance_en: string; guidance_te: string }
export interface Needs { meals_needed: number; veg_only: boolean; open_from: string; open_to: string }
export interface HistoryItem { offer_id: string; offer_status: Offer["status"]; listing: Listing; meals_delivered: number | null; at: string }
export interface ApiErrorBody { error_code: string; message: string; message_te: string; remaining_tries?: number }

export interface NewListing {
  items: ListingItem[];
  veg: boolean;
  allergens: Allergen[];
  storage: Storage;
  cooked_at: string;
  pickup_by: string;
  posted_in_ms: number;
}
