import type { ReactNode } from "react";
import type { MessageKey } from "../i18n/en";
import { useT } from "../i18n";
import { DemoDataBadge } from "./DemoDataBadge";

/** Standard page wrapper: heading, optional demo-data badge, content. */
export function Screen({
  titleKey,
  demoData = false,
  children,
}: {
  titleKey: MessageKey;
  demoData?: boolean;
  children?: ReactNode;
}) {
  const { t } = useT();
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-amber-950">{t(titleKey)}</h1>
        {demoData && <DemoDataBadge />}
      </div>
      {children}
    </section>
  );
}

/** Placeholder content for screens built in later tasks. */
export function ComingSoon() {
  const { t } = useT();
  return <p className="text-gray-600">{t("common.comingSoon")}</p>;
}
