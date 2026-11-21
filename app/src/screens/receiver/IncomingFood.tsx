import { useCallback, useEffect, useState } from "react";
import type { Listing } from "../../types/api";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { useT } from "../../i18n";
import { apiRequest } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { StatusSteps } from "../../components/food/FoodBits";
import { MealsBadge } from "../../components/food/ListingCard";
import { itemsTitle } from "../../components/food/format";
import { orgArea, orgName } from "../../mocks/fixtures";

/**
 * "On its way to you": food this kitchen has claimed, with its progress and the delivery code
 * to show the volunteer on arrival. Hidden when nothing is on the way.
 */
export function IncomingFood() {
  const { t } = useT();
  const [listings, setListings] = useState<Listing[]>([]);

  const load = useCallback(
    () =>
      apiRequest<Listing[]>("GET", "/api/listings")
        .then((data) => setListings(data))
        .catch(() => undefined), // the offers below still work; retry on the next update
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefetch(() => void load());

  if (listings.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-ink">{t("receiver.incoming.title")}</h2>
      <ul className="flex flex-col gap-3">
        {listings.map((listing) => (
          <li key={listing.id}>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <h3 className="font-bold leading-snug text-ink">{itemsTitle(listing)}</h3>
                  <p className="text-sm text-ink/70">
                    {orgName(listing.donor_org)} · {orgArea(listing.donor_org)}
                  </p>
                </div>
                <MealsBadge meals={listing.total_meals} />
              </div>
              <StatusSteps status={listing.status} />
              {listing.volunteer && (
                <p className="flex items-center gap-2 text-sm text-ink/80">
                  <Icon name="bike" className="h-4 w-4 text-leaf-700" />
                  {t("receiver.incoming.volunteer", { name: listing.volunteer })}
                </p>
              )}
              {listing.delivery_code && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-leaf-50 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-leaf-900">
                      {t("receiver.offer.deliveryCode")}
                    </span>
                    <span className="text-xs text-leaf-900/80">
                      {t("receiver.offer.deliveryCodeHint")}
                    </span>
                  </div>
                  <span
                    aria-label={listing.delivery_code.split("").join(" ")}
                    className="font-mono text-3xl font-bold tracking-[0.2em] text-leaf-800"
                  >
                    {listing.delivery_code}
                  </span>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
