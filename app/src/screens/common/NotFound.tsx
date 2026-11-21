import { Link } from "react-router-dom";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";

export default function NotFound() {
  const { t } = useT();
  return (
    <Screen titleKey="notFound.title">
      <p>{t("notFound.body")}</p>
      <Link
        to="/login"
        className="inline-flex min-h-[48px] w-fit items-center rounded-lg bg-amber-800 px-4 font-semibold text-white"
      >
        {t("notFound.home")}
      </Link>
    </Screen>
  );
}
