import type { Role } from "../types/api";
import type { MessageKey } from "../i18n/en";
import type { IconName } from "./ui/Icon";

export const ROLE_HOME: Record<Role, string> = {
  donor: "/donor",
  receiver: "/receiver",
  volunteer: "/volunteer",
  sponsor: "/sponsor",
};

export type NavItem = { to: string; labelKey: MessageKey; icon: IconName; end?: boolean };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  donor: [
    { to: "/donor", labelKey: "nav.home", icon: "home", end: true },
    { to: "/donor/post", labelKey: "nav.post", icon: "plus" },
    { to: "/donor/impact", labelKey: "nav.impact", icon: "chart" },
    { to: "/about", labelKey: "nav.about", icon: "info" },
  ],
  receiver: [
    { to: "/receiver", labelKey: "nav.offers", icon: "inbox", end: true },
    { to: "/receiver/needs", labelKey: "nav.needs", icon: "clipboard" },
    { to: "/receiver/history", labelKey: "nav.history", icon: "history" },
    { to: "/about", labelKey: "nav.about", icon: "info" },
  ],
  volunteer: [
    { to: "/volunteer", labelKey: "nav.tasks", icon: "bike", end: true },
    { to: "/volunteer/history", labelKey: "nav.history", icon: "history" },
    { to: "/about", labelKey: "nav.about", icon: "info" },
  ],
  sponsor: [
    { to: "/sponsor", labelKey: "nav.dashboard", icon: "chart", end: true },
    { to: "/sponsor/map", labelKey: "nav.map", icon: "map" },
    { to: "/about", labelKey: "nav.about", icon: "info" },
  ],
};

/** Works out which role's section the current path belongs to. */
export function roleFromPath(pathname: string): Role | null {
  const first = pathname.split("/")[1];
  return first === "donor" || first === "receiver" || first === "volunteer" || first === "sponsor"
    ? first
    : null;
}

/**
 * Decides where the current path should redirect, or null to stay put.
 *
 * Logged out (role null): any role-section path ("/donor", "/receiver/needs", ...)
 * redirects to "/login". Every other path (/login, /about, /, unknown paths)
 * stays put, so NotFound handles unknown paths and RootRedirect handles "/".
 *
 * Logged in: "/" and "/login" go to the role's home; a path in a different role's
 * section goes to the role's home; everything else (own section, /about, unknown
 * paths -> NotFound) stays put.
 */
export function resolveRedirect(role: Role | null, pathname: string): string | null {
  if (role === null) {
    return roleFromPath(pathname) !== null ? "/login" : null;
  }
  if (pathname === "/" || pathname === "/login") {
    return ROLE_HOME[role];
  }
  const section = roleFromPath(pathname);
  if (section !== null && section !== role) {
    return ROLE_HOME[role];
  }
  return null;
}
