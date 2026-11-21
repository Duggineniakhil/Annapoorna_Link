import type { Status } from "../types/api";
import { useT } from "../i18n";

const COLORS: Record<Status, string> = {
  posted: "bg-gray-100 text-gray-800",
  offered: "bg-sky-100 text-sky-900",
  claimed: "bg-indigo-100 text-indigo-900",
  volunteer_assigned: "bg-violet-100 text-violet-900",
  picked_up: "bg-amber-100 text-amber-900",
  delivered: "bg-green-100 text-green-900",
  expired: "bg-red-100 text-red-900",
  cancelled: "bg-gray-200 text-gray-700",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useT();
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
