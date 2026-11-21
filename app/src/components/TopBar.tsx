import { Link } from "react-router-dom";
import { useT } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";

export function TopBar() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-amber-900/10 bg-[#fffdf7]/95 px-4 py-2 backdrop-blur">
      <Link
        to="/login"
        className="flex min-h-[48px] items-center gap-2 font-semibold text-amber-900"
      >
        <span aria-hidden="true" className="text-2xl">
          🍲
        </span>
        <span>{t("app.name")}</span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <details className="relative">
          <summary
            className="flex min-h-[48px] min-w-[48px] cursor-pointer list-none items-center justify-center rounded-full text-xl"
            aria-label={t("common.account")}
          >
            👤
          </summary>
          <div className="absolute right-0 mt-1 w-48 rounded-lg border border-amber-900/10 bg-white py-1 shadow-lg">
            <Link to="/login" className="block min-h-[44px] px-4 py-3 hover:bg-amber-50">
              {t("common.switchAccount")}
            </Link>
            <Link to="/about" className="block min-h-[44px] px-4 py-3 hover:bg-amber-50">
              {t("nav.about")}
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
