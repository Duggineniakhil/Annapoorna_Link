import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useImpact, useRunScenario } from "../api/hooks";
import type { Impact } from "../api/types";
import { useT, type TKey } from "../lib/i18n";
import { ErrorNote, Loading, StatTile } from "../ui/bits";
import { PageHead } from "../ui/Shell";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const num = (x: number) => Math.round(x).toLocaleString("en-IN");

export function DonorImpact() {
  const { t } = useT();
  const q = useImpact("me");
  return (
    <>
      <PageHead title={t("thisMonth")} />
      {q.isLoading && <Loading />}
      <ErrorNote error={q.error} onRetry={() => void q.refetch()} />
      {q.data && <ImpactView data={q.data} />}
    </>
  );
}

export function CityImpact() {
  const { t } = useT();
  const q = useImpact("city");
  const demo = useRunScenario();
  return (
    <>
      <PageHead
        title={t("cityTitle")}
        action={
          <button className="btn-primary" onClick={() => demo.mutate()} disabled={demo.isPending || demo.isSuccess}>
            <Sparkles className="h-5 w-5" aria-hidden="true" /> {demo.isSuccess ? t("demoStarted") : t("runDemo")}
          </button>
        }
      />
      <ErrorNote error={demo.error} />
      {q.isLoading && <Loading />}
      <ErrorNote error={q.error} onRetry={() => void q.refetch()} />
      {q.data && <ImpactView data={q.data} />}
    </>
  );
}

// Bento: the meals number leads, the rest supports it, breakdowns and the method sit underneath.
function ImpactView({ data }: { data: Impact }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
      <div className="tile-hero flex flex-col justify-between gap-8 lg:col-span-6 lg:row-span-2 lg:p-10">
        <p className="text-lead text-white/85">{t("mealsSaved")}</p>
        <p className="font-display text-[4.5rem] font-bold leading-none lg:text-[6rem]">{num(data.meals)}</p>
        <p className="text-small text-white/75">{t("countRule")}</p>
      </div>
      <StatTile className="lg:col-span-3" value={num(data.kg)} label={t("kgSaved")} tone="leaf" />
      <StatTile className="lg:col-span-3" value={num(data.co2e_kg)} label={t("co2")} tone="indigo" />
      <StatTile className="lg:col-span-2" value={pct(data.on_time_rate)} label={t("onTime")} />
      <StatTile className="lg:col-span-2" value={pct(data.rescue_rate)} label={t("rescue")} />
      <StatTile className="lg:col-span-2" value={data.median_claim_min} label={t("claimMin")} tone="marigold" />

      {data.by_area && <Bars className="lg:col-span-7" title={t("byArea")} rows={data.by_area.map((r) => ({ label: r.area, value: r.meals }))} />}
      {data.by_donor_type && (
        <Bars
          className="lg:col-span-5"
          title={t("byDonor")}
          rows={data.by_donor_type.map((r) => ({ label: t(r.donor_type as TKey), value: r.meals }))}
        />
      )}

      <section className="tile lg:col-span-12">
        <button className="flex min-h-12 w-full items-center justify-between text-left font-display text-title font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>
          {t("howCalc")}
          <span aria-hidden="true" className="text-muted">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {data.assumptions.map((a) => (
              <li key={a.key} className="rounded-chip bg-sunken p-4">
                <p className="font-display text-title font-bold">{a.value}</p>
                <p className="mt-1">{lang === "te" ? a.label_te : a.label_en}</p>
                {a.source && <p className="mt-2 text-caption text-muted">{a.source}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Bars({ title, rows, className = "" }: { title: string; rows: { label: string; value: number }[]; className?: string }) {
  const { t } = useT();
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 8);
  const max = Math.max(1, ...sorted.map((r) => r.value));
  return (
    <section className={`tile ${className}`}>
      <h2 className="font-display text-title font-semibold">{title}</h2>
      <ul className="mt-5 flex flex-col gap-3">
        {sorted.map((r) => (
          <li key={r.label} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-small sm:grid-cols-[10rem_1fr_auto]">
            <span className="truncate">{r.label}</span>
            <span className="h-3 rounded-full bg-sunken">
              <span className="block h-3 rounded-full bg-indigo" style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <span className="font-semibold tabular-nums">
              {num(r.value)} <span className="font-normal text-muted">{t("meals")}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
