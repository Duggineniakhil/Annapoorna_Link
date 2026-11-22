import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { roleFromPath } from "./roles";
import { useLiveToasts } from "../hooks/useLiveToasts";
import { DemoProvider } from "./demo/DemoProvider";

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
  // The public homepage ("/" when logged out) is full-bleed, with its own header.
  const bare = pathname === "/";
  return (
    <DemoProvider>
      {bare ? (
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      ) : (
        <div className={`min-h-screen ${role ? "bg-mist" : ""}`}>
          <TopBar />
          {role && <SideNav role={role} />}
          <div className={role ? "md:pl-64" : ""}>
            <main
              className={`mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-10 print:max-w-none print:p-0 ${
                role ? "pb-28 md:pb-10" : ""
              }`}
            >
              <Suspense fallback={<Loading />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
          {role && <BottomNav role={role} />}
        </div>
      )}
    </DemoProvider>
  );
}
