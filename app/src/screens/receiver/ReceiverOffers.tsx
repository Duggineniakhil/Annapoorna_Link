import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DeclineReason, Offer } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { useNow } from "../../hooks/useNow";
import { ApiError, acceptOffer, declineOffer, listOffers } from "../../services/api";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { FilterChips, type ChipOption } from "../../components/ui/FilterChips";
import { LocationHeader } from "../../components/ui/LocationHeader";
import { Button } from "../../components/ui/Button";
import { ListingCard } from "../../components/food/ListingCard";
import { Countdown } from "../../components/food/FoodBits";
import { orgArea, orgName } from "../../mocks/fixtures";

const REFRESH_MS = 15_000;
const CLOSED_CODES: string[] = ["OFFER_EXPIRED", "OFFER_NOT_OPEN"];

type Filter = "all" | "veg" | "soon";
const FILTERS: ChipOption<Filter>[] = [
  { value: "all", labelKey: "common.all" },
  { value: "veg", labelKey: "receiver.filter.veg" },
  { value: "soon", labelKey: "receiver.filter.soon" },
];

const REASONS: DeclineReason[] = ["too_far", "cant_accept_type", "no_space", "closing"];
const REASON_KEY: Record<DeclineReason, MessageKey> = {
  too_far: "receiver.decline.reason.too_far",
  cant_accept_type: "receiver.decline.reason.cant_accept_type",
  no_space: "receiver.decline.reason.no_space",
  closing: "receiver.decline.reason.closing",
};

export default function ReceiverOffers() {
  const { t, lang } = useT();
  const { org } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState<DeclineReason | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const now = useNow(5_000);
  // Offers this screen has shown as open; when one of them expires we say so once.
  const seenOpen = useRef(new Set<string>());
  const [dismissedExpired, setDismissedExpired] = useState<string[]>([]);

  const load = useCallback(
    () =>
      listOffers()
        .then((list) => {
          setOffers(list);
          setLoadError(null);
        })
        .catch(() => setLoadError(t("receiver.error.generic"))),
    [t],
  );

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  function actionMessage(err: unknown): string {
    const closed = err instanceof ApiError && CLOSED_CODES.includes(err.error_code);
    return t(closed ? "receiver.error.offerClosed" : "receiver.error.generic");
  }

  async function accept(id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await acceptOffer(id);
      navigate(`/receiver/offers/${id}`);
    } catch (err: unknown) {
      setActionError(actionMessage(err));
      setBusyId(null);
      void load();
    }
  }

  async function decline(id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await declineOffer(id, reason ?? undefined);
      setOffers((prev) => prev?.filter((offer) => offer.id !== id) ?? null);
      setDecliningId(null);
      setReason(null);
    } catch (err: unknown) {
      setActionError(actionMessage(err));
      void load();
    } finally {
      setBusyId(null);
    }
  }

  const isExpired = (offer: Offer) =>
    offer.status === "expired" || Date.parse(offer.expires_at) <= now;
  // Only open offers are listed; an expired one disappears and a notice says why.
  const live = (offers ?? []).filter(
    (offer) => (offer.status ?? "open") === "open" && !isExpired(offer),
  );
  const justExpired = (offers ?? []).filter(
    (offer) =>
      isExpired(offer) && seenOpen.current.has(offer.id) && !dismissedExpired.includes(offer.id),
  );
  useEffect(() => {
    live.forEach((offer) => seenOpen.current.add(offer.id));
  });
  // A veg-only kitchen is never offered non-veg food, matching the server's eligibility rule.
  const mine = live.filter((offer) => !org?.veg_only || offer.listing.veg);

  const shown = mine.filter((offer) => {
    if (filter === "veg") return offer.listing.veg;
    if (filter === "soon") return new Date(offer.listing.pickup_by).getTime() - now < 60 * 60_000;
    return true;
  });

  return (
    <Screen
      titleKey="receiver.offers.title"
      eyebrow={org ? <LocationHeader area={org.area} radiusKm={8} /> : undefined}
      demoData
    >
      <FilterChips
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        labelKey="receiver.offers.filterLabel"
      />
      {justExpired.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700"
        >
          <p className="flex-1">{t("receiver.offer.expiredGone")}</p>
          <button
            type="button"
            onClick={() =>
              setDismissedExpired((prev) => [...prev, ...justExpired.map((o) => o.id)])
            }
            aria-label={t("post.dismiss")}
            className="-m-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl leading-none hover:bg-chilli-100"
          >
            ×
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {actionError}
        </p>
      )}
      {loadError && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {loadError}
        </p>
      )}
      {offers === null ? (
        loadError ? null : (
          <p role="status" className="text-ink/60">
            {t("receiver.offers.loading")}
          </p>
        )
      ) : mine.length === 0 ? (
        <EmptyState icon="🍲" message={t("receiver.offers.empty")} />
      ) : shown.length === 0 ? (
        <EmptyState icon="🔍" message={t("receiver.offers.noMatch")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((offer) => (
            <li key={offer.id}>
              <ListingCard
                listing={offer.listing}
                donorName={orgName(offer.listing.donor_org)}
                area={orgArea(offer.listing.donor_org)}
                distanceKm={offer.distance_km}
                to={`/receiver/offers/${offer.id}`}
              >
                {offer.status === "expired" ? (
                  <p role="status" className="rounded-xl bg-chilli-700 p-3 font-bold text-white">
                    {t("receiver.offer.expired")}
                  </p>
                ) : (
                  <>
                    <ul className="flex flex-wrap gap-1.5">
                      {offer.reasons.map((match, i) => (
                        <li
                          key={`${match.en}-${i}`}
                          className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-medium text-leaf-900 ring-1 ring-leaf-800/10"
                        >
                          {lang === "te" ? match.te : match.en}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Countdown deadline={offer.expires_at} kind="respond" />
                      <span className="text-sm text-ink/60">
                        {t("offer.eta", { min: offer.eta_min })}
                      </span>
                    </div>

                    {decliningId === offer.id ? (
                      <div className="flex flex-col gap-3 rounded-xl bg-cream p-3">
                        <p className="font-bold text-ink">{t("receiver.decline.title")}</p>
                        <div
                          role="group"
                          aria-label={t("receiver.reason.label")}
                          className="flex flex-wrap gap-2"
                        >
                          {REASONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={reason === option}
                              onClick={() => setReason(reason === option ? null : option)}
                              className={`min-h-11 rounded-full px-3 text-sm font-bold transition-colors ${
                                reason === option
                                  ? "bg-leaf-800 text-white"
                                  : "bg-white text-leaf-800 ring-1 ring-inset ring-leaf-800/30"
                              }`}
                            >
                              {t(REASON_KEY[option])}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setDecliningId(null);
                              setReason(null);
                            }}
                            disabled={busyId !== null}
                          >
                            {t("receiver.decline.cancel")}
                          </Button>
                          <Button onClick={() => void decline(offer.id)} disabled={busyId !== null}>
                            {busyId === offer.id
                              ? t("receiver.decline.submitting")
                              : t("receiver.decline.confirm")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Button
                          size="lg"
                          block
                          onClick={() => void accept(offer.id)}
                          disabled={busyId !== null}
                        >
                          {busyId === offer.id
                            ? t("receiver.offer.accepting")
                            : t("receiver.offer.accept")}
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => {
                            setActionError(null);
                            setReason(null);
                            setDecliningId(offer.id);
                          }}
                          disabled={busyId !== null}
                        >
                          {t("receiver.offer.decline")}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </ListingCard>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
