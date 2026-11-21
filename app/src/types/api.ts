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
}

export interface Task {
  id: string;
  listing: Listing;
  donor_org: string;
  receiver_org: string;
  distance_km: number;
  deadline: string;
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
