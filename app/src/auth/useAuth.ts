import { createContext, useContext } from "react";
import type { Org, User } from "../types/api";

// The auth context and its hook live apart from AuthProvider, so the provider file exports
// only a component (keeps React fast refresh working).

export interface AuthValue {
  token: string | null;
  user: User | null;
  org: Org | null;
  isLoggedIn: boolean;
  login(accountId: string): Promise<User>;
  switchAccount(accountId: string): Promise<User>;
  logout(): void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
