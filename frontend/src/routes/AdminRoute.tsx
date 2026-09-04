import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/auth/state/auth.store";
import { getUserRole, UserRole } from "../features/auth/types/auth.types";

interface AdminRouteProps {
  allowedRoles?: UserRole[];
}

export function AdminRoute({ allowedRoles = ["admin"] }: AdminRouteProps = {}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = getUserRole(user);
  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
