import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../types/api";
import { useT } from "../../i18n";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { FoodPhoto, StatusSteps } from "./FoodBits";
import { itemsTitle } from "./format";
import { SafetyCard } from "../SafetyCard";

/** Meals as the hero number of every card. */
export function MealsBadge({ meals }: { meals: number }) {
  const { t } = useT();
  return (
    <span className="flex shrink-0 flex-col items-end leading-none">
      <span className="text-2xl font-bold text-leaf-800">{meals}</span>
      <span className="text-xs font-medium text-ink/70">{t("common.meals")}</span>
    </span>
  );
}

export function DistancePill({ km }: { km: number }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-ink/80 ring-1 ring-ink/10">
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
  showSafety = true,
  children,
}: {
  listing: Listing;
  donorName: string;
  area: string;
  distanceKm?: number;
  to?: string;
  showSteps?: boolean;
  /** Compact safety card (storage, veg, countdown, allergens, guidance, disclaimer). */
  showSafety?: boolean;
  children?: ReactNode;
}) {
  const { t } = useT();
  const title = itemsTitle(listing);
  const category = listing.items[0]?.category ?? "rice_dish";
  const header = (
    <div className="flex flex-col">
      <div className="relative">
        <FoodPhoto category={category} className="h-36 w-full sm:h-40" />
        <span className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
        <span className="absolute bottom-3 right-3 flex flex-col items-end rounded-2xl bg-white/95 px-3 py-1.5 leading-none shadow-card">
          <span className="font-display text-2xl font-black text-leaf-800">
            {listing.total_meals}
          </span>
          <span className="text-xs font-bold text-ink/70">{t("common.meals")}</span>
        </span>
        {distanceKm !== undefined && (
          <span className="absolute bottom-3 left-3">
            <DistancePill km={distanceKm} />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-4 pt-3">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink">{title}</h3>
        <p className="truncate text-sm text-ink/70">
          {donorName} · {area}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="flex h-full flex-col gap-3 overflow-hidden pb-4">
      {to ? (
        <Link to={to} className="group rounded-t-2xl">
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="flex flex-col gap-3 px-4">
        {showSafety && <SafetyCard listing={listing} variant="compact" />}
        {showSteps && <StatusSteps status={listing.status} />}
        {children}
      </div>
    </Card>
  );
}
