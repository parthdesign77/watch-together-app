import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="Watch Together" 
              className="h-16 w-auto object-contain animate-pulse drop-shadow-[0_0_15px_rgba(255,61,71,0.6)]" 
            />
          </div>
          <div className="glass flex items-center gap-2.5 rounded-[16px] px-4 py-2 border border-white/5 bg-[#111111]/80 backdrop-blur-md shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-[#ff3d47]" />
            <span className="font-bold text-xs tracking-wide text-neutral-300">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
