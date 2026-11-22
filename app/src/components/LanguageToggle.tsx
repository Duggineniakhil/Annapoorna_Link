import { useT, type Lang } from "../i18n";

const OPTIONS: Lang[] = ["en", "te"];

export function LanguageToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div
      role="group"
      aria-label={t("lang.toggleLabel")}
      className="flex rounded-full bg-leaf-50 text-sm ring-1 ring-inset ring-leaf-800/15"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`min-h-12 min-w-12 rounded-full px-3 font-bold transition-colors ${
            lang === option ? "bg-leaf-800 text-white" : "text-leaf-800"
          }`}
        >
          {option === "en" ? t("lang.en") : t("lang.te")}
        </button>
      ))}
    </div>
  );
}
