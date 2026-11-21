import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Listing, Status } from "../../types/api";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { SectionHeader, StatTile } from "../../components/ui/Card";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { ListingCard } from "../../components/food/ListingCard";
import { formatNumber } from "../../components/food/format";
import { DONOR_IMPACT_MONTH, orgName } from "../../mocks/fixtures";

const ACTIVE_STATUSES: Status[] = [
  "posted",
  "offered",
  "claimed",
  "volunteer_assigned",
  "picked_up",
];
const PAST_STATUSES: Status[] = ["delivered", "expired", "cancelled"];

type Tab = "active" | "past";
const TAB_OPTIONS: ChipOption<Tab>[] = [
  { value: "active", labelKey: "donor.home.tabActive" },
  { value: "past", labelKey: "donor.home.tabPast" },
];

export default function DonorHome() {
  const { t, lang } = useT();
  const { user, org } = useAuth();
  const name = org?.name ?? user?.display_name ?? "";
  const area = org?.area ?? "";
  const [tab, setTab] = useState<Tab>("active");
  // All listings come from the API (the mock server seeds demo listings in every status).
  const [posted, setPosted] = useState<Listing[]>([]);
  const load = useCallback(
    () =>
      apiRequest<Listing[]>("GET", "/api/listings")
        .then((data) => {
          setPosted(data);
        })
        .catch(() => {
          setPosted([]);
        }),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefetch(() => void load());
  const mine = posted.filter((l) => l.donor_org === org?.id);
  const active = mine.filter((l) => ACTIVE_STATUSES.includes(l.status));
  const past = mine.filter((l) => PAST_STATUSES.includes(l.status));
  const shown = tab === "active" ? active : past;

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

      <FilterChips
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        labelKey="donor.home.tabsLabel"
      />

      <SectionHeader titleKey={tab === "active" ? "donor.home.active" : "donor.home.past"} />
      {shown.length === 0 ? (
        <EmptyState
          icon="🍽️"
          message={t(tab === "active" ? "donor.home.empty" : "donor.home.emptyPast")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((listing) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                donorName={name}
                area={area}
                to={`/donor/listings/${listing.id}`}
                showSteps={tab === "active"}
              >
                <div className="flex flex-col gap-1">
                  {tab === "past" && (
                    <div>
                      <StatusBadge status={listing.status} />
                    </div>
                  )}
                  {listing.matched_receiver ? (
                    <p className="flex items-center gap-1 text-sm text-ink/70">
                      <Icon name="arrowRight" className="h-4 w-4 text-leaf-700" />
                      {listing.matched_receiver.name} · {listing.matched_receiver.area}
                      {listing.volunteer && ` · ${listing.volunteer}`}
                    </p>
                  ) : (
                    listing.receiver_org && (
                      <p className="flex items-center gap-1 text-sm text-ink/70">
                        <Icon name="arrowRight" className="h-4 w-4 text-leaf-700" />
                        {t("donor.home.goingTo", { name: orgName(listing.receiver_org) })}
                        {listing.volunteer && ` · ${listing.volunteer}`}
                      </p>
                    )
                  )}
                </div>
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
