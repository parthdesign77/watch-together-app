import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] text-white">
        <img 
          src="/logo.png" 
          alt="Watch Together" 
          className="h-16 w-auto object-contain animate-rotate-logo" 
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] text-white">
        <img 
          src="/logo.png" 
          alt="Watch Together" 
          className="h-16 w-auto object-contain animate-rotate-logo" 
        />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    // If not admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
