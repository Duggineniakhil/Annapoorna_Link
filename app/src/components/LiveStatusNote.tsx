import { useT } from "../i18n";
import { useLiveStatus } from "../hooks/useLiveEvents";

/** Small note shown only while live updates have fallen back to polling. */
export default function LiveStatusNote() {
  const mode = useLiveStatus();
  const { t } = useT();
  if (mode !== "polling") return null;
  return <p className="mx-auto max-w-xl px-4 pt-2 text-xs text-leaf-700">{t("live.paused")}</p>;
}
