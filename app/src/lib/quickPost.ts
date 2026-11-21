import type { Category, ListingItem, Storage } from "../types/api";

const PICKUP_WINDOW_MINUTES: Record<Storage, number> = {
  hot: 180,
  room: 90,
  chilled: 360,
};

const SERVE_WINDOW_MINUTES: Record<Storage, number> = {
  hot: 240,
  room: 120,
  chilled: 720,
};

const STRICT_ROOM_CATEGORIES: Category[] = ["dairy_based", "salad_cut_fruit"];

const ONE_HOUR_MINUTES = 60;
const MINUTE_MS = 60 * 1000;

type QuickPostItem = {
  category: Category;
  veg: boolean;
};

export function maxPickupBy(cookedAt: Date, storage: Storage, items: QuickPostItem[]): Date {
  let maxMinutes = PICKUP_WINDOW_MINUTES[storage];

  if (storage === "room") {
    const hasStrictItem = items.some(
      (item) => STRICT_ROOM_CATEGORIES.includes(item.category) || !item.veg,
    );

    if (hasStrictItem) {
      maxMinutes = Math.min(maxMinutes, ONE_HOUR_MINUTES);
    }
  }

  return new Date(cookedAt.getTime() + maxMinutes * MINUTE_MS);
}

export function serveByFor(cookedAt: Date, storage: Storage): Date {
  return new Date(cookedAt.getTime() + SERVE_WINDOW_MINUTES[storage] * MINUTE_MS);
}

export function isPickupAllowed(pickupBy: Date, maxPickup: Date): boolean {
  return (
    !Number.isNaN(pickupBy.getTime()) &&
    !Number.isNaN(maxPickup.getTime()) &&
    pickupBy.getTime() <= maxPickup.getTime()
  );
}

export function totalMeals(items: Pick<ListingItem, "qty_meals">[]): number {
  return items.reduce((total, item) => total + item.qty_meals, 0);
}
