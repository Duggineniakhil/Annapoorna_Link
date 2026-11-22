import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Allergen, Category, Listing, Storage, VoiceDraft } from "../../types/api";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { useNow } from "../../hooks/useNow";
import { apiRequest, userMessage } from "../../services/api";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Icon, type IconName } from "../../components/ui/Icon";
import { VegMark } from "../../components/food/FoodBits";
import { VoicePost } from "../../components/VoicePost";
import { formatClock, formatDuration } from "../../components/food/format";
import { maxPickupBy } from "../../lib/quickPost";
import {
  ALL_ALLERGENS,
  CATEGORY_ORDER,
  DISHES,
  allergensFromName,
  defaultAllergens,
  detectNonVeg,
  listingIsVeg,
  mealsFromKg,
  postedInMs,
  type Dish,
} from "../../lib/dishes";
import {
  floorToMinute,
  futureFromTimeValue,
  pastFromTimeValue,
  toTimeValue,
} from "../../lib/timeInput";

const MIN = 60_000;
const LAST_POST_KEY = (orgId: string) => `annapoorna.lastPost.${orgId}`;

type DraftItem = {
  key: string;
  dishId?: string;
  name: string;
  name_te?: string;
  category: Category;
  veg: boolean;
  allergens: Allergen[];
  qtyMeals: number;
  useKg: boolean;
  qtyKg: number;
};

type LastPost = {
  items: DraftItem[];
  storage: Storage;
  extraAllergens: Allergen[];
  removedAllergens: Allergen[];
  vegOverride: boolean | null;
};

type Guidance = {
  max_pickup_by: string;
  serve_by: string;
  guidance_en: string;
  guidance_te: string;
};

type PickupChoice = { kind: "latest" } | { kind: "custom"; at: number };

const STORAGES: { value: Storage; icon: IconName }[] = [
  { value: "hot", icon: "flame" },
  { value: "room", icon: "box" },
  { value: "chilled", icon: "snow" },
];

const COOKED_PRESETS = [0, 30, 60, 120] as const;

function readLastPost(orgId: string | undefined): LastPost | null {
  if (!orgId) return null;
  try {
    const raw = localStorage.getItem(LAST_POST_KEY(orgId));
    return raw ? (JSON.parse(raw) as LastPost) : null;
  } catch {
    return null;
  }
}

function itemMeals(item: DraftItem): number {
  return item.useKg ? mealsFromKg(item.qtyKg) : item.qtyMeals;
}

let keySeq = 0;
const newKey = () => `item-${Date.now()}-${keySeq++}`;

/** Numbered section with a heading, used for each step of the form. */
function Step({
  n,
  title,
  hint,
  aside,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-800 text-sm font-bold text-white"
          >
            {n}
          </span>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-tight text-ink">{title}</h2>
            {hint && <p className="text-sm text-ink/70">{hint}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Selectable pill used for quick choices (cooked at, pickup by, allergens). */
function Pill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-12 rounded-full px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-leaf-800 text-white"
          : "bg-white text-leaf-800 ring-1 ring-inset ring-leaf-800/30 hover:bg-leaf-50"
      }`}
    >
      {children}
    </button>
  );
}

function QuantityRow({
  item,
  onChange,
  onRemove,
}: {
  item: DraftItem;
  onChange: (patch: Partial<DraftItem>) => void;
  onRemove: () => void;
}) {
  const { t, lang } = useT();
  const label = lang === "te" && item.name_te ? item.name_te : item.name;
  const step = (delta: number) =>
    item.useKg
      ? onChange({ qtyKg: Math.max(0, Math.round((item.qtyKg + delta) * 10) / 10) })
      : onChange({ qtyMeals: Math.max(0, item.qtyMeals + delta) });
  const value = item.useKg ? item.qtyKg : item.qtyMeals;

  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
          <VegMark veg={item.veg} />
          <span className="truncate">{label}</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("post.remove", { name: label })}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-chilli-50 hover:text-chilli-700"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ×
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(item.useKg ? -5 : -10)}
          aria-label={t("post.minus")}
          className="h-12 w-14 shrink-0 rounded-xl bg-leaf-50 text-lg font-bold text-leaf-800"
        >
          −{item.useKg ? 5 : 10}
        </button>
        <input
          type="number"
          inputMode={item.useKg ? "decimal" : "numeric"}
          min={0}
          step={item.useKg ? 0.5 : 1}
          value={value === 0 ? "" : value}
          placeholder="0"
          aria-label={t(item.useKg ? "post.kgLabel" : "post.mealsLabel", { name: label })}
          onChange={(e) => {
            const n = Number(e.target.value);
            const safe = Number.isFinite(n) && n > 0 ? n : 0;
            onChange(item.useKg ? { qtyKg: safe } : { qtyMeals: Math.round(safe) });
          }}
          className="h-12 min-w-0 flex-1 rounded-xl border-0 bg-cream text-center text-xl font-bold text-ink ring-1 ring-inset ring-ink/10 focus:ring-2 focus:ring-leaf-700"
        />
        <button
          type="button"
          onClick={() => step(item.useKg ? 5 : 10)}
          aria-label={t("post.plus")}
          className="h-12 w-14 shrink-0 rounded-xl bg-leaf-50 text-lg font-bold text-leaf-800"
        >
          +{item.useKg ? 5 : 10}
        </button>
        <span className="w-14 shrink-0 text-sm font-medium text-ink/70">
          {item.useKg ? "kg" : t("common.meals")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-ink/70">
          {item.useKg && item.qtyKg > 0 ? t("post.kgEquals", { n: mealsFromKg(item.qtyKg) }) : ""}
        </span>
        <button
          type="button"
          onClick={() =>
            onChange(
              item.useKg
                ? { useKg: false, qtyMeals: item.qtyMeals || mealsFromKg(item.qtyKg) }
                : { useKg: true },
            )
          }
          className="min-h-12 px-1 font-bold text-leaf-700 underline-offset-2 hover:underline"
        >
          {t(item.useKg ? "post.useMeals" : "post.useKg")}
        </button>
      </div>
    </li>
  );
}

function OtherDishForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: DraftItem) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("curry");
  const nonVeg = detectNonVeg(name);
  const trimmed = name.trim();

  return (
    <Card className="flex flex-col gap-3 p-4">
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("post.otherName")}
        <input
          type="text"
          value={name}
          autoFocus
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-xl border-0 bg-cream px-3 text-base font-normal ring-1 ring-inset ring-ink/10 focus:ring-2 focus:ring-leaf-700"
        />
      </label>
      {nonVeg && (
        <p className="flex items-center gap-2 text-sm text-ink/70">
          <VegMark veg={false} /> {t("post.otherNonVeg")}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("post.otherCategory")}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="h-12 rounded-xl border-0 bg-cream px-3 text-base font-normal ring-1 ring-inset ring-ink/10 focus:ring-2 focus:ring-leaf-700"
        >
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {t(`post.category.${c}`)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <Button
          disabled={trimmed.length === 0}
          onClick={() =>
            onAdd({
              key: newKey(),
              name: trimmed,
              category,
              veg: !nonVeg,
              allergens: allergensFromName(trimmed),
              qtyMeals: 20,
              useKg: false,
              qtyKg: 0,
            })
          }
        >
          {t("post.otherAdd")}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t("post.cancelOther")}
        </Button>
      </div>
    </Card>
  );
}

export default function DonorPost() {
  const { t, lang } = useT();
  const { org } = useAuth();
  const navigate = useNavigate();
  const nowMs = useNow(15_000);
  const openedAt = useRef(Date.now());

  const [items, setItems] = useState<DraftItem[]>([]);
  const [storage, setStorage] = useState<Storage>("hot");
  const [cookedAt, setCookedAt] = useState(() => floorToMinute(new Date(Date.now() - 30 * MIN)));
  const [cookedPreset, setCookedPreset] = useState<number | "custom">(30);
  const [pickup, setPickup] = useState<PickupChoice>({ kind: "latest" });
  const [clampedNote, setClampedNote] = useState(false);
  const [vegOverride, setVegOverride] = useState<boolean | null>(null);
  const [extraAllergens, setExtraAllergens] = useState<Allergen[]>([]);
  const [removedAllergens, setRemovedAllergens] = useState<Allergen[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [repeated, setRepeated] = useState(false);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastPost = useMemo(() => readLastPost(org?.id), [org?.id]);

  // --- derived values ---------------------------------------------------------------
  const anyNonVegItem = items.some((i) => !i.veg);
  // Any non-veg dish forces non-veg; otherwise veg unless the donor says it isn't.
  const veg = listingIsVeg(items) ? (vegOverride ?? true) : false;
  const allergens = useMemo(() => {
    const set = new Set<Allergen>([...defaultAllergens(items), ...extraAllergens]);
    removedAllergens.forEach((a) => set.delete(a));
    return ALL_ALLERGENS.filter((a) => set.has(a));
  }, [items, extraAllergens, removedAllergens]);
  const meals = items.reduce((sum, i) => sum + itemMeals(i), 0);
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  // Strictest window, computed locally (instant) and from /api/guidance (authoritative).
  const localMax = maxPickupBy(
    cookedAt,
    storage,
    items.length > 0
      ? items.map((i) => ({ category: i.category, veg: i.veg && veg }))
      : [{ category: "rice_dish", veg: true }],
  ).getTime();
  const apiMax = guidance ? new Date(guidance.max_pickup_by).getTime() : Infinity;
  const maxMs = floorToMinute(new Date(Math.min(localMax, apiMax))).getTime();
  const windowPassed = maxMs <= nowMs;
  const pickupMs = pickup.kind === "latest" ? maxMs : Math.min(pickup.at, maxMs);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams({
        categories: (categories.length > 0 ? categories : ["rice_dish"]).join(","),
        storage,
        cooked_at: cookedAt.toISOString(),
      });
      if (!veg) params.set("nonveg", "true");
      apiRequest<Guidance>("GET", `/api/guidance?${params.toString()}`)
        .then(setGuidance)
        .catch(() => setGuidance(null)); // local rules still apply
    }, 250);
    return () => window.clearTimeout(id);
  }, [categories, storage, cookedAt, veg]);

  // --- actions -------------------------------------------------------------------------
  const addDish = (dish: Dish) => {
    setItems((prev) =>
      prev.some((i) => i.dishId === dish.id)
        ? prev.filter((i) => i.dishId !== dish.id)
        : [
            ...prev,
            {
              key: newKey(),
              dishId: dish.id,
              name: dish.name,
              name_te: dish.name_te,
              category: dish.category,
              veg: dish.veg,
              allergens: dish.allergens,
              qtyMeals: 20,
              useKg: false,
              qtyKg: 0,
            },
          ],
    );
  };

  const patchItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const toggleAllergen = (a: Allergen) => {
    if (allergens.includes(a)) {
      setExtraAllergens((prev) => prev.filter((x) => x !== a));
      setRemovedAllergens((prev) => [...prev, a]);
    } else {
      setRemovedAllergens((prev) => prev.filter((x) => x !== a));
      setExtraAllergens((prev) => [...prev, a]);
    }
  };

  const setCooked = (minutesAgo: number) => {
    setCookedPreset(minutesAgo);
    setCookedAt(floorToMinute(new Date(Date.now() - minutesAgo * MIN)));
  };

  const choosePickup = (at: number) => {
    setClampedNote(at > maxMs);
    setPickup({ kind: "custom", at: Math.min(at, maxMs) });
  };

  const repeatLast = () => {
    if (!lastPost) return;
    setItems(lastPost.items.map((i) => ({ ...i, key: newKey() })));
    setStorage(lastPost.storage);
    setExtraAllergens(lastPost.extraAllergens);
    setRemovedAllergens(lastPost.removedAllergens);
    setVegOverride(lastPost.vegOverride);
    setRepeated(true);
  };

  /**
   * Voice post (A12): prefill the form from the draft. Known dishes light up their chips; anything
   * else becomes an "other" item. The donor still reviews it and taps Post.
   */
  const applyDraft = (draft: VoiceDraft) => {
    const next: DraftItem[] = draft.items.map((item) => {
      const name = item.name.trim();
      const dish = DISHES.find(
        (d) => d.name.toLowerCase() === name.toLowerCase() || d.name_te === name,
      );
      const base = dish
        ? {
            dishId: dish.id,
            name: dish.name,
            name_te: dish.name_te,
            category: dish.category,
            veg: dish.veg,
            allergens: dish.allergens,
          }
        : {
            name,
            category: item.category,
            veg: draft.veg && !detectNonVeg(name),
            allergens: allergensFromName(name),
          };
      return {
        key: newKey(),
        ...base,
        qtyMeals: item.qty_meals,
        useKg: item.qty_kg !== undefined,
        qtyKg: item.qty_kg ?? 0,
      };
    });
    setItems(next);
    setStorage(draft.storage);
    const cooked = new Date(draft.cooked_at);
    if (!Number.isNaN(cooked.getTime()) && cooked.getTime() <= Date.now()) {
      setCookedAt(floorToMinute(cooked));
      setCookedPreset("custom");
    }
    // Allergens are stored as changes from the dishes' defaults.
    const defaults = defaultAllergens(next);
    setExtraAllergens(draft.allergens.filter((a) => !defaults.includes(a)));
    setRemovedAllergens(defaults.filter((a) => !draft.allergens.includes(a)));
    setVegOverride(listingIsVeg(next) && !draft.veg ? false : null);
    setPickup({ kind: "latest" });
    setClampedNote(false);
    setRepeated(false);
    setError(null);
  };

  const canSubmit =
    !submitting && !windowPassed && items.length > 0 && items.every((i) => itemMeals(i) > 0);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const elapsed = postedInMs(openedAt.current, Date.now());
    try {
      const listing = await apiRequest<Listing>("POST", "/api/listings", {
        items: items.map((i) => ({
          name: i.name,
          category: i.category,
          qty_meals: itemMeals(i),
          ...(i.useKg ? { qty_kg: i.qtyKg } : {}),
        })),
        veg,
        allergens,
        storage,
        cooked_at: cookedAt.toISOString(),
        pickup_by: new Date(pickupMs).toISOString(),
        posted_in_ms: elapsed,
      });
      if (org) {
        const saved: LastPost = { items, storage, extraAllergens, removedAllergens, vegOverride };
        try {
          localStorage.setItem(LAST_POST_KEY(org.id), JSON.stringify(saved));
        } catch {
          // Storage unavailable; repeat-last-post just won't be offered.
        }
      }
      navigate(`/donor/listings/${listing.id}`, { state: { postedInMs: elapsed } });
    } catch (err) {
      setError(userMessage(err));
      setSubmitting(false);
    }
  };

  // --- render --------------------------------------------------------------------------
  const clock = (ms: number) => formatClock(new Date(ms).toISOString(), lang);
  const summary =
    items.length === 0
      ? t("post.summaryEmpty")
      : t("post.summary", {
          meals,
          veg: t(veg ? "food.veg" : "food.nonveg"),
          storage: t(`storage.${storage}`),
          time: clock(pickupMs),
        });

  return (
    <Screen
      titleKey="donor.post.title"
      eyebrow={
        org ? (
          <span className="flex items-center gap-1 text-sm font-medium text-ink/70">
            <Icon name="pin" className="h-4 w-4" />
            {t("post.venue", { name: org.name, area: org.area })}
          </span>
        ) : undefined
      }
    >
      {lastPost && (
        <Button variant="secondary" onClick={repeatLast} className="self-start">
          <Icon name="history" className="h-5 w-5" />
          {t("post.repeat")}
        </Button>
      )}
      <VoicePost onDraft={applyDraft} />
      {repeated && (
        <p role="status" className="rounded-2xl bg-leaf-50 p-3 text-sm font-medium text-leaf-900">
          {t("post.repeated")}
        </p>
      )}

      {/* 1. Food */}
      <Step n={1} title={t("post.step.food")} hint={t("post.step.foodHint")}>
        <div className="flex flex-col gap-3">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-ink/70">
                {t(`post.category.${category}`)}
              </span>
              <div className="flex flex-wrap gap-2">
                {DISHES.filter((d) => d.category === category).map((dish) => {
                  const active = items.some((i) => i.dishId === dish.id);
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => addDish(dish)}
                      className={`flex min-h-12 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors ${
                        active
                          ? "bg-leaf-800 text-white"
                          : "bg-white text-ink ring-1 ring-inset ring-ink/15 hover:bg-leaf-50"
                      }`}
                    >
                      {active ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        <VegMark veg={dish.veg} />
                      )}
                      {lang === "te" ? dish.name_te : dish.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {showOther ? (
            <OtherDishForm
              onAdd={(item) => {
                setItems((prev) => [...prev, item]);
                setShowOther(false);
              }}
              onCancel={() => setShowOther(false)}
            />
          ) : (
            <Button variant="ghost" onClick={() => setShowOther(true)} className="self-start">
              <Icon name="plus" className="h-5 w-5" />
              {t("post.other")}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-ink/70">{t("post.noItems")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <QuantityRow
                key={item.key}
                item={item}
                onChange={(patch) => patchItem(item.key, patch)}
                onRemove={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
              />
            ))}
          </ul>
        )}
      </Step>

      {/* 2. Storage */}
      <Step n={2} title={t("post.step.storage")}>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={t("post.step.storage")}
        >
          {STORAGES.map(({ value, icon }) => {
            const active = storage === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setStorage(value)}
                className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center transition-colors ${
                  active
                    ? "bg-leaf-800 text-white shadow-card"
                    : "bg-white text-ink ring-1 ring-inset ring-ink/10 hover:bg-leaf-50"
                }`}
              >
                <Icon name={icon} className="h-7 w-7" />
                <span className="font-bold leading-tight">{t(`storage.${value}`)}</span>
                <span
                  className={`text-xs leading-tight ${active ? "text-white/80" : "text-ink/70"}`}
                >
                  {t(`post.storageHint.${value}`)}
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 3. Cooked at */}
      <Step n={3} title={t("post.step.cooked")}>
        <div className="flex flex-wrap gap-2">
          {COOKED_PRESETS.map((m) => (
            <Pill key={m} active={cookedPreset === m} onClick={() => setCooked(m)}>
              {m === 0
                ? t("post.cooked.now")
                : t("post.cooked.ago", { time: formatDuration(m * MIN, t) })}
            </Pill>
          ))}
          <label
            className={`flex min-h-12 items-center gap-2 rounded-full px-3 text-sm font-bold ring-1 ring-inset ${
              cookedPreset === "custom"
                ? "bg-leaf-800 text-white ring-leaf-800"
                : "bg-white text-leaf-800 ring-leaf-800/30"
            }`}
          >
            <Icon name="clock" className="h-4 w-4" />
            <span className="sr-only">{t("post.cooked.custom")}</span>
            <input
              type="time"
              value={toTimeValue(cookedAt)}
              onChange={(e) => {
                const d = pastFromTimeValue(e.target.value, new Date());
                if (d) {
                  setCookedPreset("custom");
                  setCookedAt(d);
                }
              }}
              className="border-0 bg-transparent p-0 text-sm font-bold focus:ring-0"
            />
          </label>
        </div>
      </Step>

      {/* 4. Pickup by */}
      <Step n={4} title={t("post.step.pickup")}>
        {windowPassed ? (
          <p role="alert" className="rounded-2xl bg-chilli-50 p-4 font-bold text-chilli-700">
            {t("post.windowPassed")}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1 rounded-2xl bg-leaf-50 p-4">
              <span className="flex items-center gap-2 text-lg font-bold text-leaf-900">
                <Icon name="clock" className="h-5 w-5" />
                {t("post.latestSafe", { time: clock(maxMs) })}
              </span>
              <span className="text-sm text-leaf-900/80">{t("post.latestSafeHint")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill
                active={pickup.kind === "latest"}
                onClick={() => {
                  setClampedNote(false);
                  setPickup({ kind: "latest" });
                }}
              >
                {t("post.pickup.latest")}
              </Pill>
              {[30, 60].map((m) => {
                const at = floorToMinute(new Date(nowMs + m * MIN)).getTime();
                return (
                  <Pill
                    key={m}
                    active={pickup.kind === "custom" && pickup.at === at}
                    disabled={at > maxMs}
                    onClick={() => choosePickup(at)}
                  >
                    {t("post.pickup.in", { time: formatDuration(m * MIN, t) })}
                  </Pill>
                );
              })}
              <label className="flex min-h-12 items-center gap-2 rounded-full bg-white px-3 text-sm font-bold text-leaf-800 ring-1 ring-inset ring-leaf-800/30">
                <Icon name="clock" className="h-4 w-4" />
                <span className="sr-only">{t("post.step.pickup")}</span>
                <input
                  type="time"
                  value={toTimeValue(new Date(pickupMs))}
                  max={toTimeValue(new Date(maxMs))}
                  onChange={(e) => {
                    const d = futureFromTimeValue(e.target.value, new Date());
                    if (d) choosePickup(d.getTime());
                  }}
                  className="border-0 bg-transparent p-0 text-sm font-bold focus:ring-0"
                />
              </label>
            </div>
            {clampedNote && (
              <p role="status" className="text-sm font-medium text-turmeric-800">
                {t("post.pickup.clamped")}
              </p>
            )}
          </>
        )}
      </Step>

      {/* 5. Veg */}
      <Step n={5} title={t("post.step.veg")}>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("post.step.veg")}>
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={veg === option}
              disabled={option && anyNonVegItem}
              onClick={() => setVegOverride(option)}
              className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                veg === option
                  ? "bg-white ring-2 ring-leaf-800"
                  : "bg-white ring-1 ring-inset ring-ink/10"
              }`}
            >
              <VegMark veg={option} />
              {t(option ? "food.veg" : "food.nonveg")}
            </button>
          ))}
        </div>
        {anyNonVegItem && <p className="text-sm text-ink/70">{t("post.vegLocked")}</p>}
      </Step>

      {/* 6. Allergens */}
      <Step n={6} title={t("post.step.allergens")} hint={t("post.step.allergensHint")}>
        <div className="flex flex-wrap gap-2">
          {ALL_ALLERGENS.map((a) => (
            <Pill key={a} active={allergens.includes(a)} onClick={() => toggleAllergen(a)}>
              {t(`allergen.${a}`)}
            </Pill>
          ))}
        </div>
      </Step>

      {/* Safety preview (full safety card arrives in A6) */}
      {guidance && (
        <Card className="flex flex-col gap-2 p-4">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Icon name="info" className="h-5 w-5 text-leaf-700" />
            {t("post.safetyTitle")}
          </h2>
          <p className="text-sm text-ink/80">
            {lang === "te" ? guidance.guidance_te : guidance.guidance_en}
          </p>
          <p className="text-xs text-ink/70">{t("about.disclaimer")}</p>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-3 font-medium text-chilli-700">
          {error}
        </p>
      )}

      {/* Space so the sticky bar never covers the last step. */}
      <div aria-hidden="true" className="h-24" />

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 border-t border-ink/5 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-ink" aria-live="polite">
            {summary}
          </p>
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="shrink-0"
          >
            {t(submitting ? "post.submitting" : "post.submit")}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
