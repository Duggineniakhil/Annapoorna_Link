import type { Allergen, Category, Status, Storage } from "../../types/api";
import { useT } from "../../i18n";
import { useNow } from "../../hooks/useNow";
import { Icon, type IconName } from "../ui/Icon";
import { formatClock, formatDuration } from "./format";

/** Indian food-packet style mark: green square + dot (veg) or brown square + triangle (non-veg). */
export function VegMark({ veg, withLabel = false }: { veg: boolean; withLabel?: boolean }) {
  const { t } = useT();
  const label = t(veg ? "food.veg" : "food.nonveg");
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/80">
      <svg
        viewBox="0 0 16 16"
        className={`h-4 w-4 shrink-0 ${veg ? "text-veg" : "text-nonveg"}`}
        role="img"
        aria-label={label}
      >
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="2"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        {veg ? (
          <circle cx="8" cy="8" r="3.6" fill="currentColor" />
        ) : (
          <path d="M8 4l4 7H4z" fill="currentColor" />
        )}
      </svg>
      {withLabel && label}
    </span>
  );
}

const STORAGE_ICON: Record<Storage, IconName> = { hot: "flame", room: "box", chilled: "snow" };

export function StorageTag({ storage }: { storage: Storage }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink/70">
      <Icon name={STORAGE_ICON[storage]} className="h-4 w-4" />
      {t(`storage.${storage}`)}
    </span>
  );
}

export function AllergenLine({ allergens }: { allergens: Allergen[] }) {
  const { t } = useT();
  if (allergens.length === 0) return null;
  const list = allergens.map((a) => t(`allergen.${a}`)).join(", ");
  return <p className="text-xs text-ink/70">{t("food.contains", { list })}</p>;
}

const CATEGORY_TILE: Record<Category, { emoji: string; bg: string }> = {
  rice_dish: { emoji: "🍛", bg: "bg-turmeric-100" },
  curry: { emoji: "🍲", bg: "bg-chilli-50" },
  bread: { emoji: "🫓", bg: "bg-turmeric-50" },
  dry_snack: { emoji: "🥟", bg: "bg-turmeric-100" },
  sweet: { emoji: "🍮", bg: "bg-chilli-50" },
  dairy_based: { emoji: "🥛", bg: "bg-leaf-50" },
  salad_cut_fruit: { emoji: "🥗", bg: "bg-leaf-50" },
};

/** Photo-free food tile: works at night, on slow networks, with no upload. */
export function CategoryTile({
  category,
  size = "md",
}: {
  category: Category;
  size?: "md" | "lg";
}) {
  const tile = CATEGORY_TILE[category];
  const dims = size === "lg" ? "h-16 w-16 text-4xl" : "h-14 w-14 text-3xl";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl ${tile.bg} ${dims}`}
    >
      {tile.emoji}
    </span>
  );
}

type Urgency = "ok" | "soon" | "urgent" | "passed";

function urgencyFor(msLeft: number, kind: "pickup" | "respond" | "deliver"): Urgency {
  if (msLeft <= 0) return "passed";
  if (kind === "respond") {
    // Offers stay open about 10 minutes (D5), so the bands are shorter.
    if (msLeft < 3 * 60_000) return "urgent";
    if (msLeft < 6 * 60_000) return "soon";
    return "ok";
  }
  // Same bands as the safety card (components/safety.ts): amber under 30 min, red under 10.
  if (msLeft < 10 * 60_000) return "urgent";
  if (msLeft < 30 * 60_000) return "soon";
  return "ok";
}

const URGENCY_CLASS: Record<Urgency, string> = {
  ok: "bg-leaf-50 text-leaf-800",
  soon: "bg-turmeric-100 text-turmeric-800",
  urgent: "bg-chilli-50 text-chilli-700",
  passed: "bg-gray-100 text-gray-600",
};

/**
 * Live "deadline" chip. Colour moves green → turmeric → chilli as time runs out.
 * `kind` picks the wording: pickup-by for food, respond-by for offers, deliver-by for tasks.
 */
export function Countdown({
  deadline,
  kind = "pickup",
  compact = false,
}: {
  deadline: string;
  kind?: "pickup" | "respond" | "deliver";
  compact?: boolean;
}) {
  const { t, lang } = useT();
  const now = useNow();
  const msLeft = new Date(deadline).getTime() - now;
  const urgency = urgencyFor(msLeft, kind);
  const left = formatDuration(msLeft, t);

  let text: string;
  if (urgency === "passed") {
    text = t(kind === "respond" ? "offer.moved" : "food.pickupPassed");
  } else if (kind === "respond") {
    text = t("offer.respondWithin", { time: left });
  } else {
    const label = t(kind === "deliver" ? "task.deliverBy" : "food.pickupBy", {
      time: formatClock(deadline, lang),
    });
    text = compact
      ? t("food.timeLeft", { time: left })
      : `${label} · ${t("food.timeLeft", { time: left })}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${URGENCY_CLASS[urgency]}`}
    >
      <Icon name="clock" className="h-4 w-4" />
      {text}
    </span>
  );
}

const STEP_KEYS = [
  "steps.posted",
  "steps.matched",
  "steps.volunteer",
  "steps.pickedUp",
  "steps.delivered",
] as const;

const STEP_INDEX: Partial<Record<Status, number>> = {
  posted: 0,
  offered: 0,
  claimed: 1,
  volunteer_assigned: 2,
  picked_up: 3,
  delivered: 4,
};

/** Five-step tracker so a donor sees where their food is without opening the listing. */
export function StatusSteps({ status }: { status: Status }) {
  const { t } = useT();
  const index = STEP_INDEX[status];
  if (index === undefined) {
    return <p className="text-sm font-bold text-gray-600">{t(`status.${status}`)}</p>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <ol className="flex gap-1" aria-label={t("steps.label")}>
        {STEP_KEYS.map((key, i) => (
          <li
            key={key}
            aria-current={i === index ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-leaf-600" : "bg-leaf-100"}`}
          >
            <span className="sr-only">{t(key)}</span>
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-1 text-sm font-bold text-leaf-800">
        {index === 4 && <Icon name="check" className="h-4 w-4" />}
        {t(`status.${status}`)}
        <span className="font-normal text-ink/70">
          · {t("steps.of", { n: index + 1, total: STEP_KEYS.length })}
        </span>
      </p>
    </div>
  );
}
