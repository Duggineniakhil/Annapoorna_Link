import { NavLink } from "react-router-dom";
import type { Role } from "../types/api";
import { useT } from "../i18n";
import { useAuth } from "../auth/AuthContext";
import { ROLE_NAV } from "./roles";
import { Icon } from "./ui/Icon";
import { PHOTOS, photo } from "../lib/media";

/** Desktop navigation (md and up): a dark sidebar with the role's pages. Phones use BottomNav. */
export function SideNav({ role }: { role: Role }) {
  const { t } = useT();
  const { user, org } = useAuth();
  return (
    <nav
      aria-label={t(`role.${role}`)}
      className="fixed bottom-0 left-0 top-16 z-10 hidden w-64 flex-col gap-6 overflow-y-auto bg-night p-4 text-white md:flex print:hidden"
    >
      {user && (
        <div className="relative overflow-hidden rounded-2xl bg-night-700 p-4">
          <img
            src={photo(PHOTOS.thaliSilver, 480, 240)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-mint">
              {t(`role.${role}`)}
            </p>
            <p className="font-display text-lg font-black leading-tight">{user.display_name}</p>
            {org && <p className="text-sm text-white/75">{org.area}</p>}
          </div>
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {ROLE_NAV[role].map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold transition-colors ${
                  isActive
                    ? "bg-turmeric-400 text-ink"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-xs text-white/60">{t("landing.footer.data")}</p>
    </nav>
  );
}
