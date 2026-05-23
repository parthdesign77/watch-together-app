import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CreditCard,
  Film,
  Home,
  Library,
  LogOut,
  Menu,
  MonitorPlay,
  Search,
  Settings,
  Shield,
  Sparkles,
  Tv,
  User
} from "lucide-react";
import { useState, Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUiStore } from "../../store/uiStore";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ToastViewport } from "../ui/ToastViewport";
import { MobileProfileModal } from "../ui/MobileProfileModal";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/anime", label: "Anime", icon: Tv },
  { href: "/watchlist", label: "Watchlist", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/pricing", label: "Pricing", icon: Sparkles }
];

const utilityItems = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

function ShellLink({ href, label, icon: Icon, onClick }: (typeof navItems)[number] & { onClick?: () => void }) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition border ${
          isActive 
            ? "bg-[#ff3d47]/10 text-snow border-[#ff3d47]/80" 
            : "border-transparent text-muted hover:bg-white/8 hover:text-snow"
        }`
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { profile, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const handleLinkClick = () => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  };

  const filteredUtilityItems = utilityItems.filter(item => {
    if (item.href === "/admin") {
      return profile?.role === "admin";
    }
    return true;
  });

  return (
    <div className="min-h-[100dvh] lg:min-h-screen bg-cinema-radial text-snow overflow-x-hidden">
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink/70 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Toggle navigation">
              <Menu className="h-5 w-5" />
            </Button>
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Watch Together Logo" 
                className="h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,61,71,0.5)] transition-transform hover:scale-105 duration-300"
                style={{ maxHeight: "36px" }}
              />
              <span>
                <span className="block font-display text-base font-extrabold leading-4">Watch Together</span>
                <span className="text-xs text-muted">Cinema rooms in sync</span>
              </span>
            </NavLink>
          </div>

          {/* Mobile Profile Trigger (Hidden on Desktop/PC) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileProfileOpen(true)}
              className="flex rounded-full transition hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Open Profile Settings"
            >
              <Avatar user={profile} />
            </button>
          </div>

          <div className="relative hidden items-center gap-2 md:flex">
            <Badge tone={profile?.premiumBadge ? "purple" : profile?.subscriptionPlan === "standard" ? "cyan" : "muted"}>
              {profile?.subscriptionPlan || "free"}
            </Badge>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex rounded-full transition hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="User Profile"
            >
              <Avatar user={profile} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-lg border border-white/10 bg-ink/90 p-4 shadow-glow-lg backdrop-blur-2xl"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <Avatar user={profile} size="md" />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-bold text-snow">{profile?.name || "Guest"}</p>
                        <p className="truncate text-xs text-muted">{profile?.email}</p>
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted">
                        <span>Current Plan</span>
                        <Badge tone={profile?.premiumBadge ? "purple" : profile?.subscriptionPlan === "standard" ? "cyan" : "muted"}>
                          {profile?.subscriptionPlan || "free"}
                        </Badge>
                      </div>
                      <NavLink
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-white/8 hover:text-snow transition"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </NavLink>
                      <NavLink
                        to="/billing"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-white/8 hover:text-snow transition"
                      >
                        <CreditCard className="h-4 w-4" />
                        Billing & Plans
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-white/8 hover:text-snow transition"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </NavLink>
                    </div>

                    <div className="border-t border-white/10 pt-2">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Persistent) */}
      <aside className="fixed bottom-0 left-0 top-16 z-25 w-72 border-r border-[#ff3d47]/20 bg-ink p-4 hidden lg:block">
        <div className="flex h-full flex-col overflow-y-auto scrollbar-none">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <ShellLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="my-5 h-px bg-white/10" />

          <nav className="space-y-1">
            {filteredUtilityItems.map((item) => (
              <ShellLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-auto glass rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Avatar user={profile} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{profile?.name || "Guest"}</p>
                <p className="truncate text-xs text-muted">{profile?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="mt-3 w-full justify-start" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Animated) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-50 w-72 max-w-[85vw] border-r border-[#ff3d47]/20 bg-ink p-4 pb-6 lg:hidden flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 select-none">
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="Watch Together Logo" 
                    className="h-8 w-auto object-contain drop-shadow-[0_0_6px_rgba(255,61,71,0.5)]"
                    style={{ maxHeight: "32px" }}
                  />
                  <span>
                    <span className="block font-display text-sm font-extrabold leading-4 text-white">Watch Together</span>
                    <span className="text-[10px] text-muted font-semibold">Cinema rooms in sync</span>
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full text-muted hover:text-white" onClick={toggleSidebar} aria-label="Close sidebar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>
              <div className="flex h-full flex-col overflow-y-auto scrollbar-none pb-safe">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <ShellLink key={item.href} {...item} onClick={handleLinkClick} />
                  ))}
                </nav>

                <div className="my-5 h-px bg-white/10" />

                <nav className="space-y-1">
                  {filteredUtilityItems.map((item) => (
                    <ShellLink key={item.href} {...item} onClick={handleLinkClick} />
                  ))}
                </nav>

                <div className="mt-6 glass rounded-lg p-3">
                  <div 
                    onClick={() => {
                      handleLinkClick();
                      setIsMobileProfileOpen(true);
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 rounded-md transition"
                  >
                    <Avatar user={profile} />
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold">{profile?.name || "Guest"}</p>
                      <p className="truncate text-xs text-muted">{profile?.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="mt-3 w-full justify-start" onClick={() => {
                    handleLinkClick();
                    logout();
                  }}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-[100dvh] lg:min-h-screen px-4 pb-24 pt-20 lg:ml-72 lg:px-8 overflow-x-hidden w-full lg:w-[calc(100%-18rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <Suspense fallback={
              <div className="flex h-[50vh] w-full items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Loading..." 
                  className="h-12 w-auto object-contain animate-rotate-logo opacity-60" 
                />
              </div>
            }>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-white/10 bg-neutral-950/65 px-2 py-1.5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] safe-bottom lg:hidden transition-all duration-300">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black tracking-wide uppercase transition-all duration-200 ${
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.05)] scale-105" 
                    : "text-neutral-400 hover:text-neutral-200 active:scale-95"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <MobileProfileModal open={isMobileProfileOpen} onClose={() => setIsMobileProfileOpen(false)} />
      <ToastViewport />
    </div>
  );
}
