import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/useAuth";
import { ApiError, apiRequest } from "../../services/api";
import { ROLE_HOME } from "../../components/roles";
import { DemoDataBadge } from "../../components/DemoDataBadge";
import { LogoMark } from "../../components/TopBar";
import { Button } from "../../components/ui/Button";
import { Icon, type IconName } from "../../components/ui/Icon";
import { formatNumber } from "../../components/food/format";
import { RunDemoButton } from "../../components/demo/RunDemoButton";
import { PHOTOS, photo, photoSet } from "../../lib/media";

type AccountSummary = { account_id: string; role: Role; label: string; area: string };

const ROLES: { role: Role; icon: IconName; hintKey: MessageKey; tile: string }[] = [
  {
    role: "donor",
    icon: "plus",
    hintKey: "login.donorHint",
    tile: "bg-turmeric-100 text-turmeric-800",
  },
  {
    role: "receiver",
    icon: "inbox",
    hintKey: "login.receiverHint",
    tile: "bg-leaf-100 text-leaf-800",
  },
  {
    role: "volunteer",
    icon: "bike",
    hintKey: "login.volunteerHint",
    tile: "bg-chilli-50 text-chilli-700",
  },
  {
    role: "sponsor",
    icon: "chart",
    hintKey: "login.sponsorHint",
    tile: "bg-leaf-50 text-leaf-900",
  },
];

// Demo numbers for the hero strip (fictional).
const WEEK = { meals: 3120, kitchens: 9, minutes: 6 };

function Hero() {
  const { t, lang } = useT();
  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden bg-night text-cream sm:-mx-6 sm:-mt-6 lg:sticky lg:top-24 lg:mx-0 lg:mt-0 lg:rounded-3xl">
      {/* Phones get a small landscape crop; the tall crop is only for the wide side panel. */}
      <picture>
        <source media="(min-width: 1024px)" srcSet={photoSet(PHOTOS.biryaniHandi, 640, 780)} />
        <img
          src={photo(PHOTOS.biryaniHandi, 480, 320)}
          srcSet={photoSet(PHOTOS.biryaniHandi, 480, 320)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <span className="absolute inset-0 bg-gradient-to-t from-night via-night/75 to-night/30" />
      <div className="relative flex flex-col gap-5 px-4 pb-6 pt-10 sm:px-6 lg:min-h-[36rem] lg:justify-end lg:p-8">
        <div className="flex items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl ring-2 ring-cream/20" />
          <div>
            <p className="text-sm font-medium text-turmeric-300">{t("app.name")}</p>
            <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
              {t("login.heroTitle")}
            </h1>
          </div>
        </div>
        <p className="text-lg leading-snug text-cream/90">{t("app.tagline")}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cream/70">
            {t("login.weekTitle")}
            <span className="normal-case tracking-normal">
              <DemoDataBadge />
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { value: formatNumber(WEEK.meals, lang), label: t("login.weekMeals") },
              { value: String(WEEK.kitchens), label: t("login.weekKitchens") },
              { value: String(WEEK.minutes), label: t("login.weekMinutes") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-night/70 p-3 backdrop-blur">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl font-black text-turmeric-300">{stat.value}</dd>
                <dd className="text-xs leading-tight text-cream/80">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default function Login() {
  const { t } = useT();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setAccounts(null);
    try {
      setAccounts(await apiRequest<AccountSummary[]>("GET", "/api/demo/accounts"));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t("login.loadError"));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPick = async (accountId: string) => {
    setSigningIn(accountId);
    setSignInError(null);
    try {
      const user = await login(accountId);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setSignInError(err instanceof ApiError ? err.message : t("login.loadError"));
      setSigningIn(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10">
      <Hero />
      <div className="flex flex-col gap-6">
        <RunDemoButton />

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-black tracking-tight text-ink">
              {t("login.title")}
            </h2>
            <p className="text-sm text-ink/70">{t("login.subtitle")}</p>
          </div>

          {signInError && (
            <p
              role="alert"
              className="rounded-2xl bg-chilli-50 p-3 text-sm font-medium text-chilli-700"
            >
              {signInError}
            </p>
          )}

          {loadError ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-2xl bg-chilli-50 p-4"
            >
              <p className="font-medium text-chilli-700">{loadError}</p>
              <Button variant="secondary" onClick={() => void load()}>
                {t("login.retry")}
              </Button>
            </div>
          ) : accounts === null ? (
            <p role="status" className="text-ink/70">
              {t("login.loading")}
            </p>
          ) : (
            ROLES.map(({ role, icon, hintKey, tile }) => {
              const list = accounts.filter((a) => a.role === role);
              if (list.length === 0) return null;
              return (
                <div key={role} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile}`}
                    >
                      <Icon name={icon} className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <h3 className="font-bold text-ink">{t(`role.${role}`)}</h3>
                      <span className="text-xs text-ink/70">{t(hintKey)}</span>
                    </div>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {list.map((account) => (
                      <li key={account.account_id}>
                        <button
                          type="button"
                          disabled={signingIn !== null}
                          onClick={() => void onPick(account.account_id)}
                          className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-card ring-1 ring-ink/5 transition hover:ring-leaf-700/40 disabled:opacity-60"
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-bold text-ink">{account.label}</span>
                            <span className="flex items-center gap-1 text-sm text-ink/70">
                              <Icon name="pin" className="h-3.5 w-3.5" />
                              {account.area}
                            </span>
                          </span>
                          {signingIn === account.account_id ? (
                            <span className="text-sm font-bold text-leaf-700">
                              {t("login.signingIn")}
                            </span>
                          ) : (
                            <Icon name="arrowRight" className="h-5 w-5 shrink-0 text-leaf-700" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
