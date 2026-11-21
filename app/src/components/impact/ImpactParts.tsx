import type { ImpactAssumption, ImpactReport, ImpactWeek } from "../../types/api";
import { useT } from "../../i18n";
import { Card } from "../ui/Card";
import { formatNumber } from "../food/format";

// Shared pieces of the donor and city impact views and the printable report.

/** The three big counters: meals, kg, CO₂e. */
export function ImpactCounters({ impact }: { impact: ImpactReport }) {
  const { t, lang } = useT();
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-leaf-800 p-5 text-cream print:rounded-xl print:border print:border-ink/20 print:bg-white print:text-ink">
      <span className="text-sm font-medium text-cream/80 print:text-ink/70">
        {t("impact.meals")}
      </span>
      <span className="text-5xl font-bold leading-none text-turmeric-300 print:text-leaf-800">
        {formatNumber(impact.meals, lang)}
      </span>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-cream/15 pt-3 print:border-ink/15">
        <div>
          <p className="text-2xl font-bold">{formatNumber(impact.kg, lang)}</p>
          <p className="text-xs text-cream/75 print:text-ink/70">{t("impact.kg")}</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{formatNumber(impact.co2e_kg, lang)}</p>
          <p className="text-xs text-cream/75 print:text-ink/70">{t("impact.co2")}</p>
        </div>
      </div>
    </div>
  );
}

/** Small stat cards (on-time rate, time to claim, rescue rate). */
export function RateTiles({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className={`grid gap-2 ${items.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
      {items.map((stat) => (
        <Card key={stat.label} className="flex flex-col gap-0.5 p-3">
          <span className="text-xl font-bold text-leaf-800">{stat.value}</span>
          <span className="text-xs leading-tight text-ink/60">{stat.label}</span>
        </Card>
      ))}
    </div>
  );
}

/** Lightweight SVG bar chart of meals per week (no chart library). */
export function WeeklyChart({ weeks }: { weeks: ImpactWeek[] }) {
  const { t, lang } = useT();
  const max = Math.max(1, ...weeks.map((w) => w.meals));
  const width = 320;
  const height = 150;
  const top = 18;
  const bottom = 22;
  const gap = 8;
  const barWidth = (width - gap * (weeks.length - 1)) / Math.max(1, weeks.length);
  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", {
      day: "numeric",
      month: "short",
    });
  const summary = weeks
    .map((w) => `${dateLabel(w.week_start)}: ${formatNumber(w.meals, lang)}`)
    .join(", ");

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-bold text-ink">{t("impact.weekly")}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${t("impact.weekly")}. ${summary}`}
        className="h-auto w-full"
      >
        {weeks.map((w, i) => {
          const h = Math.round(((height - top - bottom) * w.meals) / max);
          const x = i * (barWidth + gap);
          const y = height - bottom - h;
          return (
            <g key={w.week_start}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, w.meals > 0 ? 2 : 0)}
                rx={4}
                className={i === weeks.length - 1 ? "fill-turmeric-400" : "fill-leaf-600"}
              />
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-ink text-[10px] font-bold"
              >
                {formatNumber(w.meals, lang)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-ink/60 text-[9px]"
              >
                {dateLabel(w.week_start)}
              </text>
            </g>
          );
        })}
        <line
          x1={0}
          x2={width}
          y1={height - bottom}
          y2={height - bottom}
          className="stroke-ink/15"
        />
      </svg>
    </figure>
  );
}

function AssumptionRow({ a }: { a: ImpactAssumption }) {
  const { t, lang } = useT();
  return (
    <li className="flex flex-col gap-0.5 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink">{lang === "te" ? a.label_te : a.label_en}</span>
        <span className="font-bold text-leaf-800">{formatNumber(a.value, lang)}</span>
      </div>
      {a.source ? (
        <span className="text-xs text-ink/70">{t("impact.tag.source", { source: a.source })}</span>
      ) : (
        <span className="w-fit rounded-full bg-turmeric-100 px-2 py-0.5 text-xs font-medium text-turmeric-800">
          {t("impact.tag.assumption")}
        </span>
      )}
    </li>
  );
}

/** "How we calculate this": every formula, every assumption with its value and source. */
export function HowWeCalculate({
  impact,
  city = false,
  open = false,
}: {
  impact: ImpactReport;
  city?: boolean;
  /** The printed report shows it expanded. */
  open?: boolean;
}) {
  const { t } = useT();
  const kg = impact.assumptions.find((a) => a.key === "kg_per_meal")?.value;
  const factor = impact.assumptions.find((a) => a.key === "co2e_per_kg")?.value;
  const body = (
    <div className="flex flex-col gap-3 pt-2 text-sm">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-ink/80">
        <li>{t("impact.how.meals")}</li>
        <li>{t("impact.how.kg", { kg: kg ?? "" })}</li>
        <li>{t("impact.how.co2", { factor: factor ?? "" })}</li>
        <li>{t("impact.how.onTime")}</li>
        {city && <li>{t("impact.how.claim")}</li>}
        {city && <li>{t("impact.how.rescue")}</li>}
      </ul>
      <ul className="flex flex-col divide-y divide-ink/5">
        {impact.assumptions.map((a) => (
          <AssumptionRow key={a.key} a={a} />
        ))}
      </ul>
      <p className="rounded-xl bg-cream p-3 font-medium text-ink print:border print:border-ink/15 print:bg-white">
        {t("impact.how.note")}
      </p>
    </div>
  );

  if (open) {
    return (
      <section className="flex flex-col">
        <h2 className="font-bold text-ink">{t("impact.how")}</h2>
        {body}
      </section>
    );
  }
  return (
    <Card className="p-4">
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-bold text-leaf-700">
          {t("impact.how")}
        </summary>
        {body}
      </details>
    </Card>
  );
}

/** Horizontal bars for a breakdown (by donor type or by area). */
export function BreakdownBars({
  rows,
  labelOf,
}: {
  rows: { key: string; meals: number }[];
  labelOf: (key: string) => string;
}) {
  const { lang } = useT();
  const max = Math.max(1, ...rows.map((row) => row.meals));
  return (
    <Card className="flex flex-col gap-3 p-4">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-ink">{labelOf(row.key)}</span>
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
  );
}
