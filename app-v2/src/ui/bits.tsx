import { type ReactNode, useState } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { ApiError } from "../api/client";
import type { Category, Status } from "../api/types";
import { useT, type TKey } from "../lib/i18n";

// Indian food-packet marks: green square with a dot for veg, brown square with a triangle for non-veg.
export function VegMark({ veg, withLabel = false }: { veg: boolean; withLabel?: boolean }) {
  const { t } = useT();
  const colour = veg ? "rgb(var(--leaf))" : "rgb(var(--nonveg))";
  return (
    <span className="inline-flex items-center gap-2 text-small font-medium">
      <svg width="18" height="18" viewBox="0 0 18 18" role="img" aria-label={veg ? t("veg") : t("nonveg")}>
        <rect x="1" y="1" width="16" height="16" rx="3" fill="none" stroke={colour} strokeWidth="2" />
        {veg ? <circle cx="9" cy="9" r="4" fill={colour} /> : <path d="M9 4.5 13.5 13H4.5z" fill={colour} />}
      </svg>
      {withLabel && (veg ? t("veg") : t("nonveg"))}
    </span>
  );
}

// Each food category gets its own glyph and tint so a list of tiles reads at a glance.
export const FOOD: Record<Category, { glyph: string; tint: string }> = {
  rice_dish: { glyph: "🍛", tint: "bg-marigold-soft" },
  curry: { glyph: "🍲", tint: "bg-kumkum-soft" },
  bread: { glyph: "🫓", tint: "bg-marigold-soft" },
  dry_snack: { glyph: "🥟", tint: "bg-indigo-soft" },
  sweet: { glyph: "🍮", tint: "bg-kumkum-soft" },
  dairy_based: { glyph: "🥛", tint: "bg-indigo-soft" },
  salad_cut_fruit: { glyph: "🥗", tint: "bg-leaf-soft" },
};

export function FoodGlyph({ category, size = "md" }: { category: Category; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 text-[2rem]" : size === "sm" ? "h-10 w-10 text-xl" : "h-12 w-12 text-2xl";
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-chip ${box} ${FOOD[category].tint}`}>
      {FOOD[category].glyph}
    </span>
  );
}

const STATUS_TONE: Record<Status, string> = {
  posted: "bg-indigo-soft text-indigo",
  offered: "bg-indigo-soft text-indigo",
  claimed: "bg-marigold-soft text-ink",
  volunteer_assigned: "bg-marigold-soft text-ink",
  picked_up: "bg-marigold-soft text-ink",
  delivered: "bg-leaf-soft text-leaf",
  expired: "bg-sunken text-muted",
  cancelled: "bg-sunken text-muted",
};

export function StatusPill({ status }: { status: Status }) {
  const { t } = useT();
  return (
    <span className={`inline-flex w-fit items-center self-start rounded-full px-3 py-1 text-caption font-semibold ${STATUS_TONE[status]}`}>
      {t(`status_${status}` as TKey)}
    </span>
  );
}

export function StatTile({ value, label, tone = "plain", className = "" }: { value: ReactNode; label: string; tone?: "plain" | "leaf" | "marigold" | "indigo"; className?: string }) {
  const tones = {
    plain: "bg-surface border border-line",
    leaf: "bg-leaf-soft",
    marigold: "bg-marigold-soft",
    indigo: "bg-indigo-soft",
  } as const;
  return (
    <div className={`rounded-tile p-5 ${tones[tone]} ${className}`}>
      <div className="font-display text-headline font-bold">{value}</div>
      <div className="mt-1 text-small text-muted">{label}</div>
    </div>
  );
}

export function DemoBadge() {
  const { t } = useT();
  return <span className="inline-flex items-center rounded-full border border-dashed border-muted/60 px-3 py-1 text-caption text-muted">{t("demoData")}</span>;
}

export function Loading() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-3 p-6 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {t("loading")}
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="tile flex flex-col items-start gap-4 border-dashed">
      <Inbox className="h-8 w-8 text-muted" aria-hidden="true" />
      <p className="max-w-prose text-body text-muted">{text}</p>
      {action}
    </div>
  );
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { lang, t } = useT();
  if (!error) return null;
  const body = error instanceof ApiError ? error.body : null;
  const text = body ? (lang === "te" ? body.message_te : body.message) : String(error);
  const tries = body?.remaining_tries;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-tile bg-kumkum-soft p-4 text-ink">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-kumkum" aria-hidden="true" />
      <div className="flex-1">
        <p>{text}</p>
        {tries !== undefined && <p className="mt-1 text-small font-semibold">{t("triesLeft", { n: tries })}</p>}
      </div>
      {onRetry && (
        <button className="text-small font-semibold underline" onClick={onRetry}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}

// Big digits for a handover code: readable across a counter at night.
export function CodeDisplay({ code, label, hint }: { code: string; label: string; hint: string }) {
  return (
    <div className="tile-hero">
      <p className="text-small text-white/80">{label}</p>
      <p className="mt-2 font-display text-[3.5rem] font-bold leading-none tracking-[0.3em]" aria-label={code.split("").join(" ")}>
        {code}
      </p>
      <p className="mt-3 text-small text-white/80">{hint}</p>
    </div>
  );
}

// Four-digit entry as one input (works with paste and screen readers), drawn as four boxes.
export function CodeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block">
      <span className="text-small font-medium text-muted">{label}</span>
      <div className="relative mt-2">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={4}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
        <div className="grid grid-cols-4 gap-3" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-16 items-center justify-center rounded-chip border-2 bg-surface font-display text-headline font-bold ${
                focused && i === Math.min(value.length, 3) ? "border-marigold" : "border-line"
              }`}
            >
              {value[i] ?? ""}
            </div>
          ))}
        </div>
      </div>
    </label>
  );
}
