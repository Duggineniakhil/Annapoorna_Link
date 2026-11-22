import { Link } from "react-router-dom";
import { useT } from "../../i18n";
import { Button } from "../ui/Button";
import { useDemo } from "./demoContext";

/** "Run wedding-night demo" card, on /login, the sponsor dashboard and /demo-guide (A14). */
export function RunDemoButton({ guideLink = true }: { guideLink?: boolean }) {
  const { t } = useT();
  const { state, start } = useDemo();
  const busy = state.phase === "starting" || state.phase === "running";
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-turmeric-100 p-4">
      <p className="font-bold text-ink">{t("demo.run.title")}</p>
      <p className="text-sm text-ink/80">{t("demo.run.body")}</p>
      <Button onClick={() => void start()} disabled={busy}>
        {state.phase === "starting"
          ? t("demo.run.starting")
          : state.phase === "running"
            ? t("demo.panel.running")
            : t("demo.run.button")}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-chilli-700">
          {state.error}
        </p>
      )}
      {guideLink && (
        <Link
          to="/demo-guide"
          className="flex min-h-12 items-center self-start text-sm font-bold text-leaf-800 underline"
        >
          {t("demo.guide.link")}
        </Link>
      )}
    </div>
  );
}
