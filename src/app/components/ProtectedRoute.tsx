import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "guru" | "siswa")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While the initial session check is running, show a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-[48px] h-[48px] border-4 border-[#e2e8f0] border-t-[#1294f2] rounded-full animate-spin mx-auto mb-[16px]" />
          <p className="font-['Poppins'] text-[14px] text-[#64748b]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "admin") return <Navigate to="/dashboard-admin" replace />;
    if (user.role === "guru") return <Navigate to="/dashboard-guru" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
