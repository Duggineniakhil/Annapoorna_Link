import { useEffect, useState, type FormEvent } from "react";
import type { ReceiverNeeds as Needs } from "../../types/api";
import { getReceiverNeeds, saveReceiverNeeds } from "../../services/api";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Draft = { meals: string; vegOnly: boolean; from: string; to: string };
type Status = "idle" | "invalid" | "saved" | "error";

function toDraft(n: Needs): Draft {
  return {
    meals: String(n.meals_needed),
    vegOnly: n.veg_only,
    from: n.open_from,
    to: n.open_to,
  };
}

function isValid(d: Draft): boolean {
  if (!/^\d+$/.test(d.meals.trim()) || Number(d.meals) < 1) return false;
  if (!TIME_RE.test(d.from) || !TIME_RE.test(d.to)) return false;
  // Overnight intake (e.g. 20:00 to 01:00) is allowed; only an empty window is not.
  return d.from !== d.to;
}

const INPUT =
  "min-h-[48px] w-full rounded-xl border border-leaf-800/20 bg-white px-3 text-base text-ink focus:border-leaf-700 focus:outline-none";

export default function ReceiverNeeds() {
  const { t } = useT();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    getReceiverNeeds()
      .then((n) => {
        if (!cancelled) setDraft(toDraft(n));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    if (!isValid(draft)) {
      setStatus("invalid");
      return;
    }
    setSaving(true);
    setStatus("idle");
    try {
      const saved = await saveReceiverNeeds({
        meals_needed: Number(draft.meals),
        veg_only: draft.vegOnly,
        open_from: draft.from,
        open_to: draft.to,
      });
      setDraft(toDraft(saved));
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const statusKey: Record<
    Exclude<Status, "idle">,
    "receiver.needs.invalid" | "receiver.needs.saved" | "receiver.error.generic"
  > = {
    invalid: "receiver.needs.invalid",
    saved: "receiver.needs.saved",
    error: "receiver.error.generic",
  };

  return (
    <Screen narrow titleKey="receiver.needs.title" demoData>
      {loadError && <p className="text-sm text-red-700">{t("receiver.error.generic")}</p>}
      {!loadError && !draft && <p className="text-ink/70">{t("receiver.needs.loading")}</p>}
      {draft && (
        <Card className="p-4">
          <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="needs-meals" className="font-bold text-ink">
                {t("receiver.needs.today")}
              </label>
              <input
                id="needs-meals"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className={INPUT}
                value={draft.meals}
                onChange={(e) => setDraft({ ...draft, meals: e.target.value })}
              />
            </div>

            <label className="flex min-h-[48px] items-center gap-3 font-bold text-ink">
              <input
                type="checkbox"
                className="h-5 w-5 accent-leaf-800"
                checked={draft.vegOnly}
                onChange={(e) => setDraft({ ...draft, vegOnly: e.target.checked })}
              />
              {t("receiver.needs.vegOnly")}
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="font-bold text-ink">{t("receiver.needs.intakeHours")}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="needs-from" className="text-sm text-ink/70">
                    {t("receiver.needs.from")}
                  </label>
                  <input
                    id="needs-from"
                    type="time"
                    className={INPUT}
                    value={draft.from}
                    onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="needs-to" className="text-sm text-ink/70">
                    {t("receiver.needs.to")}
                  </label>
                  <input
                    id="needs-to"
                    type="time"
                    className={INPUT}
                    value={draft.to}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {status !== "idle" && (
              <p role="status" className="text-sm text-ink/80">
                {t(statusKey[status])}
              </p>
            )}

            <Button type="submit" block disabled={saving}>
              {t("receiver.needs.save")}
            </Button>
          </form>
        </Card>
      )}
    </Screen>
  );
}
