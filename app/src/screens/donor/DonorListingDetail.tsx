import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import type { Listing, Status, TimelineEvent } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { ApiError, apiRequest } from "../../services/api";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { ListingCard } from "../../components/food/ListingCard";
import { formatClock } from "../../components/food/format";
import { SafetyCard } from "../../components/SafetyCard";

// Donor listing detail: the listing card, status timeline, matched receiver and volunteer,
// pickup code (before pickup), cancel (before pickup), expired notice and the safety card.
// The listing is refetched on live updates (and every 15 seconds while live updates are paused).

const CANCELLABLE: Status[] = ["posted", "offered", "claimed", "volunteer_assigned"];
const CODE_HIDDEN: Status[] = ["picked_up", "delivered", "expired", "cancelled"];

const STATUS_KEY: Record<Status, MessageKey> = {
  posted: "status.posted",
  offered: "status.offered",
  claimed: "status.claimed",
  volunteer_assigned: "status.volunteer_assigned",
  picked_up: "status.picked_up",
  delivered: "status.delivered",
  expired: "status.expired",
  cancelled: "status.cancelled",
};

export default function DonorListingDetail() {
  const { t, lang } = useT();
  const { id } = useParams();
  const { org } = useAuth();
  const location = useLocation();
  const postedIn = (location.state as { postedInMs?: number } | null)?.postedInMs;
  const [showToast, setShowToast] = useState(postedIn !== undefined);
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Keeps the previous listing on refetch; only the first load shows the loading state.
  const load = useCallback(
    () =>
      apiRequest<Listing>("GET", `/api/listings/${id ?? ""}`)
        .then((l) => {
          setListing(l);
          setError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err));
        }),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefetch(() => void load(), id);

  async function cancelListing() {
    if (!listing) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await apiRequest<Listing>("POST", `/api/listings/${listing.id}/cancel`);
      setListing(updated);
      setConfirming(false);
    } catch (err: unknown) {
      setCancelError(
        err instanceof ApiError && err.status === 409
          ? t("donor.cancel.conflict")
          : t("donor.cancel.failed"),
      );
    } finally {
      setCancelling(false);
    }
  }

  function timelineLabel(event: TimelineEvent): string {
    if (event.status === "offered" && listing?.matched_receiver) {
      return t("donor.timeline.offeredTo", { name: listing.matched_receiver.name });
    }
    return t(STATUS_KEY[event.status]);
  }

  return (
    <Screen titleKey="donor.listing.title" demoData>
      {showToast && postedIn !== undefined && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl bg-leaf-800 p-4 text-white shadow-card"
        >
          <Icon name="check" className="mt-0.5 h-6 w-6 shrink-0 text-turmeric-300" />
          <p className="flex-1 font-bold">
            {t("post.success", { s: Math.max(1, Math.round(postedIn / 1000)) })}
          </p>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label={t("post.dismiss")}
            className="-m-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-white/80 hover:bg-white/10"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-4 font-medium text-chilli-700">
          {error}
        </p>
      )}

      {listing && (
        <>
          {listing.status === "expired" && (
            <p role="alert" className="rounded-2xl bg-chilli-700 p-4 font-bold text-white">
              {t("donor.expiredBanner")}
            </p>
          )}

          <ListingCard
            listing={listing}
            donorName={org?.name ?? ""}
            area={org?.area ?? ""}
            showSteps
            showSafety={false}
          />

          {listing.timeline && listing.timeline.length > 0 && (
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="font-bold text-ink">{t("donor.timeline.title")}</h2>
              <ol className="flex flex-col gap-3">
                {listing.timeline.map((event, i) => (
                  <li key={`${event.status}-${event.at}-${i}`} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf-700" />
                    <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium text-ink">{timelineLabel(event)}</span>
                      <time dateTime={event.at} className="text-sm text-ink/60">
                        {formatClock(event.at, lang)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {(listing.matched_receiver || listing.volunteer) && (
            <Card className="flex flex-col gap-2 p-4">
              {listing.matched_receiver && (
                <div className="flex flex-col gap-1">
                  <h2 className="font-bold text-ink">{t("donor.match.receiver")}</h2>
                  <p className="text-ink">
                    {listing.matched_receiver.name}
                    {listing.matched_receiver.area ? `, ${listing.matched_receiver.area}` : ""}
                  </p>
                  {listing.matched_receiver.distance_km !== undefined && (
                    <p className="text-sm text-ink/70">
                      {t("common.km", { km: listing.matched_receiver.distance_km })}
                    </p>
                  )}
                </div>
              )}
              {listing.volunteer && (
                <div className="flex flex-col gap-1">
                  <h2 className="font-bold text-ink">{t("donor.match.volunteer")}</h2>
                  <p className="text-ink">{listing.volunteer}</p>
                  {listing.volunteer_vehicle && (
                    <p className="text-sm text-ink/70">
                      {t("donor.match.vehicle", { vehicle: listing.volunteer_vehicle })}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {listing.pickup_code && !CODE_HIDDEN.includes(listing.status) && (
            <Card className="flex flex-col items-center gap-2 p-4 text-center">
              <h2 className="font-bold text-ink">{t("donor.pickupCode.label")}</h2>
              <p
                aria-label={listing.pickup_code.split("").join(" ")}
                className="font-mono text-5xl font-bold tracking-[0.3em] text-leaf-800"
              >
                {listing.pickup_code}
              </p>
              <p className="text-sm text-ink/80">{t("donor.pickupCode.hint")}</p>
            </Card>
          )}

          <SafetyCard listing={listing} variant="full" />

          {CANCELLABLE.includes(listing.status) && (
            <Card className="flex flex-col gap-3 p-4">
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelError(null);
                    setConfirming(true);
                  }}
                  className="min-h-11 rounded-2xl border border-chilli-700 px-4 py-3 font-bold text-chilli-700 hover:bg-chilli-50"
                >
                  {t("donor.cancel.button")}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="font-bold text-ink">{t("donor.cancel.confirmTitle")}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={cancelListing}
                      disabled={cancelling}
                      className="min-h-11 rounded-2xl bg-chilli-700 px-4 py-3 font-bold text-white disabled:opacity-60"
                    >
                      {cancelling ? t("donor.cancel.busy") : t("donor.cancel.confirm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={cancelling}
                      className="min-h-11 rounded-2xl border border-leaf-700 px-4 py-3 font-bold text-leaf-800 disabled:opacity-60"
                    >
                      {t("donor.cancel.keep")}
                    </button>
                  </div>
                </div>
              )}
              {cancelError && (
                <p
                  role="alert"
                  className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700"
                >
                  {cancelError}
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
