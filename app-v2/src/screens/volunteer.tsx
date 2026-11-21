import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, Check, Navigation } from "lucide-react";
import { useAcceptTask, useAvailability, useDeliver, usePickup, useTasks } from "../api/hooks";
import type { Task } from "../api/types";
import { useT } from "../lib/i18n";
import { useSession } from "../lib/session";
import { mapsUrl } from "../lib/time";
import { CodeInput, Empty, ErrorNote, Loading, VegMark } from "../ui/bits";
import { DoneMark, FoodSummary, SafetyCard } from "../ui/Food";
import { PageHead } from "../ui/Shell";
import { TimeRing } from "../ui/TimeRing";

export function Tasks() {
  const { t } = useT();
  const { user } = useSession();
  const tasks = useTasks();
  const availability = useAvailability();
  const [available, setAvailable] = useState(user?.available ?? false);
  const mine = tasks.data?.filter((x) => x.status === "accepted" || x.status === "picked_up") ?? [];
  const open = tasks.data?.filter((x) => x.status === "open") ?? [];

  return (
    <>
      <PageHead title={t("tasksTitle")} />
      <button
        type="button"
        role="switch"
        aria-checked={available}
        onClick={() => availability.mutate(!available, { onSuccess: () => setAvailable(!available) })}
        className={`mb-6 flex w-full items-center justify-between gap-4 rounded-hero p-5 text-left transition-colors lg:p-6 ${available ? "bg-leaf text-white" : "border border-line bg-surface"}`}
      >
        <span className="font-display text-title font-bold">{available ? t("available") : t("notAvailable")}</span>
        <span className={`flex h-9 w-16 items-center rounded-full p-1 ${available ? "justify-end bg-white/30" : "justify-start bg-sunken"}`} aria-hidden="true">
          <span className="h-7 w-7 rounded-full bg-white shadow" />
        </span>
      </button>
      <ErrorNote error={availability.error} />

      {mine.map((task) => (
        <Link key={task.id} to={`/volunteer/tasks/${task.id}`} className="tile-hero mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-small text-white/80">{task.status === "accepted" ? t("stepGo") : t("stepDrive")}</p>
            <p className="mt-1 font-display text-headline font-bold">
              {task.meals} {t("meals")}
            </p>
            <p className="mt-1 text-white/85">
              {task.pickup.name} <ArrowDown className="inline h-4 w-4 -rotate-90" aria-hidden="true" /> {task.delivery.name}
            </p>
          </div>
          <Navigation className="h-10 w-10 text-marigold" aria-hidden="true" />
        </Link>
      ))}

      {tasks.isLoading && <Loading />}
      <ErrorNote error={tasks.error} onRetry={() => void tasks.refetch()} />
      {tasks.data && open.length === 0 && mine.length === 0 && <Empty text={t("noTasks")} />}
      <ul className="grid gap-4 md:grid-cols-2">
        {open.map((task) => (
          <li key={task.id}>
            <TaskTile task={task} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Route({ task }: { task: Task }) {
  const { t } = useT();
  return (
    <ol className="grid gap-2">
      <li className="rounded-chip bg-sunken p-4">
        <p className="text-caption text-muted">{t("from")}</p>
        <p className="font-semibold">
          {task.pickup.name}, {task.pickup.area}
        </p>
      </li>
      <li className="rounded-chip bg-sunken p-4">
        <p className="text-caption text-muted">
          {t("to")}, {t("away", { km: task.distance_km })}
        </p>
        <p className="font-semibold">
          {task.delivery.name}, {task.delivery.area}
        </p>
      </li>
    </ol>
  );
}

function TaskTile({ task }: { task: Task }) {
  const { t } = useT();
  const navigate = useNavigate();
  const take = useAcceptTask();
  return (
    <article className="tile flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <FoodSummary listing={task.listing} />
        <TimeRing from={task.listing.cooked_at} until={task.deadline} size={84} caption={t("left")} expiredText={t("expired")} />
      </div>
      <Route task={task} />
      <div className="flex flex-wrap items-center gap-3 text-small">
        <VegMark veg={task.listing.veg} withLabel />
        <span className={`rounded-full px-3 py-1 font-semibold ${task.vehicle_fit ? "bg-leaf-soft text-leaf" : "bg-kumkum-soft text-kumkum"}`}>
          {task.vehicle_fit ? t("vehicleFits") : t("vehicleNoFit")}
        </span>
      </div>
      <ErrorNote error={take.error} />
      <button className="btn-primary" disabled={!task.vehicle_fit || take.isPending} onClick={() => void take.mutateAsync(task.id).then(() => navigate(`/volunteer/tasks/${task.id}`), () => undefined)}>
        {t("takeTask")}
      </button>
    </article>
  );
}

// The handover, as the four things that happen in order on the road.
export function TaskFlow() {
  const { id = "" } = useParams();
  const { t } = useT();
  const tasks = useTasks();
  const pickup = usePickup();
  const deliver = useDeliver();
  const [pickupCode, setPickupCode] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [meals, setMeals] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="tile-hero flex flex-col items-start gap-6 lg:p-10">
        <DoneMark />
        <p className="font-display text-headline font-bold">{t("delivered")}</p>
        <Link to="/volunteer" className="btn-primary">
          {t("navTasks")}
        </Link>
      </div>
    );
  }
  if (tasks.isLoading) return <Loading />;
  const task = tasks.data?.find((x) => x.id === id);
  if (!task) return <ErrorNote error={tasks.error ?? new Error(t("noTasks"))} onRetry={() => void tasks.refetch()} />;
  const picked = task.status === "picked_up";
  const mealsValue = meals ?? task.meals;

  return (
    <>
      <PageHead title={`${task.meals} ${t("meals")}`}>
        <p className="mt-2 text-muted">{task.listing.items.map((i) => i.name).join(", ")}</p>
      </PageHead>
      <div className="grid gap-6 lg:grid-cols-12">
        <ol className="flex flex-col gap-4 lg:col-span-7">
          <Step n={1} title={t("stepGo")} done={true}>
            <p>
              {task.pickup.name}, {task.pickup.area}
            </p>
            <a className="btn-quiet mt-3" href={mapsUrl(task.pickup.lat, task.pickup.lng)} target="_blank" rel="noreferrer">
              <Navigation className="h-5 w-5" aria-hidden="true" /> {t("navigate")}
            </a>
          </Step>
          <Step n={2} title={t("stepPickup")} done={picked} current={!picked}>
            {!picked && (
              <>
                <CodeInput value={pickupCode} onChange={setPickupCode} label={t("pickupCode")} />
                <div className="mt-3">
                  <ErrorNote error={pickup.error} />
                </div>
                <button className="btn-primary mt-3 w-full" disabled={pickupCode.length !== 4 || pickup.isPending} onClick={() => pickup.mutate({ id: task.id, code: pickupCode })}>
                  {t("confirmPickup")}
                </button>
              </>
            )}
          </Step>
          <Step n={3} title={t("stepDrive")} done={false} current={picked}>
            {picked && (
              <>
                <p>
                  {task.delivery.name}, {task.delivery.area}
                </p>
                <a className="btn-quiet mt-3" href={mapsUrl(task.delivery.lat, task.delivery.lng)} target="_blank" rel="noreferrer">
                  <Navigation className="h-5 w-5" aria-hidden="true" /> {t("navigate")}
                </a>
              </>
            )}
          </Step>
          <Step n={4} title={t("stepDeliver")} done={false} current={picked}>
            {picked && (
              <>
                <CodeInput value={deliveryCode} onChange={setDeliveryCode} label={t("deliveryCode")} />
                <label className="mt-4 block">
                  <span className="text-small text-muted">{t("mealsDelivered")}</span>
                  <input
                    type="number"
                    min={0}
                    max={task.meals}
                    value={mealsValue}
                    onChange={(e) => setMeals(Math.min(task.meals, Math.max(0, Number(e.target.value) || 0)))}
                    className="mt-2 h-14 w-full rounded-chip border border-line bg-surface px-4 font-display text-title font-bold"
                  />
                </label>
                <div className="mt-3">
                  <ErrorNote error={deliver.error} />
                </div>
                <button
                  className="btn-primary mt-3 w-full"
                  disabled={deliveryCode.length !== 4 || deliver.isPending}
                  onClick={() => void deliver.mutateAsync({ id: task.id, code: deliveryCode, meals: mealsValue }).then(() => setDone(true), () => undefined)}
                >
                  {t("confirmDelivery")}
                </button>
              </>
            )}
          </Step>
        </ol>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="tile flex items-center justify-between gap-4">
            <FoodSummary listing={task.listing} />
            <TimeRing from={task.listing.cooked_at} until={picked ? task.delivery.serve_by : task.deadline} size={84} caption={t("left")} expiredText={t("expired")} />
          </div>
          <SafetyCard listing={task.listing} />
        </div>
      </div>
    </>
  );
}

function Step({ n, title, done, current = false, children }: { n: number; title: string; done: boolean; current?: boolean; children?: React.ReactNode }) {
  return (
    <li className={`rounded-tile border-2 p-5 ${current ? "border-marigold bg-surface" : "border-line bg-surface"} ${!done && !current ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold ${done ? "bg-leaf text-white" : current ? "bg-marigold text-marigold-ink" : "bg-sunken text-muted"}`}>
          {done ? <Check className="h-5 w-5" aria-hidden="true" /> : n}
        </span>
        <h2 className="font-display text-title font-semibold">{title}</h2>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </li>
  );
}
