import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/auth/state/auth.store";
import { PendingApprovalPage } from "../features/auth/pages/PendingApprovalPage";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.tenantId) {
    return <PendingApprovalPage />;
  }

  return <Outlet />;
}
