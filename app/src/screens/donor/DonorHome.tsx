import { Link } from "react-router-dom";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";

export default function DonorHome() {
  const { t } = useT();
  return (
    <Screen titleKey="donor.home.title" demoData>
      <Link
        to="/donor/post"
        className="flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-amber-800 text-lg font-semibold text-white shadow"
      >
        <span aria-hidden="true">➕</span>
        {t("donor.home.postButton")}
      </Link>
      <EmptyState icon="🍽️" message={t("donor.home.empty")} />
    </Screen>
  );
}
