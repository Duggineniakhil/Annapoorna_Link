import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { DemoAccountList } from "./demo/DemoAccountList";
import { LanguageToggle } from "./LanguageToggle";
import { Icon } from "./ui/Icon";
import OfflineBanner from "./OfflineBanner";
import { useSettings } from "./SettingsProvider";
import { TEXT_SIZES, type TextSize } from "../lib/settings";

const SIZE_CLASS: Record<TextSize, string> = {
  normal: "text-sm",
  large: "text-base",
  larger: "text-lg",
};

/** Settings in the account menu (A13): language, notification sound, text size. */
function SettingsSection() {
  const { t } = useT();
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-3 border-t border-ink/5 px-4 py-3">
      <p className="text-xs font-bold text-ink/70">{t("settings.title")}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink">{t("settings.language")}</span>
        <LanguageToggle />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={settings.sound}
        onClick={() => update({ sound: !settings.sound })}
        className="flex min-h-12 items-center justify-between gap-2 text-left text-ink"
      >
        <span>{t("settings.sound")}</span>
        <span
          aria-hidden="true"
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
            settings.sound ? "justify-end bg-leaf-700" : "justify-start bg-ink/20"
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </button>
      <div className="flex items-center justify-between gap-2">
        <span id="text-size-label" className="text-ink">
          {t("settings.textSize")}
        </span>
        <div role="radiogroup" aria-labelledby="text-size-label" className="flex gap-1">
          {TEXT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={settings.textSize === size}
              aria-label={t(`settings.textSize.${size}`)}
              onClick={() => update({ textSize: size })}
              className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${SIZE_CLASS[size]} ${
                settings.textSize === size
                  ? "bg-leaf-800 text-white"
                  : "bg-leaf-50 text-leaf-800 ring-1 ring-inset ring-leaf-800/15"
              }`}
            >
              {t("settings.textSize.letter")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Closes the <details> account menu after an item is chosen.
function closeMenu(e: MouseEvent<HTMLElement>): void {
  e.currentTarget.closest("details")?.removeAttribute("open");
}

/** Bowl-with-steam mark, same artwork as the app icon. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`shrink-0 ${className}`} aria-hidden="true">
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
  const { user, org, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = (e: MouseEvent<HTMLButtonElement>) => {
    closeMenu(e);
    logout();
    navigate("/login", { replace: true });
  };

  const item = "flex min-h-[48px] w-full items-center gap-3 px-4 text-left hover:bg-leaf-50";

  return (
    <header className="sticky top-0 z-10 print:hidden border-b border-ink/5 bg-white/95 backdrop-blur">
      <OfflineBanner />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 py-2">
        {/* "/" sends a logged-in user to their role home and everyone else to login. */}
        <Link
          to="/"
          aria-label={t("app.name")}
          className="flex min-h-[48px] min-w-[48px] items-center gap-2"
        >
          <LogoMark />
          <span className="brand-name hidden whitespace-nowrap font-display text-base font-black uppercase leading-tight tracking-tight text-leaf-900 sm:inline sm:text-lg">
            {t("app.name")}
          </span>
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
                  <p className="text-sm text-ink/70">
                    {t(`role.${user.role}`)}
                    {org ? ` · ${org.area}` : ""}
                  </p>
                </div>
              ) : null}
              <Link to="/about" onClick={closeMenu} className={item}>
                <Icon name="info" className="h-5 w-5 text-leaf-700" />
                {t("nav.about")}
              </Link>
              <Link to="/demo-guide" onClick={closeMenu} className={item}>
                <Icon name="clipboard" className="h-5 w-5 text-leaf-700" />
                {t("demo.guide.title")}
              </Link>
              {isLoggedIn ? (
                <button type="button" onClick={onLogout} className={item}>
                  <Icon name="logout" className="h-5 w-5 text-leaf-700" />
                  {t("common.logout")}
                </button>
              ) : null}
              <SettingsSection />
              {isLoggedIn ? (
                <div className="border-t border-ink/5 pt-1">
                  <p className="px-4 py-1 text-xs font-bold text-ink/70">{t("menu.switchDemo")}</p>
                  <DemoAccountList variant="menu" onPicked={closeMenu} />
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
