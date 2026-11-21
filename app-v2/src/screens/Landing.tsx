import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Building2, ChefHat, HandHeart } from "lucide-react";
import { useAccounts, useLogin } from "../api/hooks";
import type { Role } from "../api/types";
import { useT, type TKey } from "../lib/i18n";
import { homeFor, useSession } from "../lib/session";
import { ErrorNote, FoodGlyph, Loading, VegMark } from "../ui/bits";
import { LangToggle, Logo } from "../ui/Shell";
import { TimeRing } from "../ui/TimeRing";

const ROLE: Record<Role, { label: TKey; icon: typeof ChefHat; tint: string }> = {
  donor: { label: "roleDonor", icon: ChefHat, tint: "bg-marigold-soft text-ink" },
  receiver: { label: "roleReceiver", icon: HandHeart, tint: "bg-leaf-soft text-leaf" },
  volunteer: { label: "roleVolunteer", icon: Bike, tint: "bg-indigo-soft text-indigo" },
  sponsor: { label: "roleSponsor", icon: Building2, tint: "bg-kumkum-soft text-kumkum" },
};

export function Landing() {
  const { t } = useT();
  const accounts = useAccounts();
  const login = useLogin();
  const { signIn } = useSession();
  const navigate = useNavigate();

  // A sample listing that keeps ticking: the product explained by showing it.
  const [{ start, end }] = useState(() => ({
    start: new Date(Date.now() - 50 * 60_000).toISOString(),
    end: new Date(Date.now() + 70 * 60_000).toISOString(),
  }));

  const choose = (id: string) =>
    login.mutate(id, {
      onSuccess: (s) => {
        signIn(s.token, s.user, s.org);
        navigate(homeFor(s.user.role));
      },
    });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between">
        <Logo />
        <LangToggle />
      </header>

      <section className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-12 lg:gap-6">
        <div className="tile-hero flex flex-col justify-between gap-10 lg:col-span-7 lg:p-10">
          <h1 className="max-w-[14ch] font-display text-display font-bold lg:text-[4rem] lg:leading-[4.1rem]">{t("tagline")}</h1>
          <p className="max-w-md text-lead text-white/85">{t("howTitle")}</p>
        </div>

        <div className="tile flex flex-col gap-5 lg:col-span-5 lg:p-8" aria-hidden="true">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <FoodGlyph category="rice_dish" size="lg" />
              <div>
                <p className="font-display text-headline font-bold leading-none">
                  150 <span className="text-lead font-medium text-muted">{t("meals")}</span>
                </p>
                <p className="mt-2 text-body">Veg biryani, dal</p>
              </div>
            </div>
            <TimeRing from={start} until={end} caption={t("left")} expiredText={t("expired")} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-small text-muted">
            <VegMark veg withLabel />
            <span className="rounded-full bg-sunken px-3 py-1">Sri Sai Caterers, Kukatpally</span>
          </div>
          <div className="rounded-chip bg-leaf-soft p-4">
            <p className="font-semibold text-leaf">Annadanam Community Kitchen</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-caption font-semibold">
              <li className="rounded-full bg-surface px-3 py-1">{t("away", { km: 2.4 })}</li>
              <li className="rounded-full bg-surface px-3 py-1">{t("eta", { min: 17 })}</li>
              <li className="rounded-full bg-surface px-3 py-1">{t("veg")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mt-10">
        <h2 id="how" className="sr-only">
          {t("howTitle")}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["how1", "how2", "how3", "how4"] as const).map((k, i) => (
            <li key={k} className="tile flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo font-display font-bold text-white">{i + 1}</span>
              <span className="text-lead">{t(k)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pick" className="mt-12">
        <h2 id="pick" className="font-display text-headline font-bold">
          {t("signIn")}
        </h2>
        <p className="mt-2 text-muted">{t("signInHint")}</p>
        <div className="mt-6">
          {accounts.isLoading && <Loading />}
          <ErrorNote error={accounts.error ?? login.error} onRetry={accounts.error ? () => void accounts.refetch() : undefined} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.data?.map((a) => {
              const r = ROLE[a.role];
              return (
                <li key={a.account_id}>
                  <button
                    onClick={() => choose(a.account_id)}
                    disabled={login.isPending}
                    className="tile flex w-full items-center gap-4 text-left transition-colors hover:border-indigo disabled:opacity-60"
                  >
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-chip ${r.tint}`}>
                      <r.icon className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lead font-semibold">{a.label}</span>
                      <span className="block text-small text-muted">
                        {t(r.label)}, {a.area}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
