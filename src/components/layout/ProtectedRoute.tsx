import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] text-white">
        <div className="glass flex items-center gap-3 rounded-[20px] p-5 border border-white/5 bg-[#111111]">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff3d47]" />
          <span className="font-bold text-sm">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
