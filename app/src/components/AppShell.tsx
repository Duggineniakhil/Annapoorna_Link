import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { roleFromPath } from "./roles";

export function AppShell() {
  const { pathname } = useLocation();
  const role = roleFromPath(pathname);
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className={`mx-auto max-w-xl px-4 py-4 ${role ? "pb-24" : ""}`}>
        <Suspense fallback={<div className="py-10 text-center text-gray-500">…</div>}>
          <Outlet />
        </Suspense>
      </main>
      {role && <BottomNav role={role} />}
    </div>
  );
}
