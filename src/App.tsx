import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute, AdminRoute } from "./components/layout/ProtectedRoute";
import { useUISound } from "./hooks/useUISound";
import { useAuth } from "./context/AuthContext";

// Lazy loaded page components to optimize bundle size and rendering speeds
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const CatalogPage = lazy(() => import("./pages/CatalogPage").then(m => ({ default: m.CatalogPage })));
const DetailPage = lazy(() => import("./pages/DetailPage").then(m => ({ default: m.DetailPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then(m => ({ default: m.SearchPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const WatchRoomPage = lazy(() => import("./pages/WatchRoomPage").then(m => ({ default: m.WatchRoomPage })));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage").then(m => ({ default: m.WatchlistPage })));
const PricingPage = lazy(() => import("./pages/PricingPage").then(m => ({ default: m.PricingPage })));
const BillingPage = lazy(() => import("./pages/BillingPage").then(m => ({ default: m.BillingPage })));

// Dynamic named imports from UtilityPages
const AdminPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.AdminPage })));
const ContinueWatchingPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.ContinueWatchingPage })));
const NotFoundPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.NotFoundPage })));
const NotificationsPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.NotificationsPage })));
const OAuthScreen = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.OAuthScreen })));
const PaymentFailedPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.PaymentFailedPage })));
const PaymentSuccessPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.PaymentSuccessPage })));
const RoomExpiredPage = lazy(() => import("./pages/UtilityPages").then(m => ({ default: m.RoomExpiredPage })));

function GlobalLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#030303] text-white">
      <div className="flex flex-col items-center justify-center">
        <img 
          src="/logo.png" 
          alt="Watch Together" 
          className="h-16 w-auto object-contain animate-rotate-logo" 
        />
      </div>
    </div>
  );
}

export function App() {
  const { play } = useUISound();
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Detect and redirect first-time visitors to `/login` before allowing access to LandingPage or Dashboard
  useEffect(() => {
    if (loading) return;

    const hasVisited = localStorage.getItem("hasVisitedBefore");
    const isAuthRoute = location.pathname === "/login" || location.pathname.startsWith("/oauth");

    if (!hasVisited && !isAuthRoute && !user) {
      localStorage.setItem("hasVisitedBefore", "true");
      navigate("/login", { replace: true, state: { from: location } });
    } else if (!hasVisited && user) {
      localStorage.setItem("hasVisitedBefore", "true");
    }
  }, [loading, location.pathname, navigate, user]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Exclude sliders/range inputs, text inputs, textareas, select, and video tags
      if (target.closest('input[type="range"]') || target.closest('video')) {
        return;
      }

      const tagName = target.tagName?.toLowerCase();
      if (
        (tagName === "input" && 
         !["button", "submit", "checkbox", "radio"].includes((target as HTMLInputElement).type)) ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }

      // Find if we clicked a button/link or an interactive element
      const button = target.closest("button") || target.closest('[role="button"]');
      
      // If we found a button/role-button, verify it's not disabled
      if (button && ((button as HTMLButtonElement).disabled || button.getAttribute("aria-disabled") === "true")) {
        return;
      }

      const isInteractive =
        button ||
        target.closest("a") ||
        target.closest(".cursor-pointer") ||
        window.getComputedStyle(target).cursor === "pointer";

      if (isInteractive) {
        // Defer with setTimeout to allow any specific click handlers to play their specific sound first
        setTimeout(() => {
          play("click");
        }, 0);
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [play]);

  const hasVisited = localStorage.getItem("hasVisitedBefore");
  const isAuthRoute = location.pathname === "/login" || location.pathname.startsWith("/oauth");

  // Gating page-renders until auth hydrates or redirect is executed
  if (loading || (!hasVisited && !isAuthRoute && !user)) {
    return <GlobalLoader />;
  }

  return (
    <Suspense fallback={<GlobalLoader />}>
      <Routes>
        {/* Instant redirects for authenticated users to bypass fetching LandingPage or LoginPage chunks */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/oauth/google" element={<OAuthScreen provider="Google" />} />
        <Route path="/oauth/microsoft" element={<OAuthScreen provider="Microsoft" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/room/:roomId" element={<WatchRoomPage />} />
          <Route path="/screen-share/:roomId" element={<WatchRoomPage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/movies" element={<CatalogPage type="movie" />} />
            <Route path="/movies/:id" element={<DetailPage type="movie" />} />
            <Route path="/anime" element={<CatalogPage type="anime" />} />
            <Route path="/anime/:id" element={<DetailPage type="anime" />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audio-settings" element={<SettingsPage />} />
            <Route path="/streaming-settings" element={<SettingsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/subscription" element={<BillingPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-failed" element={<PaymentFailedPage />} />
            <Route path="/continue-watching" element={<ContinueWatchingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/room-expired" element={<RoomExpiredPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
