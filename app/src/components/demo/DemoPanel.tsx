import { useNow } from "../../hooks/useNow";
import { useT } from "../../i18n";
import { Icon } from "../ui/Icon";
import { useDemo } from "./demoContext";
import { DEMO_STEPS, formatElapsed, stepIndex } from "./demoSteps";

/** Small floating card while the wedding-night demo runs (A14). */
export function DemoPanel() {
  const { state } = useDemo();
  const shown = state.phase === "running" || state.phase === "done" || state.phase === "stopped";
  return shown ? <ActivePanel /> : null;
}

function ActivePanel() {
  const { t } = useT();
  const { state, close } = useDemo();
  const now = useNow(1000);

  const reached = stepIndex(state.status);
  const done = state.phase === "done";
  const title = done
    ? t("demo.panel.done")
    : state.phase === "stopped"
      ? t("demo.panel.stopped")
      : t("demo.panel.running");

  return (
    <aside
      aria-label={t("demo.panel.label")}
      className="fixed bottom-24 right-3 z-20 w-60 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/10 print:hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            {!done && state.phase === "running" && (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-chilli-600" />
            )}
            {title}
          </p>
          {state.startedAt && state.phase === "running" && (
            <p className="text-xs text-ink/70">{formatElapsed(now - state.startedAt)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("demo.panel.close")}
          className="-mr-1 -mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl text-ink/70 hover:bg-leaf-50"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <ol className="mt-1 flex flex-col gap-1" aria-live="polite">
        {DEMO_STEPS.map((step, i) => {
          const isDone = i <= reached;
          const isNext = i === reached + 1 && state.phase === "running";
          return (
            <li
              key={step}
              aria-current={i === reached ? "step" : undefined}
              className={`flex items-center gap-2 text-sm ${isDone ? "font-medium text-ink" : "text-ink/70"}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-leaf-700 text-white"
                    : isNext
                      ? "animate-pulse ring-2 ring-inset ring-turmeric-400"
                      : "ring-1 ring-inset ring-ink/20"
                }`}
              >
                {isDone && <Icon name="check" className="h-3.5 w-3.5" />}
              </span>
              {t(`demo.step.${step}`)}
              <span className="sr-only">{isDone ? t("demo.step.doneSr") : ""}</span>
            </li>
          );
        })}
      </ol>
      {state.joined && state.phase === "running" && (
        <p className="mt-2 text-xs text-ink/70">{t("demo.panel.joined")}</p>
      )}
    </aside>
  );
}
