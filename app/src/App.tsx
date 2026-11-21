import { lazy, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RootRedirect, SectionGuard } from "./components/RoleGuard";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/ToastProvider";
import LiveStatusNote from "./components/LiveStatusNote";
import { LiveEventsProvider } from "./hooks/useLiveEvents";
import Login from "./screens/common/Login";

// Lazy-load every screen except login so the first load stays small.
function lazyNamed<T extends Record<string, ComponentType>>(load: () => Promise<T>, name: keyof T) {
  return lazy(async () => ({ default: (await load())[name] }));
}

const placeholders = () => import("./screens/placeholders");

const DonorHome = lazy(() => import("./screens/donor/DonorHome"));
const DonorPost = lazy(() => import("./screens/donor/DonorPost"));
const DonorListingDetail = lazy(() => import("./screens/donor/DonorListingDetail"));
const DonorImpact = lazyNamed(placeholders, "DonorImpact");
const ReceiverOffers = lazy(() => import("./screens/receiver/ReceiverOffers"));
const ReceiverOfferDetail = lazy(() => import("./screens/receiver/ReceiverOfferDetail"));
const ReceiverNeeds = lazy(() => import("./screens/receiver/ReceiverNeeds"));
const ReceiverHistory = lazy(() => import("./screens/receiver/ReceiverHistory"));
const VolunteerTasks = lazy(() => import("./screens/volunteer/VolunteerTasks"));
const VolunteerTaskDetail = lazy(() => import("./screens/volunteer/VolunteerTaskDetail"));
const VolunteerHistory = lazy(() => import("./screens/volunteer/VolunteerHistory"));
const SponsorDashboard = lazy(() => import("./screens/sponsor/SponsorDashboard"));
const SponsorMap = lazy(() => import("./screens/sponsor/SponsorMap"));
const About = lazy(() => import("./screens/common/About"));
const NotFound = lazy(() => import("./screens/common/NotFound"));

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <SectionGuard />,
        children: [
          { path: "/", element: <RootRedirect /> },
          { path: "/login", element: <Login /> },

          { path: "/donor", element: <DonorHome /> },
          { path: "/donor/post", element: <DonorPost /> },
          { path: "/donor/listings/:id", element: <DonorListingDetail /> },
          { path: "/donor/impact", element: <DonorImpact /> },

          { path: "/receiver", element: <ReceiverOffers /> },
          { path: "/receiver/offers/:id", element: <ReceiverOfferDetail /> },
          { path: "/receiver/needs", element: <ReceiverNeeds /> },
          { path: "/receiver/history", element: <ReceiverHistory /> },

          { path: "/volunteer", element: <VolunteerTasks /> },
          { path: "/volunteer/tasks/:id", element: <VolunteerTaskDetail /> },
          { path: "/volunteer/history", element: <VolunteerHistory /> },

          { path: "/sponsor", element: <SponsorDashboard /> },
          { path: "/sponsor/map", element: <SponsorMap /> },

          { path: "/about", element: <About /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LiveEventsProvider>
          <LiveStatusNote />
          <RouterProvider router={router} />
        </LiveEventsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
