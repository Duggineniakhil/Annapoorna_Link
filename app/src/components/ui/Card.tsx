import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/en";
import { Icon } from "./Icon";

const CARD = "rounded-2xl bg-white shadow-card ring-1 ring-ink/5";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${CARD} ${className}`}>{children}</div>;
}

/** Section title with an optional "All ›" link (pattern from Olio's rails). */
export function SectionHeader({ titleKey, allTo }: { titleKey: MessageKey; allTo?: string }) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-xl font-black tracking-tight text-ink">{t(titleKey)}</h2>
      {allTo && (
        <Link
          to={allTo}
          className="flex min-h-12 items-center gap-1 px-2 text-sm font-bold text-leaf-700"
        >
          {t("common.all")}
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Big number + label, used for impact (pattern from Too Good To Go's counters). */
export function StatTile({
  value,
  label,
  tone = "leaf",
}: {
  value: string;
  label: string;
  tone?: "leaf" | "turmeric" | "white";
}) {
  const tones = {
    leaf: "bg-leaf-50 text-leaf-900",
    turmeric: "bg-turmeric-100 text-turmeric-800",
    white: `${CARD} text-ink`,
  };
  return (
    <div className={`flex flex-col gap-0.5 rounded-2xl p-4 ${tones[tone]}`}>
      <span className="font-display text-3xl font-black leading-tight">{value}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}
