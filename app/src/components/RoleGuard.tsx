import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_HOME, resolveRedirect } from "./roles";

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

/** Element for "/": sends a logged-in user to their role home, anyone else to login. */
export function RootRedirect() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }
  return <Navigate to="/login" replace />;
}
