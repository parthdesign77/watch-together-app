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
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUiStore } from "../../store/uiStore";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ToastViewport } from "../ui/ToastViewport";

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

function ShellLink({ href, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
          isActive ? "bg-white/12 text-snow shadow-glow" : "text-muted hover:bg-white/8 hover:text-snow"
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

  return (
    <div className="min-h-screen bg-cinema-radial text-snow">
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink/70 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Toggle navigation">
              <Menu className="h-5 w-5" />
            </Button>
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan via-premium to-movie shadow-glow">
                <MonitorPlay className="h-5 w-5 text-white" />
              </span>
              <span>
                <span className="block font-display text-base font-extrabold leading-4">Watch Together</span>
                <span className="text-xs text-muted">Cinema rooms in sync</span>
              </span>
            </NavLink>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Badge tone={profile?.premiumBadge ? "purple" : profile?.subscriptionPlan === "standard" ? "cyan" : "muted"}>
              {profile?.subscriptionPlan || "free"}
            </Badge>
            <Avatar user={profile} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            className="fixed bottom-0 left-0 top-16 z-40 w-72 border-r border-white/10 bg-ink/88 p-4 backdrop-blur-2xl lg:block"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <ShellLink key={item.href} {...item} />
                ))}
              </nav>

              <div className="my-5 h-px bg-white/10" />

              <nav className="space-y-1">
                {utilityItems.map((item) => (
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
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="min-h-screen px-4 pb-24 pt-20 lg:ml-72 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/82 px-2 py-2 backdrop-blur-2xl safe-bottom lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold ${
                  isActive ? "bg-white/12 text-snow" : "text-muted"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <ToastViewport />
    </div>
  );
}
