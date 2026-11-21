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
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-leaf-800/15 px-6 py-10 text-center text-ink/70">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-50 text-3xl"
      >
        {icon}
      </span>
      <p className="max-w-xs">{message}</p>
      {action}
    </div>
  );
}
