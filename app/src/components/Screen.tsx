import type { ReactNode } from "react";
import type { MessageKey } from "../i18n/en";
import { useT } from "../i18n";
import { DemoDataBadge } from "./DemoDataBadge";

/** Standard page wrapper: optional eyebrow line, heading, demo-data badge, content. */
export function Screen({
  titleKey,
  title,
  eyebrow,
  demoData = false,
  aside,
  children,
}: {
  titleKey: MessageKey;
  /** Overrides the translated title, e.g. "Hello, Sri Sai Caterers". */
  title?: string;
  eyebrow?: ReactNode;
  demoData?: boolean;
  /** Right-aligned element next to the heading. */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useT();
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold leading-tight text-ink">{title ?? t(titleKey)}</h1>
            {demoData && <DemoDataBadge />}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Placeholder content for screens built in later tasks. */
export function ComingSoon() {
  const { t } = useT();
  return (
    <div className="rounded-2xl border-2 border-dashed border-leaf-800/15 p-8 text-center text-ink/70">
      {t("common.comingSoon")}
    </div>
  );
}
