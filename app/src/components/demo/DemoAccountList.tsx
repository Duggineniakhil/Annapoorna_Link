import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "../../types/api";
import { useAuth } from "../../auth/useAuth";
import { useT } from "../../i18n";
import { ROLE_HOME } from "../roles";
import { Icon, type IconName } from "../ui/Icon";
import { demoAccounts, type AccountSummary } from "./demoAccounts";

const ROLE_ICON: Record<Role, IconName> = {
  donor: "plus",
  receiver: "inbox",
  volunteer: "bike",
  sponsor: "chart",
};

/**
 * One tap to become any of the six demo accounts (A14). Signing in never changes the app
 * language, so a Telugu demo stays in Telugu. "menu" rows sit in the account menu; "cards" on
 * /demo-guide.
 */
export function DemoAccountList({
  variant,
  onPicked,
}: {
  variant: "menu" | "cards";
  onPicked?: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const { t } = useT();
  const { user, isLoggedIn, login, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    demoAccounts()
      .then((list) => live && setAccounts(list))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const pick = async (e: MouseEvent<HTMLButtonElement>, accountId: string) => {
    onPicked?.(e);
    setBusy(accountId);
    try {
      const next = await (isLoggedIn ? switchAccount(accountId) : login(accountId));
      navigate(ROLE_HOME[next.role], { replace: true });
    } catch {
      // A failed switch keeps the previous session.
    }
    setBusy(null);
  };

  if (failed) return <p className="px-4 py-2 text-sm text-ink/70">{t("login.loadError")}</p>;
  if (!accounts) return <p className="px-4 py-2 text-sm text-ink/70">{t("login.loading")}</p>;

  if (variant === "menu") {
    return (
      <>
        {accounts
          .filter((acc) => acc.account_id !== user?.id && acc.label !== user?.display_name)
          .map((acc) => (
            <button
              key={acc.account_id}
              type="button"
              onClick={(e) => void pick(e, acc.account_id)}
              className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left hover:bg-leaf-50"
            >
              <Icon name={ROLE_ICON[acc.role]} className="h-5 w-5 shrink-0 text-leaf-700" />
              <span className="flex flex-col leading-tight">
                <span>{acc.label}</span>
                <span className="text-xs text-ink/70">{t(`role.${acc.role}`)}</span>
              </span>
            </button>
          ))}
      </>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
      {accounts.map((acc) => {
        const current = acc.account_id === user?.id || acc.label === user?.display_name;
        return (
          <li key={acc.account_id}>
            <button
              type="button"
              disabled={busy !== null || current}
              onClick={(e) => void pick(e, acc.account_id)}
              className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left shadow-card ring-1 ring-ink/5 hover:ring-leaf-700/40 disabled:opacity-60"
            >
              <Icon name={ROLE_ICON[acc.role]} className="h-5 w-5 shrink-0 text-leaf-700" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-bold text-ink">{acc.label}</span>
                <span className="text-xs text-ink/70">
                  {current ? t("demo.accounts.current") : `${t(`role.${acc.role}`)} · ${acc.area}`}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
