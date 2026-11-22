import { useT } from "../../i18n";
import { config } from "../../config";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { LogoMark } from "../../components/TopBar";

// About (A13): what the app does, how matching works, the food-safety disclaimer, the demo data
// note and the version.

export default function About() {
  const { t } = useT();
  return (
    <Screen narrow titleKey="about.title">
      <div className="flex items-center gap-3">
        <LogoMark className="h-12 w-12" />
        <p className="font-medium text-ink/80">{t("app.tagline")}</p>
      </div>
      <Card className="flex flex-col gap-2 p-4">
        <h2 className="font-bold text-ink">{t("about.whatTitle")}</h2>
        <p className="text-ink/80">{t("about.body")}</p>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <h2 className="font-bold text-ink">{t("about.matchingTitle")}</h2>
        <p className="text-ink/80">{t("about.matching")}</p>
      </Card>
      <div className="flex flex-col gap-1 rounded-2xl bg-turmeric-100 p-4 text-turmeric-800">
        <h2 className="font-bold">{t("about.safetyTitle")}</h2>
        <p>{t("about.disclaimer")}</p>
      </div>
      <p className="rounded-2xl bg-leaf-50 p-4 font-medium text-leaf-900">{t("about.dataNote")}</p>
      <p className="text-sm text-ink/70">
        {t("about.version", {
          version: __APP_VERSION__,
          mode: t(config.useMocks ? "about.mode.demo" : "about.mode.live"),
        })}
      </p>
    </Screen>
  );
}
