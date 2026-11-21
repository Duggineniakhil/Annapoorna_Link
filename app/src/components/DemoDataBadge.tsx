import { useT } from "../i18n";

export function DemoDataBadge() {
  const { t } = useT();
  return (
    <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
      {t("common.demoData")}
    </span>
  );
}
