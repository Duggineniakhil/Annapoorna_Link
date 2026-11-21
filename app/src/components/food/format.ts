import type { Lang } from "../../i18n";
import type { Listing } from "../../types/api";

type T = (key: "time.hm" | "time.m", vars?: Record<string, string | number>) => string;

/** "1 h 20 min" / "20 min" (localised). Negative values become 0. */
export function formatDuration(ms: number, t: T): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? t("time.hm", { h, m }) : t("time.m", { m });
}

/** Clock time like "10:30 PM" in the chosen language. */
export function formatClock(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang === "te" ? "te-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Indian digit grouping: 12,480 or 1,24,800. */
export function formatNumber(n: number, lang: Lang): string {
  return n.toLocaleString(lang === "te" ? "te-IN" : "en-IN");
}

/** "Veg biryani, Dal" from a listing's items. */
export function itemsTitle(listing: Listing): string {
  return listing.items.map((item) => item.name).join(", ");
}
