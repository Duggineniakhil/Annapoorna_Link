import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";

export default function About() {
  const { t } = useT();
  return (
    <Screen titleKey="about.title">
      <p>{t("about.body")}</p>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
        ℹ️ {t("about.disclaimer")}
      </p>
      <p className="text-sm text-gray-600">{t("about.dataNote")}</p>
    </Screen>
  );
}
