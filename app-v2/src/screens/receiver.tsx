import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bike, MapPin } from "lucide-react";
import { useAcceptOffer, useDeclineOffer, useHistory, useNeeds, useOffer, useOffers, useSaveNeeds } from "../api/hooks";
import type { Needs, Offer } from "../api/types";
import { useT } from "../lib/i18n";
import { clock } from "../lib/time";
import { CodeDisplay, Empty, ErrorNote, Loading, StatusPill, VegMark } from "../ui/bits";
import { FoodSummary, SafetyCard, StatusSteps, STORAGE_ICON } from "../ui/Food";
import { PageHead } from "../ui/Shell";
import { TimeRing } from "../ui/TimeRing";

const OFFER_WINDOW_MS = 10 * 60_000;

export function Offers() {
  const { t } = useT();
  const offers = useOffers();
  return (
    <>
      <PageHead title={t("offersTitle")} />
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8" aria-label={t("offersTitle")}>
          {offers.isLoading && <Loading />}
          <ErrorNote error={offers.error} onRetry={() => void offers.refetch()} />
          {offers.data?.length === 0 && <Empty text={t("noOffers")} />}
          <ul className="flex flex-col gap-4">
            {offers.data?.map((o) => (
              <li key={o.id}>
                <OfferTile offer={o} />
              </li>
            ))}
          </ul>
        </section>
        <aside className="lg:col-span-4">
          <NeedsTile />
        </aside>
      </div>
    </>
  );
}

function OfferTile({ offer }: { offer: Offer }) {
  const { t, pick } = useT();
  const navigate = useNavigate();
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();
  const l = offer.listing;
  const Icon = STORAGE_ICON[l.storage];
  const busy = accept.isPending || decline.isPending;
  const opened = new Date(Date.parse(offer.expires_at) - OFFER_WINDOW_MS).toISOString();

  return (
    <article className="tile flex flex-col gap-5 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <FoodSummary listing={l} />
        <TimeRing from={opened} until={offer.expires_at} size={88} caption={t("respondIn")} expiredText={t("expired")} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-small">
        <span className="inline-flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4 text-muted" aria-hidden="true" />
          {l.donor_org.name}, {l.donor_org.area}
        </span>
        <VegMark veg={l.veg} withLabel />
        <span className="inline-flex items-center gap-1 text-muted">
          <Icon className="h-4 w-4" aria-hidden="true" /> {t(l.storage)}
        </span>
      </div>
      <div>
        <p className="text-caption text-muted">{t("why")}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {offer.reasons.map((r, i) => (
            <li key={i} className="rounded-full bg-leaf-soft px-3 py-1 text-small font-semibold text-leaf">
              {pick(r)}
            </li>
          ))}
        </ul>
      </div>
      {offer.volunteer_first_name && offer.volunteer_eta_min != null && (
        <p className="flex items-center gap-2 rounded-chip bg-indigo-soft px-4 py-3 text-small">
          <Bike className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("volunteerComing", { name: offer.volunteer_first_name, min: offer.volunteer_eta_min })}
        </p>
      )}
      <ErrorNote error={accept.error ?? decline.error} />
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <button className="btn-quiet" disabled={busy} onClick={() => decline.mutate(offer.id)}>
          {t("decline")}
        </button>
        {/* mutateAsync, not mutate+onSuccess: the refetch removes this tile before a per-call callback would run. */}
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() => void accept.mutateAsync(offer.id).then(() => navigate(`/receiver/offers/${offer.id}`), () => undefined)}
        >
          {t("accept")}
        </button>
      </div>
    </article>
  );
}

export function OfferDetail() {
  const { id = "" } = useParams();
  const { t, lang } = useT();
  const q = useOffer(id);
  if (q.isLoading) return <Loading />;
  if (!q.data) return <ErrorNote error={q.error} onRetry={() => void q.refetch()} />;
  const o = q.data;
  const l = o.listing;
  if (o.status === "open") return <OfferTile offer={o} />;

  return (
    <>
      <PageHead title={l.items.map((i) => i.name).join(", ")}>
        <p className="mt-2 text-muted">
          {l.donor_org.name}, {l.donor_org.area}
        </p>
      </PageHead>
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          {l.delivery_code && l.status !== "delivered" ? (
            <CodeDisplay code={l.delivery_code} label={t("deliveryCode")} hint={t("deliveryCodeHint")} />
          ) : (
            <div className="tile">
              <StatusPill status={l.status} />
            </div>
          )}
        </div>
        <div className="tile flex flex-col gap-6 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <FoodSummary listing={l} />
            <StatusPill status={l.status} />
          </div>
          <StatusSteps status={l.status} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-chip bg-sunken p-4">
              <p className="text-caption text-muted">{t("volunteerName")}</p>
              <p className="mt-1 font-semibold">{l.volunteer?.display_name ?? o.volunteer_first_name ?? "–"}</p>
            </div>
            <div className="rounded-chip bg-sunken p-4">
              <p className="text-caption text-muted">{t("pickupBy")}</p>
              <p className="mt-1 font-semibold">{clock(l.pickup_by, lang)}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-12">
          <SafetyCard listing={l} />
        </div>
      </div>
    </>
  );
}

function NeedsTile() {
  const { t } = useT();
  const q = useNeeds();
  const save = useSaveNeeds();
  const [form, setForm] = useState<Needs | null>(null);
  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);
  if (!form) return q.isLoading ? <Loading /> : <ErrorNote error={q.error} />;

  return (
    <section className="tile lg:sticky lg:top-10" aria-labelledby="needs">
      <h2 id="needs" className="font-display text-title font-semibold">
        {t("todayNeeds")}
      </h2>
      <label className="mt-4 block">
        <span className="text-small text-muted">{t("mealsNeeded")}</span>
        <input
          type="number"
          min={0}
          step={10}
          value={form.meals_needed}
          onChange={(e) => setForm({ ...form, meals_needed: Math.max(0, Number(e.target.value) || 0) })}
          className="mt-2 h-14 w-full rounded-chip border border-line bg-surface px-4 font-display text-title font-bold"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-small text-muted">{t("from")}</span>
          <input type="time" value={form.open_from} onChange={(e) => setForm({ ...form, open_from: e.target.value })} className="mt-2 h-12 w-full rounded-chip border border-line bg-surface px-3" />
        </label>
        <label className="block">
          <span className="text-small text-muted">{t("to")}</span>
          <input type="time" value={form.open_to} onChange={(e) => setForm({ ...form, open_to: e.target.value })} className="mt-2 h-12 w-full rounded-chip border border-line bg-surface px-3" />
        </label>
      </div>
      <button type="button" aria-pressed={form.veg_only} onClick={() => setForm({ ...form, veg_only: !form.veg_only })} className="chip mt-4 w-full justify-center">
        <VegMark veg /> {t("veg")}
      </button>
      <div className="mt-4">
        <ErrorNote error={save.error} />
      </div>
      <button className="btn-quiet mt-4 w-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
        {save.isSuccess ? t("saved") : t("save")}
      </button>
    </section>
  );
}

export function ReceiverHistory() {
  const { t, lang } = useT();
  const q = useHistory();
  const items = q.data?.filter((h) => h.offer_status === "accepted") ?? [];
  return (
    <>
      <PageHead title={t("historyTitle")} />
      {q.isLoading && <Loading />}
      <ErrorNote error={q.error} onRetry={() => void q.refetch()} />
      {q.data && items.length === 0 && <Empty text={t("noHistory")} />}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((h) => (
          <li key={h.offer_id}>
            <Link to={`/receiver/offers/${h.offer_id}`} className="tile flex h-full flex-col gap-3 hover:border-indigo">
              <div className="flex items-center justify-between">
                <StatusPill status={h.listing.status} />
                <span className="text-small text-muted">{new Date(h.at).toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="font-display text-headline font-bold">
                {h.meals_delivered ?? h.listing.total_meals} <span className="text-body font-normal text-muted">{t("meals")}</span>
              </p>
              <p className="truncate text-small">{h.listing.items.map((i) => i.name).join(", ")}</p>
              <p className="text-small text-muted">
                {h.listing.donor_org.name}, {h.listing.donor_org.area}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
