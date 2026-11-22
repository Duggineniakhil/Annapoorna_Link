import { useState } from "react";
import type { DonorType } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { RunDemoButton } from "../../components/demo/RunDemoButton";
import { Screen } from "../../components/Screen";
import { Card, SectionHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import {
  BreakdownBars,
  HowWeCalculate,
  ImpactCounters,
  RateTiles,
  WeeklyChart,
} from "../../components/impact/ImpactParts";
import { pct } from "../../components/food/format";
import { chartRange, periodRange, type Period } from "../../components/impact/period";
import { useImpact } from "../../components/impact/useImpact";

// City impact (A11, GET /api/impact?scope=city): counters, on-time / time to claim / rescue
// rate, meals by donor type and by area, meals per week and how every number is calculated.

const PERIODS: ChipOption<Period>[] = [
  { value: "week", labelKey: "impact.period.week" },
  { value: "month", labelKey: "impact.period.month" },
];
const DONOR_TYPES: DonorType[] = ["caterer", "wedding_hall", "hostel_mess", "restaurant"];
const CHART_WEEKS = 8;

export default function SponsorDashboard() {
  const { t } = useT();
  const [period, setPeriod] = useState<Period>("month");
  const { data, error, reload } = useImpact("city", periodRange(period).from.getTime());
  const chart = useImpact("city", chartRange(CHART_WEEKS).from.getTime());

  const typeLabel = (key: string) =>
    DONOR_TYPES.includes(key as DonorType) ? t(`donorType.${key}` as MessageKey) : key;

  return (
    <Screen
      titleKey="sponsor.dashboard.title"
      eyebrow={
        <span className="text-sm font-medium text-ink/70">{t("sponsor.dashboard.city")}</span>
      }
      demoData
    >
      <FilterChips
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        labelKey="impact.period.label"
      />
      {error && !data && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-chilli-50 p-4">
          <p className="font-medium text-chilli-700">{t("impact.error")}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            {t("login.retry")}
          </Button>
        </div>
      )}
      {!data && !error && (
        <p role="status" className="text-ink/70">
          {t("impact.loading")}
        </p>
      )}
      {data && (
        <>
          <ImpactCounters impact={data} />
          <RateTiles
            items={[
              { value: pct(data.on_time_rate), label: t("impact.onTime") },
              { value: t("time.m", { m: data.median_claim_min }), label: t("impact.medianClaim") },
              { value: pct(data.rescue_rate), label: t("impact.rescueRate") },
            ]}
          />
          {data.by_donor_type && data.by_donor_type.length > 0 && (
            <>
              <SectionHeader titleKey="sponsor.dashboard.byType" />
              <BreakdownBars rows={data.by_donor_type} labelOf={typeLabel} />
            </>
          )}
          {data.by_area && data.by_area.length > 0 && (
            <>
              <SectionHeader titleKey="impact.byArea" />
              <BreakdownBars rows={data.by_area} labelOf={(key) => key} />
            </>
          )}
        </>
      )}
      {chart.data?.weekly && (
        <Card className="p-4">
          <WeeklyChart weeks={chart.data.weekly} />
        </Card>
      )}
      {data && <HowWeCalculate impact={data} city />}
      <RunDemoButton />
    </Screen>
  );
}
