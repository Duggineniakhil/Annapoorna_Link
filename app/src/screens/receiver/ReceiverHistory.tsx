import { useEffect, useState } from "react";
import type { ReceiverHistoryItem } from "../../types/api";
import { getReceiverHistory } from "../../services/api";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { formatNumber } from "../../components/food/format";

export default function ReceiverHistory() {
  const { t, lang } = useT();
  const [items, setItems] = useState<ReceiverHistoryItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReceiverHistory()
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

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <Screen titleKey="receiver.history.title">
      {error && <p className="text-sm text-red-700">{t("receiver.error.generic")}</p>}
      {!error && !items && <p className="text-ink/70">{t("receiver.history.loading")}</p>}
      {items && items.length === 0 && (
        <EmptyState icon="🍱" message={t("receiver.history.empty")} />
      )}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-col gap-1 p-4">
                <h2 className="font-bold text-ink">{item.items_title}</h2>
                <p className="text-sm text-ink/70">
                  {t("receiver.history.from", { name: item.donor_name, area: item.area })}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-bold text-leaf-800">
                    {t("receiver.history.meals", { n: formatNumber(item.meals, lang) })}
                  </span>
                  <span className="text-ink/60">
                    {t("receiver.history.date", { date: formatDate(item.received_at) })}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
