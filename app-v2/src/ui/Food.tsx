import { Check, Info, ThermometerSnowflake, ThermometerSun, Flame } from "lucide-react";
import type { Listing, Status, Storage } from "../api/types";
import { useT, type TKey } from "../lib/i18n";
import { clock } from "../lib/time";
import { FoodGlyph, VegMark } from "./bits";

export const STORAGE_ICON: Record<Storage, typeof Flame> = { hot: Flame, room: ThermometerSun, chilled: ThermometerSnowflake };

export function itemsTitle(l: Listing): string {
  return l.items.map((i) => i.name).join(", ");
}

// Safety card (docs/10): storage, times, allergens, veg mark, guidance and the disclaimer. Never says "safe".
export function SafetyCard({ listing }: { listing: Listing }) {
  const { t, lang } = useT();
  const Icon = STORAGE_ICON[listing.storage];
  const guidance = lang === "te" ? listing.safety.guidance_te : listing.safety.guidance_en;
  return (
    <section className="tile" aria-labelledby={`safety-${listing.id}`}>
      <h3 id={`safety-${listing.id}`} className="font-display text-title font-semibold">
        {t("safetyTitle")}
      </h3>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Fact label={t("storage")}>
          <span className="inline-flex items-center gap-2">
            <Icon className="h-5 w-5 text-marigold" aria-hidden="true" />
            {t(listing.storage)}
          </span>
        </Fact>
        <Fact label={t("vegQ")}>
          <VegMark veg={listing.veg} withLabel />
        </Fact>
        <Fact label={t("pickupBy")}>{clock(listing.pickup_by, lang)}</Fact>
        <Fact label={t("serveBy")}>{clock(listing.safety.serve_by, lang)}</Fact>
      </dl>
      {listing.allergens.length > 0 && (
        <div className="mt-4">
          <p className="text-small text-muted">{t("allergens")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {listing.allergens.map((a) => (
              <li key={a} className="rounded-full bg-kumkum-soft px-3 py-1 text-caption font-semibold text-kumkum">
                {t(`al_${a}` as TKey)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {guidance && <p className="mt-4 text-body">{guidance}</p>}
      <p className="mt-4 flex gap-2 border-t border-line pt-4 text-caption text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t("disclaimer")}
      </p>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-chip bg-sunken px-4 py-3">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

// The five things that happen to food, in order. This is a real sequence, so it is drawn as one.
const STEPS: Status[] = ["posted", "claimed", "volunteer_assigned", "picked_up", "delivered"];
const RANK: Record<Status, number> = { posted: 0, offered: 0, claimed: 1, volunteer_assigned: 2, picked_up: 3, delivered: 4, expired: -1, cancelled: -1 };

export function StatusSteps({ status }: { status: Status }) {
  const { t } = useT();
  const at = RANK[status];
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label={t(`status_${status}` as TKey)}>
      {STEPS.map((s, i) => {
        const done = at >= i;
        return (
          <li key={s} className="flex flex-col gap-2">
            <span className={`h-2 rounded-full ${done ? (at === 4 ? "bg-leaf" : "bg-marigold") : "bg-sunken"}`} />
            <span className={`hidden text-caption sm:block ${done ? "text-ink" : "text-muted"}`}>{t(`status_${s}` as TKey)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function FoodSummary({ listing }: { listing: Listing }) {
  const { t } = useT();
  const first = listing.items[0];
  return (
    <div className="flex items-center gap-4">
      {first && <FoodGlyph category={first.category} size="lg" />}
      <div className="min-w-0">
        <p className="font-display text-headline font-bold leading-none">
          {listing.total_meals}
          <span className="ml-2 text-lead font-medium text-muted">{t("meals")}</span>
        </p>
        <p className="mt-2 truncate text-body">{itemsTitle(listing)}</p>
      </div>
    </div>
  );
}

export function DoneMark() {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-white">
      <Check className="h-7 w-7" aria-hidden="true" />
    </span>
  );
}
