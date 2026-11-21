import { useEffect, useState } from "react";
import { useT } from "../../i18n";
import type { VolunteerHistoryItem } from "../../types/api";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { formatNumber } from "../../components/food/format";
import { getVolunteerHistory } from "../../services/api";

function HistoryRow({ item }: { item: VolunteerHistoryItem }) {
  const { t, lang } = useT();
  const date = new Date(item.delivered_at).toLocaleString(lang === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold leading-snug text-ink">{item.items_title}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-50 px-3 py-1 text-sm font-bold text-leaf-800">
          <Icon name="check" className="h-4 w-4" />
          {t("volunteer.history.delivered")}
        </span>
      </div>
      <p className="text-sm text-ink/70">
        {item.donor_area} → {item.receiver_area}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
        <span className="font-bold text-ink/80">
          {t("volunteer.history.meals", { count: formatNumber(item.meals, lang) })}
        </span>
        <span aria-hidden="true">·</span>
        <span>{t("volunteer.history.date", { date })}</span>
      </div>
    </Card>
  );
}

export default function VolunteerHistory() {
  const { t } = useT();
  const [items, setItems] = useState<VolunteerHistoryItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getVolunteerHistory()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen titleKey="volunteer.history.title">
      {error && (
        <p role="alert" className="rounded-xl bg-chilli-50 p-3 text-sm font-bold text-chilli-700">
          {t("volunteer.error.generic")}
        </p>
      )}
      {!error && items === null && (
        <div role="status" aria-busy="true" className="h-24 animate-pulse rounded-2xl bg-ink/5" />
      )}
      {items !== null &&
        (items.length === 0 ? (
          <EmptyState icon="🕘" message={t("volunteer.history.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <HistoryRow item={item} />
              </li>
            ))}
          </ul>
        ))}
    </Screen>
  );
}
