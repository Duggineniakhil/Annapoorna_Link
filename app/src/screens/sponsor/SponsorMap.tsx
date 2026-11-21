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
import type { MapLine, MapPoint } from "../../components/map/geo";
import { orgArea } from "../../mocks/fixtures";

// Sponsor activity map (A10): donors and receivers at area level, deliveries from the last 24 h
// as lines, filtered by donor type.

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
  // A delivery anywhere in the city adds a line.
  useLiveRefetch(() => void load());

  const view = useMemo(() => {
    if (!data) return null;
    const donors = data.donors.filter((d) => filter === "all" || d.donor_type === filter);
    const donorIds = new Set(donors.map((d) => d.id));
    const byId = new Map([...data.donors, ...data.receivers].map((o) => [o.id, o]));
    const recent = data.recent.filter((d) => donorIds.has(d.donor_org));
    const points: MapPoint[] = [
      ...donors.map((o) => ({ ...o, kind: "donor" as const })),
      ...data.receivers.map((o) => ({ ...o, kind: "receiver" as const })),
    ];
    const lines: MapLine[] = recent.flatMap((d) => {
      const from = byId.get(d.donor_org);
      const to = byId.get(d.receiver_org);
      return from && to ? [{ from, to }] : [];
    });
    const meals = recent.reduce((sum, d) => sum + d.meals, 0);
    return { points, lines, recent, meals, byId };
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
        <p role="status" className="text-ink/60">
          {t("sponsor.map.loading")}
        </p>
      )}
      {view && (
        <>
          <AreaMap points={view.points} lines={view.lines} label={t("sponsor.map.label")} tall />
          <p className="font-bold text-leaf-800">
            {t("sponsor.map.summary", {
              count: formatNumber(view.recent.length, lang),
              meals: formatNumber(view.meals, lang),
            })}
          </p>
          <Card className="flex flex-col gap-3 p-4">
            <SectionHeader titleKey="sponsor.map.recent" />
            {view.recent.length === 0 ? (
              <p className="text-ink/60">{t("sponsor.map.none")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-ink/5">
                {view.recent.map((d) => (
                  <li key={d.listing_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex flex-col">
                      <span className="font-medium text-ink">
                        {t("sponsor.map.route", {
                          from: orgArea(d.donor_org) || view.byId.get(d.donor_org)?.area || "",
                          to: orgArea(d.receiver_org) || view.byId.get(d.receiver_org)?.area || "",
                        })}
                      </span>
                      <span className="text-sm text-ink/60">
                        {view.byId.get(d.donor_org)?.name} · {formatClock(d.delivered_at, lang)}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold text-leaf-800">
                      {formatNumber(d.meals, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
