import type { Role } from "../../types/api";
import { apiRequest } from "../../services/api";

export type AccountSummary = { account_id: string; role: Role; label: string; area: string };

let cached: Promise<AccountSummary[]> | null = null;

/** GET /api/demo/accounts, fetched once per page load (a failed fetch is tried again next time). */
export function demoAccounts(): Promise<AccountSummary[]> {
  cached ??= apiRequest<AccountSummary[]>("GET", "/api/demo/accounts").catch((err: unknown) => {
    cached = null;
    throw err;
  });
  return cached;
}

/** The scenario's donor (Sri Sai Caterers) and the sponsor, who may always start the scenario. */
export function scenarioAccounts(accounts: AccountSummary[]): {
  donor?: AccountSummary;
  sponsor?: AccountSummary;
} {
  return {
    donor:
      accounts.find((a) => a.role === "donor" && /sri sai/i.test(a.label)) ??
      accounts.find((a) => a.role === "donor"),
    sponsor: accounts.find((a) => a.role === "sponsor"),
  };
}
