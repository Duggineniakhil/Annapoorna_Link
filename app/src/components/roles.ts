import type { Role } from "../types/api";
import type { MessageKey } from "../i18n/en";

export const ROLE_HOME: Record<Role, string> = {
  donor: "/donor",
  receiver: "/receiver",
  volunteer: "/volunteer",
  sponsor: "/sponsor",
};

export type NavItem = { to: string; labelKey: MessageKey; icon: string; end?: boolean };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  donor: [
    { to: "/donor", labelKey: "nav.home", icon: "🏠", end: true },
    { to: "/donor/post", labelKey: "nav.post", icon: "➕" },
    { to: "/donor/impact", labelKey: "nav.impact", icon: "📊" },
    { to: "/about", labelKey: "nav.about", icon: "ℹ️" },
  ],
  receiver: [
    { to: "/receiver", labelKey: "nav.offers", icon: "🍲", end: true },
    { to: "/receiver/needs", labelKey: "nav.needs", icon: "📝" },
    { to: "/receiver/history", labelKey: "nav.history", icon: "🕘" },
    { to: "/about", labelKey: "nav.about", icon: "ℹ️" },
  ],
  volunteer: [
    { to: "/volunteer", labelKey: "nav.tasks", icon: "🛵", end: true },
    { to: "/volunteer/history", labelKey: "nav.history", icon: "🕘" },
    { to: "/about", labelKey: "nav.about", icon: "ℹ️" },
  ],
  sponsor: [
    { to: "/sponsor", labelKey: "nav.dashboard", icon: "📊", end: true },
    { to: "/sponsor/map", labelKey: "nav.map", icon: "🗺️" },
    { to: "/about", labelKey: "nav.about", icon: "ℹ️" },
  ],
};

/** Works out which role's section the current path belongs to. */
export function roleFromPath(pathname: string): Role | null {
  const first = pathname.split("/")[1];
  return first === "donor" || first === "receiver" || first === "volunteer" || first === "sponsor"
    ? first
    : null;
}
