import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Role } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { LanguageToggle } from "../../components/LanguageToggle";
import { LogoMark } from "../../components/TopBar";
import { Icon, type IconName } from "../../components/ui/Icon";
import { DemoDataBadge } from "../../components/DemoDataBadge";
import { useDemo } from "../../components/demo/demoContext";
import { demoAccounts } from "../../components/demo/demoAccounts";
import { ROLE_HOME } from "../../components/roles";
import { formatNumber } from "../../components/food/format";
import { HERO_VIDEO, PHOTOS, heroVideoAllowed, photo, photoSet } from "../../lib/media";

// Public homepage (redesign): dark and photographic, like a campaign site. Everything a visitor
// can do starts here: run the one-minute demo, or step into any role with one tap.

// Demo numbers (fictional), the same as the sign-in page shows.
const WEEK = { meals: 3120, kitchens: 9, minutes: 6, co2: 3120 };

const STEPS: { n: string; photoId: string; title: MessageKey; body: MessageKey }[] = [
  {
    n: "01",
    photoId: PHOTOS.thaliSilver,
    title: "landing.step1.title",
    body: "landing.step1.body",
  },
  {
    n: "02",
    photoId: PHOTOS.communityCooking,
    title: "landing.step2.title",
    body: "landing.step2.body",
  },
  {
    n: "03",
    photoId: PHOTOS.packingMeals,
    title: "landing.step3.title",
    body: "landing.step3.body",
  },
  { n: "04", photoId: PHOTOS.clayPots, title: "landing.step4.title", body: "landing.step4.body" },
];

const ROLES: {
  role: Role;
  photoId: string;
  title: MessageKey;
  body: MessageKey;
  cta: MessageKey;
}[] = [
  {
    role: "donor",
    photoId: PHOTOS.weddingBuffet,
    title: "landing.role.donor",
    body: "landing.role.donorBody",
    cta: "landing.role.donorCta",
  },
  {
    role: "receiver",
    photoId: PHOTOS.bigPot,
    title: "landing.role.receiver",
    body: "landing.role.receiverBody",
    cta: "landing.role.receiverCta",
  },
  {
    role: "volunteer",
    photoId: PHOTOS.packingBags,
    title: "landing.role.volunteer",
    body: "landing.role.volunteerBody",
    cta: "landing.role.volunteerCta",
  },
  {
    role: "sponsor",
    photoId: PHOTOS.charminar,
    title: "landing.role.sponsor",
    body: "landing.role.sponsorBody",
    cta: "landing.role.sponsorCta",
  },
];

const TRUST: { icon: IconName; title: MessageKey; body: MessageKey }[] = [
  { icon: "clock", title: "landing.trust.safety", body: "landing.trust.safetyBody" },
  { icon: "check", title: "landing.trust.codes", body: "landing.trust.codesBody" },
  { icon: "pin", title: "landing.trust.privacy", body: "landing.trust.privacyBody" },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-mint sm:text-sm">{children}</p>
  );
}

function SectionTitle({ children, className = "" }: { children: string; className?: string }) {
  return (
    <h2
      className={`font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl ${className}`}
    >
      {children}
    </h2>
  );
}

function HeroMedia() {
  const ref = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState(false);
  useEffect(() => setVideo(heroVideoAllowed()), []);
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-night">
      <img src={HERO_VIDEO.poster} alt="" className="h-full w-full object-cover" />
      {video && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO.src}
          poster={HERO_VIDEO.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideo(false)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/50 sm:bg-gradient-to-r sm:via-night/50 sm:to-night/10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/80 to-transparent" />
    </div>
  );
}

export default function Landing() {
  const { t, lang } = useT();
  const { login } = useAuth();
  const { state, start } = useDemo();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState<Role | null>(null);

  const tryRole = async (role: Role) => {
    setSigningIn(role);
    try {
      const account = (await demoAccounts()).find((a) => a.role === role);
      if (!account) throw new Error("no account");
      const user = await login(account.account_id);
      navigate(ROLE_HOME[user.role]);
    } catch {
      navigate("/login");
    }
    setSigningIn(null);
  };

  const demoBusy = state.phase === "starting" || state.phase === "running";
  const n = (v: number) => formatNumber(v, lang);

  return (
    <div className="bg-night text-white">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-night/70 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link to="/" className="flex min-h-12 items-center gap-2" aria-label={t("app.name")}>
            <LogoMark className="h-9 w-9" />
            <span className="brand-name hidden font-display text-lg font-black uppercase tracking-tight sm:inline">
              {t("app.name")}
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-bold text-white/80 lg:flex">
            <a href="#how" className="hover:text-white">
              {t("landing.nav.how")}
            </a>
            <a href="#roles" className="hover:text-white">
              {t("landing.nav.roles")}
            </a>
            <a href="#impact" className="hover:text-white">
              {t("landing.nav.impact")}
            </a>
            <Link to="/demo-guide" className="hover:text-white">
              {t("demo.guide.title")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link
              to="/login"
              className="flex min-h-12 items-center whitespace-nowrap rounded-full bg-turmeric-400 px-5 text-sm font-bold text-ink hover:bg-turmeric-300"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-10 pt-28 sm:items-center sm:pb-16">
        <HeroMedia />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6">
          <Eyebrow>{t("landing.hero.eyebrow")}</Eyebrow>
          <h1 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            {t("landing.hero.line1")}
            <br />
            <span className="text-turmeric-400">{t("landing.hero.line2")}</span>
          </h1>
          <p className="max-w-xl text-lg text-white/85 sm:text-xl">{t("landing.hero.body")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void start()}
              disabled={demoBusy}
              className="flex min-h-14 items-center gap-2 rounded-full bg-turmeric-400 px-7 text-base font-bold text-ink shadow-lift transition hover:bg-turmeric-300 disabled:opacity-60"
            >
              <span aria-hidden="true">▶</span>
              {state.phase === "starting" ? t("demo.run.starting") : t("landing.hero.demo")}
            </button>
            <a
              href="#roles"
              className="flex min-h-14 items-center gap-2 rounded-full px-6 text-base font-bold text-white ring-2 ring-inset ring-white/40 hover:bg-white/10"
            >
              {t("landing.hero.roles")}
              <Icon name="arrowRight" className="h-5 w-5" />
            </a>
          </div>
          {state.error && (
            <p role="alert" className="font-medium text-chilli-100">
              {state.error}
            </p>
          )}
          <dl className="mt-4 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/15 pt-5">
            {[
              { v: n(WEEK.meals), l: t("login.weekMeals") },
              { v: String(WEEK.kitchens), l: t("login.weekKitchens") },
              { v: String(WEEK.minutes), l: t("login.weekMinutes") },
            ].map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-3xl font-black text-turmeric-400 sm:text-4xl">
                  {s.v}
                </dd>
                <dd className="text-xs text-white/70 sm:text-sm">{s.l}</dd>
              </div>
            ))}
          </dl>
          <p className="flex items-center gap-2 text-xs text-white/60">
            {t("landing.hero.week")} <DemoDataBadge />
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("landing.how.eyebrow")}</Eyebrow>
            <SectionTitle>{t("landing.how.title")}</SectionTitle>
            <p className="max-w-2xl text-lg text-white/75">{t("landing.how.body")}</p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="group overflow-hidden rounded-3xl bg-night-800 ring-1 ring-white/10"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-night-700">
                  <img
                    src={photo(s.photoId, 600, 450)}
                    srcSet={photoSet(s.photoId, 600, 450)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-night/80 px-3 py-1 font-display text-sm font-black text-turmeric-400">
                    {s.n}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-5">
                  <h3 className="font-display text-xl font-black uppercase">{t(s.title)}</h3>
                  <p className="text-white/75">{t(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why */}
      <section className="bg-night-800 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-night-700">
            <img
              src={photo(PHOTOS.weddingBuffet, 900, 700)}
              srcSet={photoSet(PHOTOS.weddingBuffet, 900, 700)}
              alt={t("landing.why.photoAlt")}
              loading="lazy"
              className="aspect-[9/7] w-full object-cover"
            />
            <p className="absolute bottom-4 left-4 rounded-full bg-night/85 px-4 py-2 font-display text-sm font-black uppercase text-turmeric-400">
              {t("landing.why.time")}
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <Eyebrow>{t("landing.why.eyebrow")}</Eyebrow>
            <SectionTitle>{t("landing.why.title")}</SectionTitle>
            <p className="text-lg text-white/80">{t("landing.why.body1")}</p>
            <p className="text-lg text-white/80">{t("landing.why.body2")}</p>
            <p className="border-l-4 border-turmeric-400 pl-4 text-xl font-bold">
              {t("landing.why.quote")}
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("landing.roles.eyebrow")}</Eyebrow>
            <SectionTitle>{t("landing.roles.title")}</SectionTitle>
            <p className="max-w-2xl text-lg text-white/75">{t("landing.roles.body")}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <li key={r.role}>
                <button
                  type="button"
                  onClick={() => void tryRole(r.role)}
                  disabled={signingIn !== null}
                  className="group relative flex min-h-[26rem] w-full flex-col justify-end overflow-hidden rounded-3xl bg-night-700 p-5 text-left ring-1 ring-white/10 transition hover:ring-turmeric-400 disabled:opacity-70"
                >
                  <img
                    src={photo(r.photoId, 500, 700)}
                    srcSet={photoSet(r.photoId, 500, 700)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent" />
                  <span className="relative flex flex-col gap-2">
                    <span className="font-display text-2xl font-black uppercase">{t(r.title)}</span>
                    <span className="text-white/85">{t(r.body)}</span>
                    <span className="mt-2 inline-flex min-h-12 items-center gap-2 self-start rounded-full bg-white px-4 text-sm font-bold text-night">
                      {signingIn === r.role ? t("login.signingIn") : t(r.cta)}
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-night-800 py-20 sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("landing.trust.eyebrow")}</Eyebrow>
            <SectionTitle>{t("landing.trust.title")}</SectionTitle>
          </div>
          <ul className="grid gap-5 md:grid-cols-3">
            {TRUST.map((x) => (
              <li key={x.title} className="flex flex-col gap-3 rounded-3xl bg-night-700 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-night">
                  <Icon name={x.icon} className="h-6 w-6" />
                </span>
                <h3 className="font-display text-xl font-black uppercase">{t(x.title)}</h3>
                <p className="text-white/75">{t(x.body)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="scroll-mt-16 bg-turmeric-400 py-16 text-ink sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle>{t("landing.impact.title")}</SectionTitle>
            <DemoDataBadge />
          </div>
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { v: n(WEEK.meals), l: t("login.weekMeals") },
              { v: n(Math.round(WEEK.meals * 0.4)), l: t("landing.impact.kg") },
              { v: n(WEEK.co2), l: t("landing.impact.co2") },
              { v: String(WEEK.kitchens), l: t("login.weekKitchens") },
            ].map((s) => (
              <div key={s.l} className="border-t-4 border-ink pt-3">
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-5xl font-black sm:text-6xl">{s.v}</dd>
                <dd className="font-bold text-ink/80">{s.l}</dd>
              </div>
            ))}
          </dl>
          <p className="max-w-3xl text-ink/80">{t("landing.impact.note")}</p>
        </div>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <img
          src={photo(PHOTOS.charminar, 1600, 900)}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/30" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <Eyebrow>{t("landing.cta.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.cta.title")}</SectionTitle>
          <p className="max-w-2xl text-lg text-white/80">{t("landing.cta.body")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void start()}
              disabled={demoBusy}
              className="flex min-h-14 items-center gap-2 rounded-full bg-turmeric-400 px-7 font-bold text-ink hover:bg-turmeric-300 disabled:opacity-60"
            >
              <span aria-hidden="true">▶</span>
              {t("landing.hero.demo")}
            </button>
            <Link
              to="/demo-guide"
              className="flex min-h-14 items-center rounded-full px-6 font-bold text-white ring-2 ring-inset ring-white/40 hover:bg-white/10"
            >
              {t("demo.guide.link")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-sm text-white/70 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-2">
            <span className="flex items-center gap-2 font-display text-lg font-black uppercase text-white">
              <LogoMark className="h-8 w-8" />
              {t("app.name")}
            </span>
            <p>{t("app.tagline")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="font-bold text-white hover:underline">
              {t("nav.about")}
            </Link>
            <Link to="/demo-guide" className="font-bold text-white hover:underline">
              {t("demo.guide.title")}
            </Link>
            <Link to="/login" className="font-bold text-white hover:underline">
              {t("landing.signIn")}
            </Link>
          </div>
          <div className="flex max-w-sm flex-col gap-2">
            <p>{t("landing.footer.data")}</p>
            <p>{t("landing.footer.credits")}</p>
            <p>{t("landing.footer.event")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
