import { Link } from "react-router-dom";
import type { Role } from "../../types/api";
import type { MessageKey } from "../../i18n/en";
import { useT } from "../../i18n";
import { Screen } from "../../components/Screen";
import { ROLE_HOME } from "../../components/roles";

// Placeholder: real demo accounts come from GET /api/demo/accounts in task A3.
const ROLES: { role: Role; icon: string; hintKey: MessageKey }[] = [
  { role: "donor", icon: "🍲", hintKey: "login.donorHint" },
  { role: "receiver", icon: "🏠", hintKey: "login.receiverHint" },
  { role: "volunteer", icon: "🛵", hintKey: "login.volunteerHint" },
  { role: "sponsor", icon: "📊", hintKey: "login.sponsorHint" },
];

export default function Login() {
  const { t } = useT();
  return (
    <Screen titleKey="login.title" demoData>
      <p className="text-gray-600">{t("login.subtitle")}</p>
      <ul className="flex flex-col gap-3">
        {ROLES.map(({ role, icon, hintKey }) => (
          <li key={role}>
            <Link
              to={ROLE_HOME[role]}
              className="flex min-h-[64px] items-center gap-4 rounded-xl border border-amber-900/15 bg-white p-4 shadow-sm hover:border-amber-700"
            >
              <span aria-hidden="true" className="text-3xl">
                {icon}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold text-amber-950">
                  {t("login.continueAs", { role: t(`role.${role}`) })}
                </span>
                <span className="text-sm text-gray-600">{t(hintKey)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
