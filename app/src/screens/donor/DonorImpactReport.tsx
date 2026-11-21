import { useSearchParams } from "react-router-dom";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/ui/Button";
import {
  HowWeCalculate,
  ImpactCounters,
  RateTiles,
  WeeklyChart,
} from "../../components/impact/ImpactParts";
import { pct } from "../../components/food/format";
import { monthKey, monthRange } from "../../components/impact/period";
import { useImpact } from "../../components/impact/useImpact";

// Printable monthly report (A11): /donor/impact/report?month=YYYY-MM. Counters, the weekly
// chart, the assumptions and a footer, laid out to fit one A4 page with window.print().

export default function DonorImpactReport() {
  const { t, lang } = useT();
  const { org } = useAuth();
  const [params, setParams] = useSearchParams();
  const month = params.get("month") ?? monthKey(new Date());
  const range = monthRange(month);
  const locale = lang === "te" ? "te-IN" : "en-IN";

  // Hooks run every render; a bad month asks for the current month instead and is not shown.
  const fallback = monthRange(monthKey(new Date()))!;
  const { data, error, reload } = useImpact(
    "me",
    (range ?? fallback).from.getTime(),
    (range ?? fallback).to.getTime(),
  );

  const monthLabel = range
    ? range.from.toLocaleDateString(locale, { month: "long", year: "numeric" })
    : "";
  const day = (d: Date) => d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  // The range ends at the 1st of the next month (exclusive): show the last day included.
  const lastDay = range ? new Date(range.to.getTime() - 1) : undefined;

  return (
    <Screen titleKey="impact.report.title" demoData>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-ink">{org?.name}</p>
        {range && lastDay && (
          <p className="text-ink/70">
            {monthLabel} · {t("impact.report.period", { from: day(range.from), to: day(lastDay) })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink/70">{t("impact.report.month")}</span>
          <input
            type="month"
            value={month}
            max={monthKey(new Date())}
            onChange={(e) => e.target.value && setParams({ month: e.target.value })}
            className="min-h-11 rounded-xl border-2 border-ink/20 px-3 text-ink focus:border-leaf-800 focus:outline-none"
          />
        </label>
        <Button onClick={() => window.print()} disabled={!data || !range}>
          {t("impact.report.print")}
        </Button>
      </div>

      {!range && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {t("impact.report.badMonth")}
        </p>
      )}
      {range && error && !data && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-chilli-50 p-4">
          <p className="font-medium text-chilli-700">{t("impact.error")}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            {t("login.retry")}
          </Button>
        </div>
      )}
      {range && !data && !error && (
        <p role="status" className="text-ink/60">
          {t("impact.loading")}
        </p>
      )}
      {range && data && (
        <div className="flex flex-col gap-4 print:gap-2">
          <ImpactCounters impact={data} />
          <RateTiles items={[{ value: pct(data.on_time_rate), label: t("impact.onTime") }]} />
          <div className="print:mx-auto print:w-3/5">
            <WeeklyChart weeks={data.weekly} />
          </div>
          <HowWeCalculate impact={data} open />
          <p className="border-t border-ink/15 pt-3 text-sm text-ink/70">
            {t("impact.report.footer")}
          </p>
        </div>
      )}
    </Screen>
  );
}
