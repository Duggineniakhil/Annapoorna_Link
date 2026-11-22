import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { Icon, type IconName } from "../../components/ui/Icon";
import { RunDemoButton } from "../../components/demo/RunDemoButton";
import { DemoAccountList } from "../../components/demo/DemoAccountList";

// /demo-guide (A14): how to show Annapoorna Link to judges, with one tap or by hand in two
// windows and a phone. Open to everyone, signed in or not.

const BY_HAND: { icon: IconName; where: MessageKey; who: MessageKey; steps: MessageKey[] }[] = [
  {
    icon: "plus",
    where: "demo.guide.window1",
    who: "demo.guide.donorWho",
    steps: ["demo.guide.donor1", "demo.guide.donor2", "demo.guide.donor3"],
  },
  {
    icon: "inbox",
    where: "demo.guide.window2",
    who: "demo.guide.receiverWho",
    steps: ["demo.guide.receiver1", "demo.guide.receiver2"],
  },
  {
    icon: "bike",
    where: "demo.guide.phone",
    who: "demo.guide.volunteerWho",
    steps: ["demo.guide.volunteer1", "demo.guide.volunteer2", "demo.guide.volunteer3"],
  },
];

export default function DemoGuide() {
  const { t } = useT();
  return (
    <Screen titleKey="demo.guide.title" demoData>
      <p className="text-ink/80">{t("demo.guide.intro")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink">{t("demo.guide.oneTapTitle")}</h2>
        <RunDemoButton guideLink={false} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">{t("demo.guide.byHandTitle")}</h2>
        <p className="text-sm text-ink/70">{t("demo.guide.byHandIntro")}</p>
        {BY_HAND.map(({ icon, where, who, steps }) => (
          <Card key={where} className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-800">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <div className="flex flex-col leading-tight">
                <h3 className="font-bold text-ink">{t(where)}</h3>
                <span className="text-sm text-ink/70">{t(who)}</span>
              </div>
            </div>
            <ol className="ml-5 flex list-decimal flex-col gap-1 text-ink/80">
              {steps.map((step) => (
                <li key={step}>{t(step)}</li>
              ))}
            </ol>
          </Card>
        ))}
        <p className="rounded-2xl bg-leaf-50 p-3 text-sm text-leaf-900">{t("demo.guide.live")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink">{t("demo.guide.codesTitle")}</h2>
        <Card className="flex flex-col gap-2 p-4 text-ink/80">
          <p>
            <strong className="text-ink">{t("demo.guide.pickupCode")}</strong>{" "}
            {t("demo.guide.pickupCodeBody")}
          </p>
          <p>
            <strong className="text-ink">{t("demo.guide.deliveryCode")}</strong>{" "}
            {t("demo.guide.deliveryCodeBody")}
          </p>
          <p className="text-sm">{t("demo.guide.codeTries")}</p>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink">{t("demo.guide.accountsTitle")}</h2>
        <p className="text-sm text-ink/70">{t("demo.guide.accountsBody")}</p>
        <DemoAccountList variant="cards" />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink">{t("demo.guide.tipsTitle")}</h2>
        <ul className="ml-5 flex list-disc flex-col gap-1 text-sm text-ink/80">
          <li>{t("demo.guide.tipTabs")}</li>
          <li>{t("demo.guide.tipOffline")}</li>
          <li>{t("demo.guide.tipLanguage")}</li>
          <li>{t("demo.guide.tipData")}</li>
        </ul>
      </section>
    </Screen>
  );
}
