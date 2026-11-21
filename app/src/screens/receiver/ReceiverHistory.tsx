import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ReceiverHistoryItem } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { getReceiverHistory } from "../../services/api";
import { useT } from "../../i18n";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { formatNumber, itemsTitle } from "../../components/food/format";
import { orgArea, orgName } from "../../mocks/fixtures";

// Receiver history (doc 12: GET /api/receiver/history, newest first, at most 50): every offer
// this kitchen accepted, declined or missed, with the meals actually delivered.

type Outcome = "delivered" | "accepted" | "declined" | "expired";

const OUTCOME_KEY: Record<Outcome, MessageKey> = {
  delivered: "receiver.history.status.delivered",
  accepted: "receiver.history.status.accepted",
  declined: "receiver.history.status.declined",
  expired: "receiver.history.status.expired",
};

const OUTCOME_STYLE: Record<Outcome, string> = {
  delivered: "bg-leaf-50 text-leaf-900",
  accepted: "bg-turmeric-100 text-turmeric-800",
  declined: "bg-ink/5 text-ink/70",
  expired: "bg-chilli-50 text-chilli-700",
};

function outcomeOf(item: ReceiverHistoryItem): Outcome {
  if (item.offer_status === "accepted") {
    return item.meals_delivered !== null ? "delivered" : "accepted";
  }
  return item.offer_status === "declined" ? "declined" : "expired";
}

export default function ReceiverHistory() {
  const { t, lang } = useT();
  const [items, setItems] = useState<ReceiverHistoryItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(
    () =>
      getReceiverHistory()
        .then((list) => {
          setItems(list);
          setError(false);
        })
        .catch(() => setError(true)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  // A delivery or an expiring offer adds a row.
  useLiveRefetch(() => void load());

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <Screen titleKey="receiver.history.title" demoData>
      {error && !items && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {t("receiver.error.generic")}
        </p>
      )}
      {!error && !items && <p className="text-ink/70">{t("receiver.history.loading")}</p>}
      {items && items.length === 0 && (
        <EmptyState
          icon="🍱"
          message={t("receiver.history.empty")}
          action={
            <ButtonLink to="/receiver" variant="secondary">
              {t("empty.action.offers")}
            </ButtonLink>
          }
        />
      )}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const outcome = outcomeOf(item);
            const meals = item.meals_delivered ?? item.listing.total_meals;
            const body = (
              <Card className="flex flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-ink">{itemsTitle(item.listing)}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${OUTCOME_STYLE[outcome]}`}
                  >
                    {t(OUTCOME_KEY[outcome])}
                  </span>
                </div>
                <p className="text-sm text-ink/70">
                  {t("receiver.history.from", {
                    name: orgName(item.listing.donor_org),
                    area: orgArea(item.listing.donor_org),
                  })}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span
                    className={outcome === "delivered" ? "font-bold text-leaf-800" : "text-ink/60"}
                  >
                    {t("receiver.history.meals", { n: formatNumber(meals, lang) })}
                  </span>
                  <span className="text-ink/60">{formatDate(item.at)}</span>
                </div>
              </Card>
            );
            // Seeded past rows have no offer page; offers from this demo link to theirs.
            const linkable = item.offer_id.startsWith("off-");
            return (
              <li key={item.offer_id}>
                {linkable ? (
                  <Link to={`/receiver/offers/${item.offer_id}`} className="block rounded-2xl">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
