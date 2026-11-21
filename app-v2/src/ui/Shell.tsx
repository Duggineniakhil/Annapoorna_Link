import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, History, Home, Inbox, LogOut, PlusCircle, Bike } from "lucide-react";
import type { Role } from "../api/types";
import { useT, type TKey } from "../lib/i18n";
import { useSession } from "../lib/session";
import { DemoBadge } from "./bits";

type NavItem = { to: string; label: TKey; icon: typeof Home; end?: boolean };

const NAV: Record<Role, NavItem[]> = {
  donor: [
    { to: "/donor", label: "navHome", icon: Home, end: true },
    { to: "/donor/post", label: "navPost", icon: PlusCircle },
    { to: "/donor/impact", label: "navImpact", icon: BarChart3 },
  ],
  receiver: [
    { to: "/receiver", label: "navOffers", icon: Inbox, end: true },
    { to: "/receiver/history", label: "navHistory", icon: History },
  ],
  volunteer: [
    { to: "/volunteer", label: "navTasks", icon: Bike, end: true },
  ],
  sponsor: [
    { to: "/sponsor", label: "navCity", icon: BarChart3, end: true },
  ],
};

export function Logo({ light = false }: { light?: boolean }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-3">
      <img src="/icon.svg" alt="" className="h-10 w-10" />
      <span className={`font-display text-title font-bold ${light ? "text-white" : "text-ink"}`}>{t("appName")}</span>
    </span>
  );
}

export function LangToggle({ onDark = false }: { onDark?: boolean }) {
  const { t, lang, setLang } = useT();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "te" : "en")}
      className={`min-h-12 rounded-full px-4 text-small font-semibold ${onDark ? "bg-white/10 text-white hover:bg-white/20" : "border border-line bg-surface hover:bg-sunken"}`}
    >
      {t("language")}
    </button>
  );
}

// Phone: top bar + bottom tab bar in thumb reach. Desktop: a sidebar and a wide tile grid.
export function Shell() {
  const { user, org, live, signOut } = useSession();
  const { t } = useT();
  if (!user) return null;
  const items = NAV[user.role];
  const who = org?.name ?? user.display_name;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-indigo p-6 text-white lg:flex">
        <Logo light />
        <nav aria-label="Main" className="flex flex-col gap-2">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-chip px-4 text-lead font-medium transition-colors ${
                  isActive ? "bg-marigold text-marigold-ink" : "text-white/85 hover:bg-white/10"
                }`
              }
            >
              <i.icon className="h-5 w-5" aria-hidden="true" />
              {t(i.label)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <div className="rounded-tile bg-white/10 p-4">
            <p className="font-semibold">{who}</p>
            {org && <p className="text-small text-white/70">{org.area}</p>}
            <LiveDot live={live} onDark />
          </div>
          <div className="flex gap-2">
            <LangToggle onDark />
            <button onClick={signOut} className="flex min-h-12 items-center gap-2 rounded-full px-4 text-small font-semibold text-white/85 hover:bg-white/10">
              <LogOut className="h-4 w-4" aria-hidden="true" /> {t("signOut")}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0">
            <p className="truncate font-display text-lead font-bold">{who}</p>
            <LiveDot live={live} />
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button onClick={signOut} aria-label={t("signOut")} className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ul className="mx-auto flex max-w-md justify-around">
            {items.map((i) => (
              <li key={i.to} className="flex-1">
                <NavLink
                  to={i.to}
                  end={i.end}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-1 text-caption font-semibold ${isActive ? "text-indigo dark:text-marigold" : "text-muted"}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isActive ? "bg-marigold-soft" : ""}`}>
                        <i.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      {t(i.label)}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function LiveDot({ live, onDark = false }: { live: boolean; onDark?: boolean }) {
  const { t } = useT();
  return (
    <span className={`mt-1 inline-flex items-center gap-2 text-caption ${onDark ? "text-white/70" : "text-muted"}`}>
      <span className={`h-2 w-2 rounded-full ${live ? "bg-leaf" : "bg-muted"}`} aria-hidden="true" />
      {live ? t("live") : t("polling")}
    </span>
  );
}

export function PageHead({ title, action, children }: { title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div>
        <h1 className="font-display text-headline font-bold lg:text-display">{title}</h1>
        {children}
      </div>
      <div className="flex items-center gap-3">
        <DemoBadge />
        {action}
      </div>
    </div>
  );
}
