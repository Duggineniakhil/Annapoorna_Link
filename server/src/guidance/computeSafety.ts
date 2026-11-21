import { AppError } from "../errors.js";
import type { Category, Storage } from "../schemas.js";

export interface GuidanceRule {
  food_category: Category;
  storage: Storage;
  max_window_minutes: number;
  serve_within_minutes: number;
  guidance_en: string;
  guidance_te: string;
}

export interface ComputeSafetyInput {
  categories: Category[];
  storage: Storage;
  cooked_at: Date;
  veg: boolean;
  rules: GuidanceRule[];
  now?: Date;
}

export interface SafetyResult {
  max_pickup_by: string;
  serve_by: string;
  guidance_en: string;
  guidance_te: string;
}

// docs/10-food-handling-guidance.md section 2: non-veg food at room temperature gets 1 h.
const NON_VEG_ROOM_MAX_MIN = 60;
const MIN_MS = 60_000;

// The strictest item wins (shortest window). A future cooked_at is rejected.
export function computeSafety(input: ComputeSafetyInput): SafetyResult {
  const { categories, storage, cooked_at, veg, rules } = input;
  const now = input.now ?? new Date();
  if (categories.length === 0 || Number.isNaN(cooked_at.getTime()) || cooked_at.getTime() > now.getTime()) {
    throw new AppError("VALIDATION_FAILED");
  }

  let strictest: GuidanceRule | undefined;
  let maxWindow = Infinity;
  let serveWithin = Infinity;
  for (const category of categories) {
    const rule = rules.find((r) => r.food_category === category && r.storage === storage);
    if (!rule) throw new AppError("INTERNAL_ERROR");
    serveWithin = Math.min(serveWithin, rule.serve_within_minutes);
    if (rule.max_window_minutes < maxWindow) {
      maxWindow = rule.max_window_minutes;
      strictest = rule;
    }
  }
  if (!veg && storage === "room") maxWindow = Math.min(maxWindow, NON_VEG_ROOM_MAX_MIN);
  if (!strictest) throw new AppError("INTERNAL_ERROR");

  return {
    max_pickup_by: new Date(cooked_at.getTime() + maxWindow * MIN_MS).toISOString(),
    serve_by: new Date(cooked_at.getTime() + serveWithin * MIN_MS).toISOString(),
    guidance_en: strictest.guidance_en,
    guidance_te: strictest.guidance_te,
  };
}
