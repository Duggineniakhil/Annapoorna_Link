import { z } from "zod";
import { AppError } from "./errors.js";

export const RoleSchema = z.enum(["donor", "receiver", "volunteer", "sponsor"]);
export type Role = z.infer<typeof RoleSchema>;

export const DonorTypeSchema = z.enum(["caterer", "wedding_hall", "hostel_mess", "restaurant"]);
export type DonorType = z.infer<typeof DonorTypeSchema>;

export const StorageSchema = z.enum(["hot", "room", "chilled"]);
export type Storage = z.infer<typeof StorageSchema>;

export const CategorySchema = z.enum([
  "rice_dish",
  "curry",
  "bread",
  "dry_snack",
  "sweet",
  "dairy_based",
  "salad_cut_fruit",
]);
export type Category = z.infer<typeof CategorySchema>;

export const AllergenSchema = z.enum([
  "nuts",
  "peanuts",
  "dairy",
  "gluten",
  "egg",
  "seafood",
  "soy",
  "sesame",
]);
export type Allergen = z.infer<typeof AllergenSchema>;

export const StatusSchema = z.enum([
  "posted",
  "offered",
  "claimed",
  "volunteer_assigned",
  "picked_up",
  "delivered",
  "expired",
  "cancelled",
]);
export type Status = z.infer<typeof StatusSchema>;

export const LangSchema = z.enum(["en", "te"]);
export type Lang = z.infer<typeof LangSchema>;

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const IsoDate = z.string().datetime({ offset: true });
const PickupCode = z.string().regex(/^\d{4}$/);
const Vehicle = z.enum(["two_wheeler", "car"]);

export const OrgSchema = z.object({
  id: z.string(),
  type: z.enum(["donor", "receiver"]),
  donor_type: DonorTypeSchema.optional(),
  name: z.string(),
  area: z.string(),
  lat: z.number(),
  lng: z.number(),
  veg_only: z.boolean().optional(),
  open_from: HHMM.optional(),
  open_to: HHMM.optional(),
});
export type Org = z.infer<typeof OrgSchema>;

export const UserSchema = z.object({
  id: z.string(),
  role: RoleSchema,
  display_name: z.string(),
  org_id: z.string().nullable().optional(),
  lang: LangSchema,
  vehicle: Vehicle.nullable().optional(),
  capacity_meals: z.number().int().min(0).optional(),
  available: z.boolean().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const ListingItemSchema = z.object({
  name: z.string().min(1),
  category: CategorySchema,
  qty_meals: z.number().int().min(1),
  qty_kg: z.number().min(0).optional(),
});
export type ListingItem = z.infer<typeof ListingItemSchema>;

export const SafetySchema = z.object({
  max_pickup_by: IsoDate,
  serve_by: IsoDate,
  guidance_en: z.string(),
  guidance_te: z.string(),
});
export type Safety = z.infer<typeof SafetySchema>;

export const VolunteerSummarySchema = z.object({
  id: z.string(),
  display_name: z.string(),
  vehicle: Vehicle.nullable().optional(),
});

export const ListingSchema = z.object({
  id: z.string(),
  donor_org: OrgSchema,
  items: z.array(ListingItemSchema).min(1),
  total_meals: z.number().int().min(0),
  veg: z.boolean(),
  allergens: z.array(AllergenSchema),
  storage: StorageSchema,
  cooked_at: IsoDate,
  pickup_by: IsoDate,
  status: StatusSchema,
  created_at: IsoDate,
  posted_in_ms: z.number().int().min(0),
  receiver_org: OrgSchema.nullable().optional(),
  volunteer: VolunteerSummarySchema.nullable().optional(),
  pickup_code: PickupCode.nullable().optional(),
  delivery_code: PickupCode.nullable().optional(),
  safety: SafetySchema,
});
export type Listing = z.infer<typeof ListingSchema>;

export const TimelineEventSchema = z.object({
  type: z.string(),
  status: StatusSchema,
  at: IsoDate,
  actor_role: RoleSchema,
  note: z.string().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const ListingWithTimelineSchema = ListingSchema.extend({
  timeline: z.array(TimelineEventSchema),
});

// API name for a waiting offer is "open" (stored as "pending" in the database).
export const OfferStatusSchema = z.enum(["open", "accepted", "declined", "expired"]);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

export const OfferSchema = z.object({
  id: z.string(),
  status: OfferStatusSchema,
  listing: ListingSchema,
  rank: z.number().int().min(1),
  score: z.number(),
  reasons: z.array(z.object({ en: z.string(), te: z.string() })),
  expires_at: IsoDate,
  distance_km: z.number().min(0),
  eta_min: z.number().min(0),
  // Assigned volunteer, else the best available candidate; null when nobody can make it.
  volunteer_first_name: z.string().nullable().optional(),
  volunteer_eta_min: z.number().min(0).nullable().optional(),
});
export type Offer = z.infer<typeof OfferSchema>;

export const ReceiverHistoryItemSchema = z.object({
  offer_id: z.string(),
  offer_status: OfferStatusSchema,
  listing: ListingSchema,
  meals_delivered: z.number().int().min(0).nullable(),
  at: IsoDate,
});
export type ReceiverHistoryItem = z.infer<typeof ReceiverHistoryItemSchema>;

export const TaskStatusSchema = z.enum(["open", "accepted", "picked_up", "delivered"]);

const TaskPlaceSchema = z.object({ name: z.string(), area: z.string(), lat: z.number(), lng: z.number() });

export const TaskSchema = z.object({
  id: z.string(),
  listing: ListingSchema,
  donor_org: OrgSchema,
  receiver_org: OrgSchema,
  distance_km: z.number().min(0),
  deadline: IsoDate,
  status: TaskStatusSchema,
  meals: z.number().int().min(0),
  vehicle_fit: z.boolean(), // the signed-in volunteer's vehicle can carry the meals
  pickup: TaskPlaceSchema,
  delivery: TaskPlaceSchema.extend({ serve_by: IsoDate }),
  volunteer_id: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const AssumptionSchema = z.object({
  key: z.string(),
  label_en: z.string(),
  label_te: z.string(),
  value: z.union([z.string(), z.number()]),
  source: z.string().optional(),
});

export const ImpactSchema = z.object({
  meals: z.number().int().min(0),
  kg: z.number().min(0),
  co2e_kg: z.number().min(0),
  on_time_rate: z.number().min(0).max(1),
  median_claim_min: z.number().min(0),
  rescue_rate: z.number().min(0).max(1),
  assumptions: z.array(AssumptionSchema),
  by_area: z
    .array(z.object({ area: z.string(), meals: z.number(), kg: z.number(), co2e_kg: z.number() }))
    .optional(),
  by_donor_type: z
    .array(z.object({ donor_type: DonorTypeSchema, meals: z.number(), kg: z.number(), co2e_kg: z.number() }))
    .optional(),
  // Present when the request gives from and to: the period and meals per week (Monday, IST).
  from: z.string().optional(),
  to: z.string().optional(),
  weekly: z.array(z.object({ week_start: z.string(), meals: z.number().int().min(0) })).optional(),
});
export type Impact = z.infer<typeof ImpactSchema>;

export const HealthSchema = z.object({
  ok: z.boolean(),
  db: z.string(),
  version: z.string(),
});

export const ApiErrorSchema = z.object({
  error_code: z.string(),
  message: z.string(),
  message_te: z.string(),
});

export const GuidanceResponseSchema = z.object({
  max_pickup_by: IsoDate,
  serve_by: IsoDate,
  guidance_en: z.string(),
  guidance_te: z.string(),
});

export const DemoAccountSchema = z.object({
  account_id: z.string(),
  role: RoleSchema,
  label: z.string(),
  area: z.string(),
});

export const DemoLoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
  org: OrgSchema.optional(),
});

export const MeResponseSchema = z.object({ user: UserSchema, org: OrgSchema.optional() });

export const NeedsSchema = z.object({
  meals_needed: z.number().int().min(0),
  veg_only: z.boolean(),
  open_from: HHMM,
  open_to: HHMM,
});

export const MapResponseSchema = z.object({
  donors: z.array(OrgSchema),
  receivers: z.array(OrgSchema),
  recent: z.array(z.record(z.string(), z.unknown())),
});

export const VoicePostResponseSchema = z.object({
  draft: z.object({
    items: z.array(ListingItemSchema),
    veg: z.boolean(),
    allergens: z.array(AllergenSchema),
    storage: StorageSchema,
    cooked_at: IsoDate,
  }),
  transcript: z.string(),
});

export const OkSchema = z.object({ ok: z.boolean() });

export const DemoLoginBody = z.object({ account_id: z.string().min(1) });

export const CreateListingBody = z.object({
  items: z.array(ListingItemSchema).min(1).max(20),
  veg: z.boolean(),
  allergens: z.array(AllergenSchema).max(8),
  storage: StorageSchema,
  cooked_at: IsoDate,
  pickup_by: IsoDate,
  posted_in_ms: z.number().int().min(0).optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingBody>;

export const ReceiverNeedsBody = z.object({
  meals_needed: z.number().int().min(0),
  veg_only: z.boolean(),
  open_from: HHMM,
  open_to: HHMM,
});

export const AvailabilityBody = z.object({ available: z.boolean() });

export const PickupBody = z.object({ code: PickupCode });

export const DeliverBody = z.object({
  code: PickupCode,
  meals_delivered: z.number().int().min(0),
});

export const ScenarioBody = z.object({ name: z.literal("wedding_night") });

export const VoicePostDraftSchema = VoicePostResponseSchema.shape.draft;

export const GuidanceQuery = z.object({
  categories: z.string().optional(),
  storage: StorageSchema.optional(),
  cooked_at: IsoDate.optional(),
});

export const ImpactQuery = z.object({
  scope: z.enum(["me", "city"]).default("me"),
  from: z.string().optional(),
  to: z.string().optional(),
});

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_FAILED");
  }
  return result.data;
}
