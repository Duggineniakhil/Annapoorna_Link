import { useState } from "react";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import type { Task } from "../../types/api";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { Card } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { LocationHeader } from "../../components/ui/LocationHeader";
import { CategoryTile } from "../../components/food/FoodBits";
import { SafetyCard } from "../../components/SafetyCard";
import { DistancePill, MealsBadge } from "../../components/food/ListingCard";
import { itemsTitle } from "../../components/food/format";
import { TASKS, orgArea, orgName } from "../../mocks/fixtures";

function AvailabilitySwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const { t } = useT();
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex flex-col">
        <span className="font-bold text-ink">{t("volunteer.available")}</span>
        <span className="text-sm text-ink/60">
          {t(on ? "volunteer.availableOn" : "volunteer.availableOff")}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={t("volunteer.available")}
        onClick={() => onChange(!on)}
        className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
          on ? "bg-leaf-700" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
            on ? "left-8" : "left-1"
          }`}
        />
      </button>
    </Card>
  );
}

function Stop({ kind, name, area }: { kind: "from" | "to"; name: string; area: string }) {
  const { t } = useT();
  return (
    <li className="relative flex gap-3 pl-1">
      <span
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ${
          kind === "from" ? "bg-turmeric-400 ring-turmeric-100" : "bg-leaf-700 ring-leaf-100"
        }`}
      />
      <span className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wide text-ink/50">
          {t(kind === "from" ? "task.from" : "task.to")}
        </span>
        <span className="font-bold leading-snug text-ink">{name}</span>
        <span className="text-sm text-ink/60">{area}</span>
      </span>
    </li>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { t } = useT();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex gap-3">
        <CategoryTile category={task.listing.items[0]?.category ?? "rice_dish"} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-snug text-ink">{itemsTitle(task.listing)}</h3>
            <MealsBadge meals={task.listing.total_meals} />
          </div>
          <div className="flex items-center gap-2">
            <DistancePill km={task.distance_km} />
          </div>
        </div>
      </div>
      <ol className="flex flex-col gap-3 border-l-2 border-dashed border-ink/10 pl-3">
        <Stop kind="from" name={orgName(task.donor_org)} area={orgArea(task.donor_org)} />
        <Stop kind="to" name={orgName(task.receiver_org)} area={orgArea(task.receiver_org)} />
      </ol>
      <SafetyCard listing={task.listing} variant="compact" />
      <ButtonLink to={`/volunteer/tasks/${task.id}`} size="lg" block>
        <Icon name="bike" className="h-6 w-6" />
        {t("volunteer.take")}
      </ButtonLink>
    </Card>
  );
}

export default function VolunteerTasks() {
  const { t } = useT();
  const { user } = useAuth();
  const [available, setAvailable] = useState(true);
  return (
    <Screen
      titleKey="volunteer.tasks.title"
      // Volunteers have no org; the demo volunteer is based in Kukatpally (docs/04 §4).
      eyebrow={<LocationHeader area="Kukatpally" radiusKm={10} />}
      aside={
        user ? (
          <span className="mt-1 rounded-full bg-leaf-50 px-3 py-1 text-sm font-bold text-leaf-800">
            {user.display_name}
          </span>
        ) : undefined
      }
      demoData
    >
      <AvailabilitySwitch on={available} onChange={setAvailable} />
      {!available || TASKS.length === 0 ? (
        <EmptyState icon="🛵" message={t("volunteer.tasks.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {TASKS.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
