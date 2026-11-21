import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { DeclineReason, Offer } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { ApiError, acceptOffer, declineOffer, getOffer } from "../../services/api";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ListingCard } from "../../components/food/ListingCard";
import { formatClock, formatNumber } from "../../components/food/format";
import { SafetyCard } from "../../components/SafetyCard";
import { orgArea, orgName } from "../../mocks/fixtures";

// Receiver offer detail: listing, match reasons, distance and ETA, map placeholder, timeline,
// the delivery code once accepted, the volunteer, and the safety card. Refetched every 15 seconds.

const REFRESH_MS = 15_000;
const CLOSED_CODES: string[] = ["OFFER_EXPIRED", "OFFER_NOT_OPEN"];

const REASONS: DeclineReason[] = ["too_far", "cant_accept_type", "no_space", "closing"];
const REASON_KEY: Record<DeclineReason, MessageKey> = {
  too_far: "receiver.decline.reason.too_far",
  cant_accept_type: "receiver.decline.reason.cant_accept_type",
  no_space: "receiver.decline.reason.no_space",
  closing: "receiver.decline.reason.closing",
};

export default function ReceiverOfferDetail() {
  const { t, lang } = useT();
  const { id = "" } = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState<DeclineReason | null>(null);

  const load = useCallback(
    () =>
      getOffer(id)
        .then((next) => {
          setOffer(next);
          setNotFound(false);
          setError(null);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 404) {
            setOffer(null);
            setNotFound(true);
            return;
          }
          setError(t("receiver.error.generic"));
        }),
    [id, t],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  function actionMessage(err: unknown): string {
    const closed = err instanceof ApiError && CLOSED_CODES.includes(err.error_code);
    return t(closed ? "receiver.error.offerClosed" : "receiver.error.generic");
  }

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await acceptOffer(id);
      await load();
    } catch (err: unknown) {
      setError(actionMessage(err));
      void load();
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError(null);
    try {
      await declineOffer(id, reason ?? undefined);
      await load();
      setDeclining(false);
      setReason(null);
    } catch (err: unknown) {
      setError(actionMessage(err));
      void load();
    } finally {
      setBusy(false);
    }
  }

  const status = offer?.status ?? "open";
  const code = offer?.listing.delivery_code;
  const timeline: { key: string; label: string; at: string }[] =
    offer && offer.listing.timeline && offer.listing.timeline.length > 0
      ? offer.listing.timeline.map((event, i) => ({
          key: `${event.status}-${i}`,
          label: t(`status.${event.status}`),
          at: event.at,
        }))
      : offer
        ? [{ key: "offered", label: t("status.offered"), at: offer.expires_at }]
        : [];

  return (
    <Screen titleKey="receiver.offer.title" demoData>
      {error && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {error}
        </p>
      )}

      {notFound ? (
        <EmptyState icon="🔍" message={t("receiver.offer.notFound")} />
      ) : !offer ? (
        error ? null : (
          <p role="status" className="text-ink/60">
            {t("receiver.offer.loading")}
          </p>
        )
      ) : (
        <>
          {status === "expired" && (
            <p role="alert" className="rounded-2xl bg-chilli-700 p-4 font-bold text-white">
              {t("receiver.offer.expired")}
            </p>
          )}
          {status === "declined" && (
            <p role="status" className="rounded-2xl bg-cream p-4 font-bold text-ink">
              {t("receiver.offer.declined")}
            </p>
          )}
          {status === "accepted" && (
            <p role="status" className="rounded-2xl bg-leaf-800 p-4 font-bold text-white">
              {t("receiver.offer.accepted")}
            </p>
          )}

          <ListingCard
            listing={offer.listing}
            donorName={orgName(offer.listing.donor_org)}
            area={orgArea(offer.listing.donor_org)}
            distanceKm={offer.distance_km}
            showSafety={false}
          />

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
              <span>
                {t("receiver.offer.distance", { km: formatNumber(offer.distance_km, lang) })}
              </span>
              <span>{t("offer.eta", { min: offer.eta_min })}</span>
            </div>
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
          </Card>

          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-leaf-800/15 p-6 text-center text-ink/60">
            <h2 className="font-bold text-ink">{t("receiver.offer.map")}</h2>
            <p>{t("receiver.offer.mapPlaceholder")}</p>
          </div>

          <Card className="flex flex-col gap-3 p-4">
            <h2 className="font-bold text-ink">{t("receiver.offer.timeline")}</h2>
            <ol className="flex flex-col gap-3">
              {timeline.map((row) => (
                <li key={row.key} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf-700" />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-medium text-ink">{row.label}</span>
                    <time dateTime={row.at} className="text-sm text-ink/60">
                      {formatClock(row.at, lang)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {status === "accepted" && code && (
            <Card className="flex flex-col items-center gap-2 p-4 text-center">
              <h2 className="font-bold text-ink">{t("receiver.offer.deliveryCode")}</h2>
              <p
                aria-label={code.split("").join(" ")}
                className="font-mono text-5xl font-bold tracking-[0.3em] text-leaf-800"
              >
                {code}
              </p>
              <p className="text-sm text-ink/80">{t("receiver.offer.deliveryCodeHint")}</p>
            </Card>
          )}

          {(offer.volunteer_first_name || offer.volunteer_eta_min !== undefined) && (
            <Card className="flex flex-col gap-1 p-4">
              {offer.volunteer_first_name && (
                <p className="font-bold text-ink">
                  {t("receiver.offer.volunteer", { name: offer.volunteer_first_name })}
                </p>
              )}
              {offer.volunteer_eta_min !== undefined && (
                <p className="text-sm text-ink/70">
                  {t("receiver.offer.volunteerEta", { min: offer.volunteer_eta_min })}
                </p>
              )}
            </Card>
          )}

          <SafetyCard listing={offer.listing} variant="full" />

          {status === "open" &&
            (declining ? (
              <Card className="flex flex-col gap-3 p-4">
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
                      setDeclining(false);
                      setReason(null);
                    }}
                    disabled={busy}
                  >
                    {t("receiver.decline.cancel")}
                  </Button>
                  <Button onClick={() => void decline()} disabled={busy}>
                    {busy ? t("receiver.decline.submitting") : t("receiver.decline.confirm")}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Button size="lg" block onClick={() => void accept()} disabled={busy}>
                  {busy ? t("receiver.offer.accepting") : t("receiver.offer.accept")}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setError(null);
                    setReason(null);
                    setDeclining(true);
                  }}
                  disabled={busy}
                >
                  {t("receiver.offer.decline")}
                </Button>
              </div>
            ))}
        </>
      )}
    </Screen>
  );
}
