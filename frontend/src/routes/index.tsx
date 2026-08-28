import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { PageLoadingFallback } from "../features/shared";

// Lazy-loaded route components for optimal bundle splitting and initial load performance
const LoginPage = lazy(() =>
  import("../features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../features/auth/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("../features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
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
const PersonDetailsPage = lazy(() =>
  import("../features/people/pages/PersonDetailsPage").then((m) => ({
    default: m.PersonDetailsPage,
  })),
);
const ClientsPage = lazy(() =>
  import("../features/clients/pages/ClientsPage").then((m) => ({
    default: m.ClientsPage,
  })),
);
const ClientDetailsPage = lazy(() =>
  import("../features/clients/pages/ClientDetailsPage").then((m) => ({
    default: m.ClientDetailsPage,
  })),
);

// Admin pages
const AdminTenantsPage = lazy(() =>
  import("../features/admin/pages/AdminTenantsPage").then((m) => ({
    default: m.AdminTenantsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("../features/admin/pages/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/photographers" element={<PhotographersPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:id" element={<PersonDetailsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* SuperAdmin routes */}
            <Route element={<AdminRoute />}>
              <Route
                path="/admin"
                element={<Navigate to="/admin/tenants" replace />}
              />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
