import { Link } from "react-router-dom";
import type { DonorType } from "../../types/api";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { Card, SectionHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { formatNumber } from "../../components/food/format";
import { CITY_IMPACT_MONTH } from "../../mocks/fixtures";

// Demo split by donor type (fictional); comes from /api/impact in task A11.
const BY_TYPE: { type: DonorType; meals: number }[] = [
  { type: "wedding_hall", meals: 4860 },
  { type: "caterer", meals: 4120 },
  { type: "hostel_mess", meals: 2140 },
  { type: "restaurant", meals: 1360 },
];

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

export default function SponsorDashboard() {
  const { t, lang } = useT();
  const impact = CITY_IMPACT_MONTH;
  const max = Math.max(...BY_TYPE.map((row) => row.meals));

  return (
    <Screen
      titleKey="sponsor.dashboard.title"
      eyebrow={
        <span className="text-sm font-medium text-ink/60">{t("sponsor.dashboard.sub")}</span>
      }
      demoData
    >
      <div className="flex flex-col gap-1 rounded-3xl bg-leaf-800 p-5 text-cream">
        <span className="text-sm font-medium text-cream/80">{t("impact.meals")}</span>
        <span className="text-5xl font-bold leading-none text-turmeric-300">
          {formatNumber(impact.meals, lang)}
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-cream/15 pt-3">
          <div>
            <p className="text-2xl font-bold">{formatNumber(impact.kg, lang)}</p>
            <p className="text-xs text-cream/75">{t("impact.kg")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatNumber(impact.co2e_kg, lang)}</p>
            <p className="text-xs text-cream/75">{t("impact.co2")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: pct(impact.on_time_rate), label: t("impact.onTime") },
          { value: t("time.m", { m: impact.median_claim_min }), label: t("impact.medianClaim") },
          { value: pct(impact.rescue_rate), label: t("impact.rescueRate") },
        ].map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-0.5 p-3">
            <span className="text-xl font-bold text-leaf-800">{stat.value}</span>
            <span className="text-xs leading-tight text-ink/60">{stat.label}</span>
          </Card>
        ))}
      </div>

      <SectionHeader titleKey="sponsor.dashboard.byType" />
      <Card className="flex flex-col gap-3 p-4">
        {BY_TYPE.map((row) => (
          <div key={row.type} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-ink">{t(`donorType.${row.type}`)}</span>
              <span className="font-bold text-leaf-800">{formatNumber(row.meals, lang)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-leaf-50">
              <div
                className="h-full rounded-full bg-leaf-600"
                style={{ width: `${(row.meals / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </Card>

      <Link to="/about" className="flex min-h-[48px] items-center gap-2 font-bold text-leaf-700">
        <Icon name="info" className="h-5 w-5" />
        {t("impact.how")}
        <Icon name="chevronRight" className="h-4 w-4" />
      </Link>
    </Screen>
  );
}
