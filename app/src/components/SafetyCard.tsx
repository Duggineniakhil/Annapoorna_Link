import type { Listing, Storage } from "../types/api";
import type { MessageKey } from "../i18n/en";
import { useT } from "../i18n";
import { useNow } from "../hooks/useNow";
import { formatDuration } from "./food/format";
import { VegMark } from "./food/FoodBits";
import { Icon, type IconName } from "./ui/Icon";
import { safetyCountdown, safetyCountdownState, type SafetyState } from "./safety";

// Reusable safety card (doc 10 §3): storage, live countdown, veg mark, allergens, guidance and
// the disclaimer, which is always visible. App-authored text never says food is safe,
// certified or approved.

const STORAGE: Record<Storage, { icon: IconName; key: MessageKey }> = {
  hot: { icon: "flame", key: "safetyCard.storage.hot" },
  room: { icon: "box", key: "safetyCard.storage.room" },
  chilled: { icon: "snow", key: "safetyCard.storage.chilled" },
};

const CHIP_CLASS: Record<SafetyState, string> = {
  ok: "bg-leaf-50 text-leaf-800",
  soon: "bg-turmeric-100 text-turmeric-800",
  urgent: "bg-chilli-50 text-chilli-700",
  expired: "bg-chilli-700 text-white",
};

const BORDER_CLASS: Record<SafetyState | "none", string> = {
  ok: "border-ink/10",
  soon: "border-turmeric-300",
  urgent: "border-chilli-600",
  expired: "border-chilli-700",
  none: "border-ink/10",
};

/**
 * Safety summary for a listing, offer or task. The countdown is chosen from the listing's
 * status. `now` overrides the live clock (tests and fixed views).
 */
export function SafetyCard({
  listing,
  variant = "full",
  now,
}: {
  listing: Listing;
  variant?: "full" | "compact";
  now?: number;
}) {
  const { t, lang } = useT();
  const liveNow = useNow();
  const current = now ?? liveNow;
  const compact = variant === "compact";

  const countdown = safetyCountdown(listing);
  const msLeft = "target" in countdown ? Date.parse(countdown.target) - current : 0;
  const state: SafetyState | "none" =
    countdown.kind === "none"
      ? "none"
      : countdown.kind === "expired"
        ? "expired"
        : safetyCountdownState(msLeft);
  const storage = STORAGE[listing.storage];
  const guidance = lang === "te" ? listing.safety.guidance_te : listing.safety.guidance_en;

  let chip: string | null = null;
  if (state === "expired") chip = t("safetyCard.expired");
  else if (countdown.kind === "pickup" || countdown.kind === "serve")
    chip = t(
      countdown.kind === "serve" ? "safetyCard.countdown.serve" : "safetyCard.countdown.pickup",
      { time: formatDuration(msLeft, t) },
    );

  return (
    <div
      data-safety-state={state}
      className={`flex flex-col gap-2 rounded-2xl border-2 bg-white ${compact ? "p-3" : "p-4"} ${BORDER_CLASS[state]}`}
    >
      {!compact && (
        <h3 className="flex items-center gap-2 font-bold text-ink">
          <Icon name="info" className="h-5 w-5 text-leaf-700" />
          {t("safetyCard.guidance")}
        </h3>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1 text-sm font-bold text-ink">
          <Icon name={storage.icon} className="h-4 w-4" />
          {t(storage.key)}
        </span>
        <VegMark veg={listing.veg} withLabel />
      </div>

      {chip && (
        <p
          role={state === "expired" ? "alert" : undefined}
          className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-sm font-bold ${CHIP_CLASS[state as SafetyState]}`}
        >
          {state !== "expired" && <Icon name="clock" className="h-4 w-4" />}
          {chip}
        </p>
      )}

      {listing.allergens.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-ink/70">{t("safetyCard.allergens")}</span>
          {listing.allergens.map((allergen) => (
            <span
              key={allergen}
              className="rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-ink/80 ring-1 ring-ink/10"
            >
              {t(`allergen.${allergen}`)}
            </span>
          ))}
        </div>
      )}

      {guidance && (
        <p className={compact ? "text-xs text-ink/80" : "text-sm text-ink/80"}>{guidance}</p>
      )}
      <p className="text-xs text-ink/70">{t("safetyCard.disclaimer")}</p>
    </div>
  );
}
