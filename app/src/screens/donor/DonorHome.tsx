import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../types/api";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader, StatTile } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { ListingCard } from "../../components/food/ListingCard";
import { formatNumber } from "../../components/food/format";
import { DONOR_IMPACT_MONTH, LISTINGS, orgName } from "../../mocks/fixtures";

export default function DonorHome() {
  const { t, lang } = useT();
  const { user, org } = useAuth();
  const name = org?.name ?? user?.display_name ?? "";
  const area = org?.area ?? "";
  // New posts come from the API; the seeded demo listings come from fixtures until A5.
  const [posted, setPosted] = useState<Listing[]>([]);
  useEffect(() => {
    apiRequest<Listing[]>("GET", "/api/listings")
      .then(setPosted)
      .catch(() => setPosted([]));
  }, []);
  const active = [...posted, ...LISTINGS].filter(
    (l) => l.donor_org === org?.id && l.status !== "delivered" && l.status !== "cancelled",
  );

  return (
    <Screen
      titleKey="donor.home.title"
      title={t("home.hello", { name })}
      eyebrow={
        <span className="flex items-center gap-1 text-sm font-medium text-ink/60">
          <Icon name="pin" className="h-4 w-4" />
          {area}
        </span>
      }
      demoData
    >
      <Link
        to="/donor/post"
        className="flex items-center gap-4 rounded-3xl bg-turmeric-400 p-5 text-ink shadow-card transition hover:bg-turmeric-300"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-turmeric-300">
          <Icon name="plus" className="h-8 w-8" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-xl font-bold leading-tight">{t("donor.home.postButton")}</span>
          <span className="text-sm leading-snug text-ink/75">{t("donor.home.postHint")}</span>
        </span>
      </Link>

      <SectionHeader titleKey="donor.home.active" />
      {active.length === 0 ? (
        <EmptyState icon="🍽️" message={t("donor.home.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {active.map((listing) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                donorName={name}
                area={area}
                to={`/donor/listings/${listing.id}`}
                showSteps
              >
                {listing.receiver_org && (
                  <p className="flex items-center gap-1 text-sm text-ink/70">
                    <Icon name="arrowRight" className="h-4 w-4 text-leaf-700" />
                    {t("donor.home.goingTo", { name: orgName(listing.receiver_org) })}
                    {listing.volunteer && ` · ${listing.volunteer}`}
                  </p>
                )}
              </ListingCard>
            </li>
          ))}
        </ul>
      )}

      <SectionHeader titleKey="donor.home.thisMonth" allTo="/donor/impact" />
      <div className="grid grid-cols-3 gap-2">
        <StatTile value={formatNumber(DONOR_IMPACT_MONTH.meals, lang)} label={t("impact.meals")} />
        <StatTile
          value={formatNumber(DONOR_IMPACT_MONTH.kg, lang)}
          label={t("impact.kg")}
          tone="turmeric"
        />
        <StatTile
          value={formatNumber(DONOR_IMPACT_MONTH.co2e_kg, lang)}
          label={t("impact.co2")}
          tone="white"
        />
      </div>
    </Screen>
  );
}
