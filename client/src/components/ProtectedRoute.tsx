import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/store/auth";

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // Force password change before anything else.
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
