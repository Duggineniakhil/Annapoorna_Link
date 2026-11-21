import { useT, type Lang } from "../i18n";

const OPTIONS: Lang[] = ["en", "te"];

export function LanguageToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div
      role="group"
      aria-label={t("lang.toggleLabel")}
      className="flex overflow-hidden rounded-full border border-amber-800/40 text-sm"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`min-h-[40px] min-w-[48px] px-3 font-medium ${
            lang === option ? "bg-amber-800 text-white" : "bg-white text-amber-900"
          }`}
        >
          {option === "en" ? t("lang.en") : t("lang.te")}
        </button>
      ))}
    </div>
  );
}
