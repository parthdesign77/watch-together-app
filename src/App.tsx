import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { BillingPage } from "./pages/BillingPage";
import { CatalogPage } from "./pages/CatalogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DetailPage } from "./pages/DetailPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PricingPage } from "./pages/PricingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  AdminPage,
  ContinueWatchingPage,
  NotFoundPage,
  NotificationsPage,
  OAuthScreen,
  PaymentFailedPage,
  PaymentSuccessPage,
  RoomExpiredPage
} from "./pages/UtilityPages";
import { WatchRoomPage } from "./pages/WatchRoomPage";
import { WatchlistPage } from "./pages/WatchlistPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/room-expired" element={<RoomExpiredPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
