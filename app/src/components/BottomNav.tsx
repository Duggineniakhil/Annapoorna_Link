import { NavLink } from "react-router-dom";
import type { Role } from "../types/api";
import { useT } from "../i18n";
import { ROLE_NAV } from "./roles";
import { Icon } from "./ui/Icon";

export function BottomNav({ role }: { role: Role }) {
  const { t } = useT();
  return (
    <nav
      aria-label={t(`role.${role}`)}
      className="fixed inset-x-0 bottom-0 z-10 bg-white pb-[env(safe-area-inset-bottom)] shadow-bar print:hidden"
    >
      <ul className="mx-auto flex max-w-xl px-2">
        {ROLE_NAV[role].map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? "font-bold text-leaf-800" : "font-medium text-ink/60"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-leaf-100" : "group-hover:bg-leaf-50"
                    }`}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  {t(item.labelKey)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
