import { useT } from "../i18n";

export function DemoDataBadge() {
  const { t } = useT();
  return (
    <span className="inline-flex items-center rounded-full bg-turmeric-100 px-2.5 py-0.5 text-xs font-bold text-turmeric-800">
      {t("common.demoData")}
    </span>
  );
}
