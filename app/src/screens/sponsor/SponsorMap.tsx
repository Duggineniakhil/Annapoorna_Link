import { useCallback, useEffect, useMemo, useState } from "react";
import type { DonorType, MapData } from "../../types/api";
import { useT } from "../../i18n";
import { apiRequest } from "../../services/api";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { Screen } from "../../components/Screen";
import { Card, SectionHeader } from "../../components/ui/Card";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import { Button } from "../../components/ui/Button";
import { formatClock, formatNumber } from "../../components/food/format";
import { AreaMap } from "../../components/map/AreaMap";
import type { MapPoint } from "../../components/map/geo";
import { Icon } from "../../components/ui/Icon";
import { PHOTOS, photo } from "../../lib/media";

// Sponsor activity map (A10): donors and receivers at area level, and the newest deliveries by
// the donor's area, filtered by donor type. The server does not say which kitchen received each
// delivery, so there are no donor-to-kitchen lines.

type Filter = "all" | DonorType;
const FILTERS: ChipOption<Filter>[] = [
  { value: "all", labelKey: "common.all" },
  { value: "wedding_hall", labelKey: "donorType.wedding_hall" },
  { value: "caterer", labelKey: "donorType.caterer" },
  { value: "hostel_mess", labelKey: "donorType.hostel_mess" },
  { value: "restaurant", labelKey: "donorType.restaurant" },
];

export default function SponsorMap() {
  const { t, lang } = useT();
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(
    () =>
      apiRequest<MapData>("GET", "/api/map")
        .then((d) => {
          setData(d);
          setError(false);
        })
        .catch(() => setError(true)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  // A delivery anywhere in the city updates the list.
  useLiveRefetch(() => void load());

  const view = useMemo(() => {
    if (!data) return null;
    const donors = data.donors.filter((d) => filter === "all" || d.donor_type === filter);
    // Deliveries carry only the donor's area, so a donor-type filter keeps the areas where
    // donors of that type are.
    const areas = new Set(donors.map((d) => d.area));
    const recent = data.recent.filter(
      (d) => filter === "all" || (d.area !== undefined && areas.has(d.area)),
    );
    const points: MapPoint[] = [
      ...donors.map((o) => ({ ...o, kind: "donor" as const })),
      ...data.receivers.map((o) => ({ ...o, kind: "receiver" as const })),
    ];
    const meals = recent.reduce((sum, d) => sum + d.meals, 0);
    return { points, recent, meals };
  }, [data, filter]);

  return (
    <Screen titleKey="sponsor.map.title" demoData>
      <FilterChips
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        labelKey="sponsor.map.filterLabel"
      />
      {error && !data && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-chilli-50 p-4">
          <p className="font-medium text-chilli-700">{t("sponsor.map.error")}</p>
          <Button variant="secondary" onClick={() => void load()}>
            {t("login.retry")}
          </Button>
        </div>
      )}
      {!data && !error && (
        <p role="status" className="text-ink/70">
          {t("sponsor.map.loading")}
        </p>
      )}
      {view && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <AreaMap points={view.points} label={t("sponsor.map.label")} tall />
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-night p-5 text-white">
              <img
                src={photo(PHOTOS.charminar, 640, 360)}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-35"
              />
              <p className="relative font-display text-4xl font-black text-turmeric-400">
                {formatNumber(view.meals, lang)}
              </p>
              <p className="relative font-bold">
                {t("sponsor.map.summary", {
                  count: formatNumber(view.recent.length, lang),
                  meals: formatNumber(view.meals, lang),
                })}
              </p>
            </div>
            <Card className="flex flex-col gap-3 p-4">
              <SectionHeader titleKey="sponsor.map.recent" />
              {view.recent.length === 0 ? (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-ink/70">{t("sponsor.map.none")}</p>
                  {filter !== "all" && (
                    <Button variant="secondary" onClick={() => setFilter("all")}>
                      {t("empty.action.allTypes")}
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-ink/5">
                  {view.recent.map((d) => (
                    <li key={d.listing_id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-night">
                          <Icon name="pin" className="h-5 w-5" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-medium text-ink">
                            {d.area ?? t("sponsor.map.unknownArea")}
                          </span>
                          <span className="text-sm text-ink/70">{formatClock(d.at, lang)}</span>
                        </span>
                      </span>
                      <span className="shrink-0 font-display text-xl font-black text-leaf-800">
                        {formatNumber(d.meals, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </Screen>
  );
}
