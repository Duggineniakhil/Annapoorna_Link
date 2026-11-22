import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_HOME, resolveRedirect } from "./roles";
import Landing from "../screens/common/Landing";

/** Layout route guard: redirects when the path is not allowed for the current session, else renders the child route. */
export function SectionGuard() {
  const { user } = useAuth();
  const location = useLocation();
  const target = resolveRedirect(user?.role ?? null, location.pathname);
  if (target && target !== location.pathname) {
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

/** Element for "/": sends a logged-in user to their role home, anyone else sees the homepage. */
export function RootRedirect() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }
  return <Landing />;
}
