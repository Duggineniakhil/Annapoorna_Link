import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../types/api";
import { useT } from "../../i18n";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import {
  AllergenLine,
  CategoryTile,
  Countdown,
  StatusSteps,
  StorageTag,
  VegMark,
} from "./FoodBits";
import { itemsTitle } from "./format";

/** Meals as the hero number of every card. */
export function MealsBadge({ meals }: { meals: number }) {
  const { t } = useT();
  return (
    <span className="flex shrink-0 flex-col items-end leading-none">
      <span className="text-2xl font-bold text-leaf-800">{meals}</span>
      <span className="text-xs font-medium text-ink/60">{t("common.meals")}</span>
    </span>
  );
}

export function DistancePill({ km }: { km: number }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-xs font-bold text-ink/80 ring-1 ring-ink/10">
      <Icon name="pin" className="h-3.5 w-3.5" />
      {t("common.km", { km: km.toFixed(1) })}
    </span>
  );
}

/**
 * Shared food card: category tile, items, meals, veg mark, storage, donor + area, distance,
 * live pickup countdown, and either progress steps (donor) or actions (receiver/volunteer).
 */
export function ListingCard({
  listing,
  donorName,
  area,
  distanceKm,
  to,
  showSteps = false,
  showCountdown = true,
  children,
}: {
  listing: Listing;
  donorName: string;
  area: string;
  distanceKm?: number;
  to?: string;
  showSteps?: boolean;
  showCountdown?: boolean;
  children?: ReactNode;
}) {
  const title = itemsTitle(listing);
  const header = (
    <div className="flex gap-3">
      <CategoryTile category={listing.items[0]?.category ?? "rice_dish"} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-bold leading-snug text-ink">{title}</h3>
          <MealsBadge meals={listing.total_meals} />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/70">
          <span className="truncate">
            {donorName} · {area}
          </span>
          {distanceKm !== undefined && <DistancePill km={distanceKm} />}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      {to ? (
        <Link to={to} className="-m-1 rounded-xl p-1">
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <VegMark veg={listing.veg} withLabel />
        <StorageTag storage={listing.storage} />
      </div>
      <AllergenLine allergens={listing.allergens} />
      {showCountdown && (
        <div>
          <Countdown deadline={listing.pickup_by} />
        </div>
      )}
      {showSteps && <StatusSteps status={listing.status} />}
      {children}
    </Card>
  );
}
