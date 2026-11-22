import { useState } from "react";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import {
  HowWeCalculate,
  ImpactCounters,
  RateTiles,
  WeeklyChart,
} from "../../components/impact/ImpactParts";
import { pct } from "../../components/food/format";
import { chartRange, monthKey, periodRange, type Period } from "../../components/impact/period";
import { useImpact } from "../../components/impact/useImpact";

// Donor impact (A11, GET /api/impact?scope=me): counters for this week or this month, meals per
// week for the last 8 weeks, the on-time rate, how every number is calculated, and a link to the
// printable monthly report.

const PERIODS: ChipOption<Period>[] = [
  { value: "week", labelKey: "impact.period.week" },
  { value: "month", labelKey: "impact.period.month" },
];
const CHART_WEEKS = 8;

export default function DonorImpact() {
  const { t } = useT();
  const [period, setPeriod] = useState<Period>("month");
  const range = periodRange(period);
  const { data, error, reload } = useImpact("me", range.from.getTime());
  const chart = useImpact("me", chartRange(CHART_WEEKS).from.getTime());

  return (
    <Screen titleKey="donor.impact.title" demoData>
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
          <RateTiles items={[{ value: pct(data.on_time_rate), label: t("impact.onTime") }]} />
        </>
      )}
      {chart.data && (
        <Card className="p-4">
          <WeeklyChart weeks={chart.data.weekly} />
        </Card>
      )}
      {data && <HowWeCalculate impact={data} />}
      <ButtonLink
        to={`/donor/impact/report?month=${monthKey(new Date())}`}
        variant="secondary"
        size="lg"
        block
      >
        {t("impact.report.link")}
      </ButtonLink>
    </Screen>
  );
}
