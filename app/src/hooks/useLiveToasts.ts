import { useAuth } from "../auth/useAuth";
import { apiRequest } from "../services/api";
import type { Listing } from "../types/api";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/en";
import { useToast } from "../components/ToastProvider";
import { useLiveEvents } from "./useLiveEvents";
import { useSettings } from "../components/SettingsProvider";
import { playChime } from "../lib/settings";

/**
 * Which toast (if any) a live status change shows for a role. Event payloads carry no names,
 * so the text is generic. "claimed" is the donor-accepted event for donors and the new-task
 * event for volunteers.
 */
export function toastKeyFor(role: string, status: string): MessageKey | null {
  switch (role) {
    case "donor":
      if (status === "claimed") return "toast.donor.accepted";
      if (status === "picked_up") return "toast.donor.picked";
      if (status === "delivered") return "toast.donor.delivered";
      return null;
    case "receiver":
      if (status === "offered") return "toast.receiver.offer";
      if (status === "volunteer_assigned") return "toast.receiver.volunteerOnWay";
      return null;
    case "volunteer":
      if (status === "claimed") return "toast.volunteer.newTask";
      return null;
    default:
      return null;
  }
}

/** Shows role-scoped toasts for live events. Call once under the providers (AppShell). */
export function useLiveToasts(): void {
  const { user } = useAuth();
  const { t } = useT();
  const { show } = useToast();
  const { settings } = useSettings();
  // Notification sound (Settings): a short chime with each live toast.
  const notify = (message: string) => {
    show(message);
    if (settings.sound) playChime();
  };
  const role = user?.role ?? null;

  useLiveEvents((e) => {
    if (role === null) return;
    const key = toastKeyFor(role, e.status);
    if (key === null) return;
    if (key === "toast.donor.accepted") {
      // Events carry no names: look up which kitchen took the food.
      apiRequest<Listing>("GET", `/api/listings/${e.listing_id}`)
        .then((listing) => {
          const name = listing.matched_receiver?.name;
          notify(name ? t("toast.donor.acceptedBy", { name }) : t(key));
        })
        .catch(() => notify(t(key)));
      return;
    }
    notify(t(key));
  });
}
