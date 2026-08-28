import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageLoadingFallback } from "../features/shared";

// Lazy-loaded route components for optimal bundle splitting and initial load performance
const LoginPage = lazy(() =>
  import("../features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../features/profile/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);

// New pages for Photo Storage
const SeasonsPage = lazy(() =>
  import("../features/seasons/pages/SeasonsPage").then((m) => ({
    default: m.SeasonsPage,
  })),
);
const PhotographersPage = lazy(() =>
  import("../features/photographers/pages/PhotographersPage").then((m) => ({
    default: m.PhotographersPage,
  })),
);
const PeoplePage = lazy(() =>
  import("../features/people/pages/PeoplePage").then((m) => ({
    default: m.PeoplePage,
  })),
);
const ClientsPage = lazy(() =>
  import("../features/clients/pages/ClientsPage").then((m) => ({
    default: m.ClientsPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/photographers" element={<PhotographersPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
