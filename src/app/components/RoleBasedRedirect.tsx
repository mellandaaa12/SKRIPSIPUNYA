import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

/**
 * Component to redirect users to their appropriate dashboard based on role
 */
export function RoleBasedRedirect() {
  const { user, loading } = useAuth();

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

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/dashboard-admin" replace />;
  if (user.role === "guru") return <Navigate to="/dashboard-guru" replace />;
  return <Navigate to="/dashboard" replace />;
}

