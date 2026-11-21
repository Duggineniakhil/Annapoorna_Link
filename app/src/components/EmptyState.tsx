import type { ReactNode } from "react";

export function EmptyState({
  icon,
  message,
  action,
}: {
  icon: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-amber-900/20 p-8 text-center text-gray-600">
      <span aria-hidden="true" className="text-4xl">
        {icon}
      </span>
      <p>{message}</p>
      {action}
    </div>
  );
}
