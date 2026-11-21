import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { useToast } from "./ToastProvider";

/** True while the browser reports a connection. */
// eslint-disable-next-line react-refresh/only-export-components
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** Banner while offline, and a toast when the connection is back (screens refetch then). */
export default function OfflineBanner() {
  const { t } = useT();
  const { show } = useToast();
  const online = useOnline();
  const wasOffline = useRef(!online);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      show(t("offline.back"));
    }
  }, [online, show, t]);

  if (online) return null;
  return (
    <div role="status" className="bg-ink px-4 py-2 text-center text-sm font-medium text-cream">
      {t("offline.banner")}
    </div>
  );
}
