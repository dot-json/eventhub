import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth, useUser } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: "CUSTOMER" | "ORGANIZER" | "ADMIN";
  fallbackPath?: string;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRole,
  fallbackPath = "/login",
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (requireAuth && !isAuthenticated()) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "ADMIN") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
