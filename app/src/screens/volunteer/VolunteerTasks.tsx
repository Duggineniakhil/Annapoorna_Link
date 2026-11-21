import { useCallback, useEffect, useState } from "react";
import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/en";
import { useAuth } from "../../auth/AuthContext";
import type { Task } from "../../types/api";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Countdown } from "../../components/food/FoodBits";
import { formatNumber } from "../../components/food/format";
import {
  ApiError,
  acceptTask,
  getVolunteerAvailability,
  listTasks,
  setVolunteerAvailability,
} from "../../services/api";
import { useLiveRefetch } from "../../hooks/useLiveEvents";

type AcceptFailureKind = "notOpen" | "alreadyActive" | "network" | "generic";
type AcceptFailure = { id: string; kind: AcceptFailureKind };

const FAILURE_KEY: Record<AcceptFailureKind, MessageKey> = {
  notOpen: "volunteer.error.taskNotOpen",
  alreadyActive: "volunteer.error.alreadyActive",
  network: "volunteer.error.network",
  generic: "volunteer.error.generic",
};

function failureKind(err: unknown): AcceptFailureKind {
  if (err instanceof ApiError) {
    if (err.error_code === "TASK_NOT_OPEN") return "notOpen";
    if (err.error_code === "TASK_ALREADY_ACTIVE") return "alreadyActive";
    return "generic";
  }
  // Offline / network failure surfaces as a plain TypeError from apiRequest.
  if (err instanceof TypeError) return "network";
  return "generic";
}

function AvailabilitySwitch({
  on,
  onChange,
}: {
  on: boolean | null;
  onChange: (next: boolean) => void;
}) {
  const { t } = useT();
  const isOn = on === true;
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex flex-col">
        <span className="font-bold text-ink">{t("volunteer.availability.label")}</span>
        <span className="text-sm text-ink/60">
          {t(isOn ? "volunteer.availableOn" : "volunteer.availableOff")}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={t("volunteer.availability.label")}
        disabled={on === null}
        onClick={() => onChange(!isOn)}
        className={`relative h-9 w-16 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          isOn ? "bg-leaf-700" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
            isOn ? "left-8" : "left-1"
          }`}
        />
      </button>
    </Card>
  );
}

function ActiveCard({ task }: { task: Task }) {
  const { t, lang } = useT();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-lg font-bold text-ink">{t("volunteer.active.title")}</h2>
      <p className="font-bold leading-snug text-ink">
        {t("volunteer.task.route", { from: task.pickup.area, to: task.delivery.area })}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
        <span>{t("volunteer.task.meals", { count: formatNumber(task.meals, lang) })}</span>
        <span aria-hidden="true">·</span>
        <span>{t("volunteer.task.distance", { km: formatNumber(task.distance_km, lang) })}</span>
      </div>
      <ButtonLink to={`/volunteer/tasks/${task.id}`} size="lg" block>
        <Icon name="bike" className="h-6 w-6" />
        {t("volunteer.task.title")}
      </ButtonLink>
    </Card>
  );
}

function OpenTaskCard({
  task,
  disabled,
  busy,
  onAccept,
}: {
  task: Task;
  disabled: boolean;
  busy: boolean;
  onAccept: (id: string) => void;
}) {
  const { t, lang } = useT();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="font-bold leading-snug text-ink">
        {t("volunteer.task.route", { from: task.pickup.area, to: task.delivery.area })}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
        <span className="rounded-full bg-leaf-50 px-3 py-1 font-bold text-leaf-800">
          {t("volunteer.task.meals", { count: formatNumber(task.meals, lang) })}
        </span>
        <span className="rounded-full bg-leaf-50 px-3 py-1 font-bold text-leaf-800">
          {t("volunteer.task.distance", { km: formatNumber(task.distance_km, lang) })}
        </span>
        <Countdown deadline={task.deadline} kind="pickup" compact />
      </div>
      <p className="text-sm text-ink/60">
        {t(task.vehicle_fit ? "volunteer.task.vehicleFit" : "volunteer.task.vehicleNoFit")}
      </p>
      <Button size="lg" block disabled={disabled || busy} onClick={() => onAccept(task.id)}>
        {t(busy ? "volunteer.task.accepting" : "volunteer.task.accept")}
      </Button>
    </Card>
  );
}

export default function VolunteerTasks() {
  const { t } = useT();
  const { user } = useAuth();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availError, setAvailError] = useState(false);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failure, setFailure] = useState<AcceptFailure | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listTasks();
      setTasks(list);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void getVolunteerAvailability()
      .then((res) => setAvailable(res.available))
      .catch(() => setAvailError(true));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useLiveRefetch(refresh);

  async function changeAvailability(next: boolean) {
    const prev = available;
    setAvailable(next);
    setAvailError(false);
    try {
      await setVolunteerAvailability({ available: next });
      await refresh();
    } catch {
      setAvailable(prev);
      setAvailError(true);
    }
  }

  async function accept(id: string) {
    setBusyId(id);
    setFailure(null);
    try {
      await acceptTask(id);
      await refresh();
    } catch (err) {
      const kind = failureKind(err);
      setFailure({ id, kind });
      if (kind === "notOpen") {
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  const active = tasks?.find((task) => task.status === "accepted" || task.status === "picked_up");
  const open = tasks?.filter((task) => task.status === "open") ?? [];

  return (
    <Screen
      titleKey="volunteer.tasks.title"
      aside={
        user ? (
          <span className="mt-1 rounded-full bg-leaf-50 px-3 py-1 text-sm font-bold text-leaf-800">
            {user.display_name}
          </span>
        ) : undefined
      }
    >
      {active && <ActiveCard task={active} />}

      <AvailabilitySwitch on={available} onChange={changeAvailability} />
      {availError && (
        <p role="alert" className="rounded-xl bg-chilli-50 p-3 text-sm font-bold text-chilli-700">
          {t("volunteer.error.generic")}
        </p>
      )}

      {failure && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-xl bg-chilli-50 p-3 text-sm font-bold text-chilli-700"
        >
          <p>{t(FAILURE_KEY[failure.kind])}</p>
          {failure.kind === "network" && (
            <Button
              variant="secondary"
              size="md"
              disabled={busyId !== null}
              onClick={() => void accept(failure.id)}
            >
              {t("volunteer.retry")}
            </Button>
          )}
        </div>
      )}

      {loadError && (
        <p role="alert" className="rounded-xl bg-chilli-50 p-3 text-sm font-bold text-chilli-700">
          {t("volunteer.error.generic")}
        </p>
      )}

      {tasks !== null && open.length === 0 ? (
        <EmptyState icon="🛵" message={t("volunteer.empty.available")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {open.map((task) => (
            <li key={task.id}>
              <OpenTaskCard
                task={task}
                disabled={available !== true}
                busy={busyId === task.id}
                onAccept={(id) => void accept(id)}
              />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
