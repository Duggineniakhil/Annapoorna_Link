import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { config } from "../config";
import { useT } from "../i18n";
import { DEMO_ACCOUNTS } from "../mocks/demoData";
import { LanguageToggle } from "./LanguageToggle";
import { ROLE_HOME } from "./roles";
import { Icon } from "./ui/Icon";

// Closes the <details> account menu after an item is chosen.
function closeMenu(e: MouseEvent<HTMLElement>): void {
  e.currentTarget.closest("details")?.removeAttribute("open");
}

/** Bowl-with-steam mark, same artwork as the app icon. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#164F2E" />
      <path d="M9 21h22a11 11 0 01-22 0z" fill="#FFF9EE" />
      <rect x="8" y="19.5" width="24" height="2.6" rx="1.3" fill="#FFF9EE" />
      <path
        d="M15 16c-1-1.5 1-2.5 0-4M20 16c-1-1.5 1-2.5 0-4M25 16c-1-1.5 1-2.5 0-4"
        stroke="#F7B500"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function TopBar() {
  const { t } = useT();
  const { user, org, isLoggedIn, switchAccount, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = (e: MouseEvent<HTMLButtonElement>) => {
    closeMenu(e);
    logout();
    navigate("/login", { replace: true });
  };

  const onSwitch = async (e: MouseEvent<HTMLButtonElement>, accountId: string) => {
    closeMenu(e);
    try {
      const next = await switchAccount(accountId);
      navigate(ROLE_HOME[next.role], { replace: true });
    } catch {
      // Failed switch keeps the previous session; the user stays on this screen.
    }
  };

  const item = "flex min-h-[48px] w-full items-center gap-3 px-4 text-left hover:bg-leaf-50";

  return (
    <header className="sticky top-0 z-10 border-b border-ink/5 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2">
        {/* "/" sends a logged-in user to their role home and everyone else to login. */}
        <Link to="/" className="flex min-h-[48px] items-center gap-2">
          <LogoMark />
          <span className="font-bold leading-tight text-leaf-900">{t("app.name")}</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <details className="relative">
            <summary
              className="flex min-h-[48px] min-w-[48px] cursor-pointer list-none items-center justify-center rounded-full text-leaf-800 hover:bg-leaf-50"
              aria-label={t("common.account")}
            >
              <Icon name="user" className="h-6 w-6" />
            </summary>
            <div className="absolute right-0 mt-1 max-h-[75vh] w-72 overflow-y-auto rounded-2xl bg-white py-1 shadow-card ring-1 ring-ink/5">
              {isLoggedIn && user ? (
                <div className="border-b border-ink/5 px-4 py-3">
                  <p className="font-bold leading-tight text-ink">{user.display_name}</p>
                  <p className="text-sm text-ink/60">
                    {t(`role.${user.role}`)}
                    {org ? ` · ${org.area}` : ""}
                  </p>
                </div>
              ) : null}
              <Link to="/about" onClick={closeMenu} className={item}>
                <Icon name="info" className="h-5 w-5 text-leaf-700" />
                {t("nav.about")}
              </Link>
              {isLoggedIn ? (
                <button type="button" onClick={onLogout} className={item}>
                  <Icon name="logout" className="h-5 w-5 text-leaf-700" />
                  {t("common.logout")}
                </button>
              ) : null}
              {config.useMocks && isLoggedIn ? (
                <div className="border-t border-ink/5 pt-1">
                  <p className="px-4 py-1 text-xs font-bold text-ink/60">{t("menu.switchDemo")}</p>
                  {DEMO_ACCOUNTS.filter((acc) => acc.user.id !== user?.id).map((acc) => (
                    <button
                      key={acc.account_id}
                      type="button"
                      onClick={(e) => void onSwitch(e, acc.account_id)}
                      className={item}
                    >
                      <Icon name="user" className="h-5 w-5 shrink-0 text-leaf-700" />
                      <span className="flex flex-col leading-tight">
                        <span>{acc.label}</span>
                        <span className="text-xs text-ink/60">{t(`role.${acc.role}`)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
