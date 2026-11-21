import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, PlusCircle } from "lucide-react";
import { useCancelListing, useGuidance, useImpact, useListing, useListings, usePostListing } from "../api/hooks";
import type { Allergen, Category, Listing, ListingItem, Storage } from "../api/types";
import { useT, type TKey } from "../lib/i18n";
import { useSession } from "../lib/session";
import { clock, useNow } from "../lib/time";
import { CodeDisplay, Empty, ErrorNote, FOOD, Loading, StatTile, StatusPill, VegMark } from "../ui/bits";
import { FoodSummary, SafetyCard, StatusSteps, STORAGE_ICON } from "../ui/Food";
import { PageHead } from "../ui/Shell";
import { TimeRing } from "../ui/TimeRing";

const ACTIVE = new Set(["posted", "offered", "claimed", "volunteer_assigned", "picked_up"]);

export function DonorHome() {
  const { t } = useT();
  const { org, user } = useSession();
  const listings = useListings();
  const impact = useImpact("me");
  const active = listings.data?.filter((l) => ACTIVE.has(l.status)) ?? [];
  const recent = listings.data?.filter((l) => !ACTIVE.has(l.status)).slice(0, 4) ?? [];

  return (
    <>
      <PageHead title={t("hello", { name: org?.name ?? user?.display_name ?? "" })} />
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <Link to="/donor/post" className="tile-hero group flex flex-col justify-between gap-8 lg:col-span-8 lg:p-10">
          <PlusCircle className="h-12 w-12 text-marigold" aria-hidden="true" />
          <div>
            <p className="font-display text-headline font-bold lg:text-display">{t("postCta")}</p>
            <p className="mt-2 max-w-md text-lead text-white/85">{t("postCtaHint")}</p>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
          <StatTile value={impact.data?.meals.toLocaleString("en-IN") ?? "–"} label={t("mealsSaved")} tone="leaf" />
          <StatTile value={impact.data ? Math.round(impact.data.kg).toLocaleString("en-IN") : "–"} label={t("kgSaved")} tone="marigold" />
        </div>
      </div>

      <section className="mt-10" aria-labelledby="active">
        <h2 id="active" className="mb-4 font-display text-title font-bold">
          {t("activeFood")}
        </h2>
        {listings.isLoading && <Loading />}
        <ErrorNote error={listings.error} onRetry={() => void listings.refetch()} />
        {listings.data && active.length === 0 && <Empty text={t("noActive")} />}
        <ul className="grid gap-4 md:grid-cols-2">
          {active.map((l) => (
            <li key={l.id}>
              <ListingTile listing={l} />
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section className="mt-10" aria-labelledby="recent">
          <h2 id="recent" className="mb-4 font-display text-title font-bold">
            {t("navHistory")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => (
              <li key={l.id}>
                <Link to={`/donor/listings/${l.id}`} className="tile flex h-full flex-col gap-3 hover:border-indigo">
                  <StatusPill status={l.status} />
                  <p className="font-display text-title font-bold">
                    {l.total_meals} <span className="text-body font-normal text-muted">{t("meals")}</span>
                  </p>
                  <p className="truncate text-small text-muted">{l.items.map((i) => i.name).join(", ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function ListingTile({ listing }: { listing: Listing }) {
  const { t } = useT();
  return (
    <Link to={`/donor/listings/${listing.id}`} className="tile flex flex-col gap-5 hover:border-indigo">
      <div className="flex items-start justify-between gap-4">
        <FoodSummary listing={listing} />
        <TimeRing from={listing.cooked_at} until={listing.pickup_by} size={84} caption={t("left")} expiredText={t("expired")} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={listing.status} />
        <VegMark veg={listing.veg} />
        {listing.receiver_org && <span className="text-small text-muted">{listing.receiver_org.name}</span>}
      </div>
      <StatusSteps status={listing.status} />
    </Link>
  );
}

// ---- Quick Post: tap tiles, not forms. Target: under a minute at 11 PM, one-handed. ----
const CATEGORIES: Category[] = ["rice_dish", "curry", "bread", "dry_snack", "sweet", "dairy_based", "salad_cut_fruit"];
const STORAGES: Storage[] = ["hot", "room", "chilled"];
const ALLERGENS: Allergen[] = ["nuts", "peanuts", "dairy", "gluten", "egg", "seafood", "soy", "sesame"];
const COOKED_AGO = [0, 30, 60, 120];
const STEP = 10;

export function QuickPost() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const post = usePostListing();
  const startedAt = useRef(Date.now());
  const now = useNow();

  const [items, setItems] = useState<Partial<Record<Category, number>>>({});
  const [storage, setStorage] = useState<Storage>("hot");
  const [ago, setAgo] = useState(30);
  const [veg, setVeg] = useState(true);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [earlierBy, setEarlierBy] = useState(0);

  // cooked_at is fixed at the moment a chip is chosen, so the guidance query stays stable.
  const cookedAt = useMemo(() => new Date(Date.now() - ago * 60_000).toISOString(), [ago]);
  const cats = CATEGORIES.filter((c) => items[c] !== undefined);
  const guidance = useGuidance(cats, storage, cookedAt, veg);
  const total = cats.reduce((s, c) => s + (items[c] ?? 0), 0);

  const maxPickup = guidance.data ? Date.parse(guidance.data.max_pickup_by) : null;
  const pickupBy = maxPickup ? maxPickup - earlierBy * 60_000 : null;
  const choices = [0, 30, 60].filter((m) => maxPickup !== null && maxPickup - m * 60_000 > now + 15 * 60_000);
  useEffect(() => {
    if (!choices.includes(earlierBy)) setEarlierBy(0);
  }, [choices, earlierBy]);

  const toggle = (c: Category) =>
    setItems((cur) => {
      const next = { ...cur };
      if (next[c] === undefined) next[c] = 50;
      else delete next[c];
      return next;
    });
  const bump = (c: Category, d: number) => setItems((cur) => ({ ...cur, [c]: Math.max(STEP, (cur[c] ?? 0) + d) }));

  const canPost = total > 0 && pickupBy !== null && pickupBy > now && !post.isPending;
  const submit = () => {
    if (!canPost || pickupBy === null) return;
    const list: ListingItem[] = cats.map((c) => ({ name: t(`cat_${c}` as TKey), category: c, qty_meals: items[c] ?? STEP }));
    post.mutate(
      { items: list, veg, allergens, storage, cooked_at: cookedAt, pickup_by: new Date(pickupBy).toISOString(), posted_in_ms: Date.now() - startedAt.current },
      { onSuccess: (l) => navigate(`/donor/listings/${l.id}`, { state: { justPosted: true } }) },
    );
  };
  const seconds = Math.floor((now - startedAt.current) / 1000);

  return (
    <>
      <PageHead title={t("navPost")}>
        <p className="mt-2 text-muted">{t("addFood")}</p>
      </PageHead>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <Group title={t("whatFood")}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((c) => {
                const on = items[c] !== undefined;
                return (
                  <li key={c} className={`flex flex-col rounded-tile border-2 transition-colors ${on ? "border-indigo bg-indigo-soft" : "border-line bg-surface"}`}>
                    <button type="button" aria-pressed={on} onClick={() => toggle(c)} className="flex min-h-24 flex-col items-start gap-3 p-4 text-left">
                      <span aria-hidden="true" className={`flex h-12 w-12 items-center justify-center rounded-chip text-2xl ${FOOD[c].tint}`}>
                        {FOOD[c].glyph}
                      </span>
                      <span className="font-semibold">{t(`cat_${c}` as TKey)}</span>
                    </button>
                    {on && (
                      <div className="flex items-center justify-between gap-2 border-t border-indigo/20 p-2">
                        <button type="button" aria-label={`${t(`cat_${c}` as TKey)} −${STEP}`} onClick={() => bump(c, -STEP)} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
                          <Minus className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="font-display text-title font-bold tabular-nums" aria-live="polite">
                          {items[c]}
                        </span>
                        <button type="button" aria-label={`${t(`cat_${c}` as TKey)} +${STEP}`} onClick={() => bump(c, STEP)} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
                          <Plus className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Group>

          <Group title={t("storage")}>
            <div className="grid grid-cols-3 gap-3">
              {STORAGES.map((s) => {
                const Icon = STORAGE_ICON[s];
                return (
                  <button key={s} type="button" aria-pressed={storage === s} onClick={() => setStorage(s)} className="chip min-h-20 flex-col justify-center text-center">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    {t(s)}
                  </button>
                );
              })}
            </div>
          </Group>

          <div className="grid gap-8 md:grid-cols-2">
            <Group title={t("cookedAt")}>
              <div className="flex flex-wrap gap-2">
                {COOKED_AGO.map((m) => (
                  <button key={m} type="button" aria-pressed={ago === m} onClick={() => setAgo(m)} className="chip">
                    {m === 0 ? t("justNow") : m < 60 ? t("minAgo", { n: m }) : t("hourAgo", { n: m / 60 })}
                  </button>
                ))}
              </div>
            </Group>
            <Group title={t("vegQ")}>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={veg} onClick={() => setVeg(true)} className="chip justify-center">
                  <VegMark veg /> {t("veg")}
                </button>
                <button type="button" aria-pressed={!veg} onClick={() => setVeg(false)} className="chip justify-center">
                  <VegMark veg={false} /> {t("nonveg")}
                </button>
              </div>
            </Group>
          </div>

          <Group title={t("allergens")}>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const on = allergens.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAllergens(on ? allergens.filter((x) => x !== a) : [...allergens, a])}
                    className="chip"
                  >
                    {t(`al_${a}` as TKey)}
                  </button>
                );
              })}
            </div>
          </Group>
        </div>

        {/* Summary: a sticky side tile on desktop, a bar in thumb reach on phones. */}
        <aside className="lg:col-span-4">
          <div className="fixed inset-x-0 bottom-16 z-10 border-t border-line bg-surface p-4 shadow-[0_-8px_24px_rgb(0_0_0/0.08)] lg:sticky lg:top-10 lg:rounded-hero lg:border lg:p-6 lg:shadow-none">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-headline font-bold leading-none">
                  {total} <span className="text-lead font-medium text-muted">{t("meals")}</span>
                </p>
                <p className="mt-2 text-small text-muted">
                  {t("pickupBy")}: <span className="font-semibold text-ink">{pickupBy ? clock(new Date(pickupBy).toISOString(), lang) : "–"}</span>
                </p>
              </div>
              <span className="rounded-full bg-sunken px-3 py-1 text-caption font-semibold tabular-nums" aria-label="time spent posting">
                {t("postTimer", { s: seconds })}
              </span>
            </div>
            {choices.length > 1 && (
              <div className="mt-4 hidden gap-2 lg:flex lg:flex-wrap">
                {choices.map((m) => (
                  <button key={m} type="button" aria-pressed={earlierBy === m} onClick={() => setEarlierBy(m)} className="chip">
                    {m === 0 ? t("latest") : t("earlier", { n: m })}
                  </button>
                ))}
              </div>
            )}
            {guidance.data && (
              <p className="mt-4 hidden text-small text-muted lg:block">{lang === "te" ? guidance.data.guidance_te : guidance.data.guidance_en}</p>
            )}
            <div className="mt-4">
              <ErrorNote error={post.error ?? guidance.error} />
            </div>
            <button className="btn-primary mt-4 w-full" disabled={!canPost} onClick={submit}>
              {t("postNow")}
            </button>
            <p className="mt-3 hidden text-caption text-muted lg:block">{t("disclaimer")}</p>
          </div>
        </aside>
      </div>
      <div className="h-40 lg:hidden" aria-hidden="true" />
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-title font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ListingDetail() {
  const { id = "" } = useParams();
  const { t, lang } = useT();
  const q = useListing(id);
  const cancel = useCancelListing();
  if (q.isLoading) return <Loading />;
  if (!q.data) return <ErrorNote error={q.error} onRetry={() => void q.refetch()} />;
  const l = q.data;
  const active = ACTIVE.has(l.status);

  return (
    <>
      <PageHead title={l.items.map((i) => i.name).join(", ")} />
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="tile flex flex-col gap-6 lg:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <FoodSummary listing={l} />
            {active ? (
              <TimeRing from={l.cooked_at} until={l.pickup_by} caption={t("left")} expiredText={t("expired")} />
            ) : (
              <StatusPill status={l.status} />
            )}
          </div>
          <StatusSteps status={l.status} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-chip bg-sunken p-4">
              <p className="text-caption text-muted">{t("matchedWith")}</p>
              <p className="mt-1 font-semibold">{l.receiver_org ? `${l.receiver_org.name}, ${l.receiver_org.area}` : t("waitingKitchen")}</p>
            </div>
            <div className="rounded-chip bg-sunken p-4">
              <p className="text-caption text-muted">{t("volunteerName")}</p>
              <p className="mt-1 font-semibold">{l.volunteer?.display_name ?? "–"}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          {l.pickup_code && active && <CodeDisplay code={l.pickup_code} label={t("pickupCode")} hint={t("pickupCodeHint")} />}
        </div>
        <div className="lg:col-span-7">
          <SafetyCard listing={l} />
        </div>
        <section className="tile lg:col-span-5" aria-labelledby="tl">
          <h2 id="tl" className="font-display text-title font-semibold">
            {t("timeline")}
          </h2>
          <ol className="mt-4 flex flex-col gap-4 border-l-2 border-line pl-5">
            {l.timeline?.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-indigo" aria-hidden="true" />
                <p className="font-semibold">{t(`status_${e.status}` as TKey)}</p>
                <p className="text-small text-muted">{clock(e.at, lang)}</p>
              </li>
            ))}
          </ol>
          {active && l.status !== "picked_up" && (
            <button className="btn-danger mt-6 w-full" disabled={cancel.isPending} onClick={() => cancel.mutate(l.id)}>
              {t("cancelListing")}
            </button>
          )}
          <div className="mt-4">
            <ErrorNote error={cancel.error} />
          </div>
        </section>
      </div>
    </>
  );
}
