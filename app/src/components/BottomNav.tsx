import { NavLink } from "react-router-dom";
import type { Role } from "../types/api";
import { useT } from "../i18n";
import { ROLE_NAV } from "./roles";

export function BottomNav({ role }: { role: Role }) {
  const { t } = useT();
  return (
    <nav
      aria-label={t(`role.${role}`)}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-amber-900/10 bg-white"
    >
      <ul className="mx-auto flex max-w-xl">
        {ROLE_NAV[role].map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center text-xs ${
                  isActive ? "font-semibold text-amber-800" : "text-gray-600"
                }`
              }
            >
              <span aria-hidden="true" className="text-xl">
                {item.icon}
              </span>
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
