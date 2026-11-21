import { useState } from "react";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import { LocationHeader } from "../../components/ui/LocationHeader";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ListingCard } from "../../components/food/ListingCard";
import { Countdown } from "../../components/food/FoodBits";
import { OFFERS, orgArea, orgName } from "../../mocks/fixtures";

type Filter = "all" | "veg" | "soon";
const FILTERS: ChipOption<Filter>[] = [
  { value: "all", labelKey: "common.all" },
  { value: "veg", labelKey: "receiver.filter.veg" },
  { value: "soon", labelKey: "receiver.filter.soon" },
];

export default function ReceiverOffers() {
  const { t, lang } = useT();
  const { org } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  // Offers come from fixtures until the offers API lands (A5). A veg-only kitchen is never
  // offered non-veg food, matching the server's eligibility rule.
  const mine = OFFERS.filter((offer) => !org?.veg_only || offer.listing.veg);
  // Captured once per render pass; the countdown chips refresh themselves.
  const [loadedAt] = useState(() => Date.now());

  const offers = mine.filter((offer) => {
    if (filter === "veg") return offer.listing.veg;
    if (filter === "soon")
      return new Date(offer.listing.pickup_by).getTime() - loadedAt < 60 * 60_000;
    return true;
  });

  return (
    <Screen
      titleKey="receiver.offers.title"
      eyebrow={org ? <LocationHeader area={org.area} radiusKm={8} /> : undefined}
      demoData
    >
      <FilterChips
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        labelKey="receiver.offers.filterLabel"
      />
      {mine.length === 0 ? (
        <EmptyState icon="🍲" message={t("receiver.offers.empty")} />
      ) : offers.length === 0 ? (
        <EmptyState icon="🔍" message={t("receiver.offers.noMatch")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {offers.map((offer) => (
            <li key={offer.id}>
              <ListingCard
                listing={offer.listing}
                donorName={orgName(offer.listing.donor_org)}
                area={orgArea(offer.listing.donor_org)}
                distanceKm={offer.distance_km}
                to={`/receiver/offers/${offer.id}`}
              >
                <ul className="flex flex-col gap-1 rounded-xl bg-leaf-50 p-3">
                  {offer.reasons.map((reason) => (
                    <li key={reason.en} className="flex gap-2 text-sm text-leaf-900">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" />
                      {lang === "te" ? reason.te : reason.en}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Countdown deadline={offer.expires_at} kind="respond" />
                  <span className="text-sm text-ink/60">
                    {t("offer.eta", { min: offer.eta_min })}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <ButtonLink to={`/receiver/offers/${offer.id}`} size="lg" block>
                    {t("offer.accept")}
                  </ButtonLink>
                  <ButtonLink to={`/receiver/offers/${offer.id}`} variant="secondary" size="lg">
                    {t("offer.details")}
                  </ButtonLink>
                </div>
              </ListingCard>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
