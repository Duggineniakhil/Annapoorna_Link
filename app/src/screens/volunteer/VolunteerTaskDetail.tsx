import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useParams } from "react-router-dom";
import { Screen } from "../../components/Screen";
import { SafetyCard } from "../../components/SafetyCard";
import { Countdown } from "../../components/food/FoodBits";
import { formatNumber } from "../../components/food/format";
import { Button, ButtonLink } from "../../components/ui/Button";
import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/en";
import { ApiError, deliverTask, getTask, submitPickupCode } from "../../services/api";
import { useLiveRefetch } from "../../hooks/useLiveEvents";
import { AreaMap } from "../../components/map/AreaMap";
import { routeBetween } from "../../components/map/route";
import type { Task } from "../../types/api";

// Volunteer task stepper: go to pickup, enter pickup code, go to delivery, enter delivery code.
// The task is refetched on live events (polling fallback) until it is delivered.

const CODE_LENGTH = 4;
const TOTAL_STEPS = 4;
const EMPTY_CODE: string[] = ["", "", "", ""];

type Step = 1 | 2 | 3 | 4;

const STEP_TITLE: Record<Step, MessageKey> = {
  1: "volunteer.step.pickup",
  2: "volunteer.step.pickupCode",
  3: "volunteer.step.delivery",
  4: "volunteer.step.deliveryCode",
};

type CodeError =
  | { kind: "wrong"; triesLeft: number }
  | { kind: "locked" }
  | { kind: "network" }
  | { kind: "generic" };

function toCodeError(err: unknown): CodeError {
  if (err instanceof ApiError) {
    if (err.error_code === "WRONG_CODE") return { kind: "wrong", triesLeft: err.tries_left ?? 0 };
    if (err.error_code === "CODE_LOCKED") return { kind: "locked" };
    // Network down or server busy: keep the typed code and offer Retry.
    if (err.retryable) return { kind: "network" };
    return { kind: "generic" };
  }
  return { kind: "generic" };
}

function isCodeComplete(digits: string[]): boolean {
  return digits.every((d) => /^\d$/.test(d));
}

function navigateTo(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    "_blank",
    "noopener",
  );
}

function Progress({ step }: { step: Step }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink/70">
        {t("steps.of", { n: step, total: TOTAL_STEPS })}
      </p>
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, k) => (
          <span
            key={k}
            className={`h-2 flex-1 rounded-full ${k < step ? "bg-leaf-800" : "bg-leaf-800/15"}`}
          />
        ))}
      </div>
    </div>
  );
}

function PlaceBlock({ label, name, area }: { label: string; name: string; area: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <p className="text-sm font-semibold text-ink/60">{label}</p>
      <p className="text-xl font-bold text-ink">{name}</p>
      <p className="text-ink/70">{area}</p>
    </div>
  );
}

// Four big digit boxes. Fully controlled: the parent owns the digits.
function CodeBoxes({
  digits,
  onChange,
  disabled,
  resetKey,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  resetKey: number;
}) {
  const { t } = useT();
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus box 1 on mount and whenever the parent clears the code after a wrong attempt.
  useEffect(() => {
    refs.current[0]?.focus();
  }, [resetKey]);

  function focusBox(i: number) {
    refs.current[i]?.focus();
  }

  function handleChange(i: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    const next = [...digits];
    // A box that already had a digit gets the new key (the last one). Several digits at once
    // (one-time-code autofill, keyboard suggestion) fill this box and the ones after it.
    const incoming =
      typed.length > 1 && digits[i] !== "" && typed.length === 2 ? typed.slice(-1) : typed;
    if (incoming.length <= 1) {
      next[i] = incoming;
      onChange(next);
      if (incoming && i < CODE_LENGTH - 1) focusBox(i + 1);
      return;
    }
    const spread = incoming.slice(0, CODE_LENGTH - i);
    for (let k = 0; k < spread.length; k += 1) next[i + k] = spread[k];
    onChange(next);
    focusBox(Math.min(i + spread.length, CODE_LENGTH - 1));
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && digits[i] === "" && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      onChange(next);
      focusBox(i - 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!text) return;
    e.preventDefault();
    onChange(EMPTY_CODE.map((_, k) => text[k] ?? ""));
    focusBox(Math.min(text.length, CODE_LENGTH - 1));
  }

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          aria-label={`${t("volunteer.code.label")} ${i + 1}`}
          className="h-20 w-16 rounded-2xl border-2 border-ink/20 text-center text-4xl font-bold text-ink focus:border-leaf-800 focus:outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}

function CodeErrorNotice({
  error,
  busy,
  onRetry,
}: {
  error: CodeError;
  busy: boolean;
  onRetry: () => void;
}) {
  const { t } = useT();
  const message =
    error.kind === "wrong"
      ? t("volunteer.pickup.wrongCode", { n: error.triesLeft })
      : error.kind === "locked"
        ? t("volunteer.pickup.locked")
        : error.kind === "network"
          ? t("volunteer.error.network")
          : t("volunteer.error.generic");
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-chilli-50 p-4 text-chilli-700">
      <p className="font-semibold">{message}</p>
      {error.kind === "network" && (
        <Button
          variant="secondary"
          size="lg"
          block
          className="py-4"
          onClick={onRetry}
          disabled={busy}
        >
          {t("volunteer.retry")}
        </Button>
      )}
    </div>
  );
}

export default function VolunteerTaskDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, lang } = useT();

  const [task, setTask] = useState<Task | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [localStep, setLocalStep] = useState<Step>(1);

  const [pickupDigits, setPickupDigits] = useState<string[]>(EMPTY_CODE);
  const [pickupBusy, setPickupBusy] = useState(false);
  const [pickupError, setPickupError] = useState<CodeError | null>(null);
  const [pickupReset, setPickupReset] = useState(0);

  const [deliverDigits, setDeliverDigits] = useState<string[]>(EMPTY_CODE);
  const [mealsInput, setMealsInput] = useState<string | null>(null);
  const [deliverBusy, setDeliverBusy] = useState(false);
  const [deliverError, setDeliverError] = useState<CodeError | null>(null);
  const [deliverReset, setDeliverReset] = useState(0);
  const [deliveredMeals, setDeliveredMeals] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setTask(await getTask(id));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [id]);

  const done = deliveredMeals !== null || task?.status === "delivered";

  useEffect(() => {
    void load();
  }, [load]);

  const refetchIfOpen = () => {
    if (!done) void load();
  };
  // Live events are about listings, so match on the task's listing id.
  useLiveRefetch(refetchIfOpen, task?.listing.id);

  if (!task) {
    return (
      <Screen titleKey="volunteer.task.title">
        {loadFailed ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl bg-chilli-50 p-4 text-chilli-700"
          >
            <p className="font-semibold">{t("volunteer.error.generic")}</p>
            <Button
              variant="secondary"
              size="lg"
              block
              className="py-4"
              onClick={() => void load()}
            >
              {t("volunteer.retry")}
            </Button>
          </div>
        ) : (
          <p className="text-ink/60">{t("volunteer.task.loading")}</p>
        )}
      </Screen>
    );
  }

  if (done) {
    const meals = deliveredMeals ?? task.meals;
    return (
      <Screen
        titleKey="volunteer.task.title"
        title={t("volunteer.delivered.title", { n: formatNumber(meals, lang) })}
      >
        <ButtonLink to="/volunteer" size="lg" block className="py-4">
          {t("volunteer.delivery.back")}
        </ButtonLink>
      </Screen>
    );
  }

  // A picked-up task always shows at least step 3, even if this page was opened after pickup.
  const step: Step = task.status === "picked_up" && localStep < 3 ? 3 : localStep;

  const pickupLocked = pickupError?.kind === "locked";

  async function submitPickup() {
    if (!task) return;
    setPickupBusy(true);
    setPickupError(null);
    try {
      await submitPickupCode(task.id, pickupDigits.join(""));
      setTask(await getTask(task.id));
      setLocalStep(3);
    } catch (err) {
      const e = toCodeError(err);
      setPickupError(e);
      if (e.kind === "wrong") {
        setPickupDigits(EMPTY_CODE);
        setPickupReset((n) => n + 1);
      }
    } finally {
      setPickupBusy(false);
    }
  }

  const mealsValue = mealsInput ?? String(task.meals);
  const mealsNumber = Number(mealsValue);
  const mealsValid = Number.isInteger(mealsNumber) && mealsNumber >= 1 && mealsNumber <= task.meals;
  const deliverLocked = deliverError?.kind === "locked";

  async function submitDelivery() {
    if (!task || !mealsValid) return;
    setDeliverBusy(true);
    setDeliverError(null);
    try {
      await deliverTask(task.id, {
        code: deliverDigits.join(""),
        meals_delivered: mealsNumber,
      });
      setDeliveredMeals(mealsNumber);
    } catch (err) {
      const e = toCodeError(err);
      setDeliverError(e);
      if (e.kind === "wrong") {
        setDeliverDigits(EMPTY_CODE);
        setDeliverReset((n) => n + 1);
      }
    } finally {
      setDeliverBusy(false);
    }
  }

  // Steps 1 and 3: pickup and drop areas with the line between them.
  const route = routeBetween(task.pickup, task.delivery, task.distance_km);

  return (
    <Screen
      titleKey={STEP_TITLE[step]}
      title={t(STEP_TITLE[step])}
      eyebrow={<Progress step={step} />}
    >
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <PlaceBlock label={t("task.from")} name={task.pickup.name} area={task.pickup.area} />
          {route && (
            <AreaMap
              points={route.points}
              lines={route.lines}
              distanceKm={route.distanceKm}
              label={t("map.label")}
            />
          )}
          <Button
            variant="secondary"
            size="lg"
            block
            className="py-4"
            onClick={() => navigateTo(task.pickup.lat, task.pickup.lng)}
          >
            {t("volunteer.navigate")}
          </Button>
          <SafetyCard listing={task.listing} variant="full" />
          <Button size="lg" block className="py-4" onClick={() => setLocalStep(2)}>
            {t("volunteer.pickup.toCode")}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <CodeBoxes
            digits={pickupDigits}
            onChange={setPickupDigits}
            disabled={pickupBusy || pickupLocked}
            resetKey={pickupReset}
          />
          {pickupError && (
            <CodeErrorNotice
              error={pickupError}
              busy={pickupBusy}
              onRetry={() => void submitPickup()}
            />
          )}
          <Button
            size="lg"
            block
            className="py-4"
            onClick={() => void submitPickup()}
            disabled={!isCodeComplete(pickupDigits) || pickupBusy || pickupLocked}
          >
            {t("volunteer.pickup.submit")}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <PlaceBlock label={t("task.to")} name={task.delivery.name} area={task.delivery.area} />
          <Countdown deadline={task.delivery.serve_by} kind="deliver" />
          {route && (
            <AreaMap
              points={route.points}
              lines={route.lines}
              distanceKm={route.distanceKm}
              label={t("map.label")}
            />
          )}
          <Button
            variant="secondary"
            size="lg"
            block
            className="py-4"
            onClick={() => navigateTo(task.delivery.lat, task.delivery.lng)}
          >
            {t("volunteer.navigate")}
          </Button>
          <Button size="lg" block className="py-4" onClick={() => setLocalStep(4)}>
            {t("volunteer.delivery.toCode")}
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <CodeBoxes
            digits={deliverDigits}
            onChange={setDeliverDigits}
            disabled={deliverBusy || deliverLocked}
            resetKey={deliverReset}
          />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink/70">{t("volunteer.meals.label")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={task.meals}
              step={1}
              value={mealsValue}
              onChange={(e) => setMealsInput(e.target.value)}
              disabled={deliverBusy || deliverLocked}
              className="h-16 rounded-2xl border-2 border-ink/20 px-4 text-center text-3xl font-bold text-ink"
            />
          </label>
          {!mealsValid && (
            <p role="alert" className="text-sm font-semibold text-chilli-700">
              {t("volunteer.meals.invalid", { max: task.meals })}
            </p>
          )}
          {deliverError && (
            <CodeErrorNotice
              error={deliverError}
              busy={deliverBusy}
              onRetry={() => void submitDelivery()}
            />
          )}
          <Button
            size="lg"
            block
            className="py-4"
            onClick={() => void submitDelivery()}
            disabled={!isCodeComplete(deliverDigits) || !mealsValid || deliverBusy || deliverLocked}
          >
            {t("volunteer.delivery.submit")}
          </Button>
        </div>
      )}
    </Screen>
  );
}
