import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Role } from "./api/types";
import { homeFor, useSession } from "./lib/session";
import { Loading } from "./ui/bits";
import { Shell } from "./ui/Shell";
import { Landing } from "./screens/Landing";
import { DonorHome, ListingDetail, QuickPost } from "./screens/donor";
import { OfferDetail, Offers, ReceiverHistory } from "./screens/receiver";
import { TaskFlow, Tasks } from "./screens/volunteer";
import { CityImpact, DonorImpact } from "./screens/Impact";

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useSession();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

export function App() {
  const { user, ready } = useSession();
  return (
    <Routes>
      <Route path="/" element={ready && user ? <Navigate to={homeFor(user.role)} replace /> : <Landing />} />
      <Route element={<Shell />}>
        <Route path="/donor" element={<Guard role="donor"><DonorHome /></Guard>} />
        <Route path="/donor/post" element={<Guard role="donor"><QuickPost /></Guard>} />
        <Route path="/donor/listings/:id" element={<Guard role="donor"><ListingDetail /></Guard>} />
        <Route path="/donor/impact" element={<Guard role="donor"><DonorImpact /></Guard>} />
        <Route path="/receiver" element={<Guard role="receiver"><Offers /></Guard>} />
        <Route path="/receiver/offers/:id" element={<Guard role="receiver"><OfferDetail /></Guard>} />
        <Route path="/receiver/history" element={<Guard role="receiver"><ReceiverHistory /></Guard>} />
        <Route path="/volunteer" element={<Guard role="volunteer"><Tasks /></Guard>} />
        <Route path="/volunteer/tasks/:id" element={<Guard role="volunteer"><TaskFlow /></Guard>} />
        <Route path="/sponsor" element={<Guard role="sponsor"><CityImpact /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
