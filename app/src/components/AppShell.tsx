import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { roleFromPath } from "./roles";
import { useLiveToasts } from "../hooks/useLiveToasts";

function Loading() {
  return (
    <div className="flex justify-center py-16" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-100 border-t-leaf-700" />
    </div>
  );
}

export function AppShell() {
  useLiveToasts();
  const { pathname } = useLocation();
  const role = roleFromPath(pathname);
  return (
    <div className="min-h-screen">
      <TopBar />
      <main
        className={`mx-auto max-w-xl px-4 py-4 print:max-w-none print:p-0 ${role ? "pb-28" : ""}`}
      >
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      {role && <BottomNav role={role} />}
    </div>
  );
}
