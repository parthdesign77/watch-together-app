import {
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Gauge,
  LayoutDashboard,
  MonitorPlay,
  Shield,
  TriangleAlert,
  XCircle,
  FileText,
  Lock,
  Cookie
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export function NotificationsPage() {
  const notifications = [
    ["Room invite ready", "Your latest room link and code can be copied from the room invite modal."],
    ["Voice reconnect enabled", "WebRTC peers attempt to restore remote streams after connection changes."],
    ["Premium checkout", "Demo billing is active until Razorpay or Stripe keys are configured."]
  ];

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <h1 className="font-display text-4xl font-black">Notifications</h1>
        <p className="mt-2 text-sm text-muted">Mentions, joins, room events, voice state, and billing updates.</p>
      </section>
      <div className="space-y-3">
        {notifications.map(([title, body]) => (
          <article key={title} className="glass flex gap-3 rounded-lg p-4">
            <Bell className="h-5 w-5 text-cyan" />
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <Badge tone="red">
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-black">Admin Panel</h1>
        <p className="mt-2 text-sm text-muted">Realtime health, room cleanup, active sessions, and sync metrics.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Realtime rooms", "Firestore"],
          ["Auth provider", "Google + Email"],
          ["Media engine", "WebRTC + HLS"]
        ].map(([label, value]) => (
          <article key={label} className="glass rounded-lg p-5">
            <LayoutDashboard className="h-6 w-6 text-cyan" />
            <p className="mt-4 text-2xl font-black">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ContinueWatchingPage() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <Badge tone="cyan">
          <Clock3 className="h-3.5 w-3.5" />
          Progress Sync
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-black">Continue Watching</h1>
        <p className="mt-2 text-sm text-muted">Firestore watchlist progress and room state make this page realtime-ready.</p>
      </section>
    </div>
  );
}

export function PaymentSuccessPage() {
  return (
    <StatusPage
      icon={CheckCircle2}
      tone="green"
      title="Payment Successful"
      body="Your premium badge, subscription state, and room limits have been updated."
    />
  );
}

export function PaymentFailedPage() {
  return (
    <StatusPage
      icon={XCircle}
      tone="red"
      title="Payment Failed"
      body="Your plan was not changed. You can retry checkout from the pricing or billing page."
    />
  );
}

export function RoomExpiredPage() {
  return (
    <StatusPage
      icon={TriangleAlert}
      tone="orange"
      title="Room Expired"
      body="The room was cleaned up after inactivity. Start a new one and invite friends again."
    />
  );
}

export function OAuthScreen({ provider }: { provider: "Google" | "Microsoft" }) {
  return (
    <StatusPage
      icon={CreditCard}
      tone="cyan"
      title={`${provider} OAuth`}
      body={`${provider} login is represented in the auth flow. Google is fully wired through Firebase; Microsoft can be added as an additional Firebase provider.`}
    />
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      icon={Gauge}
      tone="red"
      title="404"
      body="This screen drifted out of sync. Head back to the dashboard to create or join a room."
    />
  );
}

function StatusPage({
  icon: Icon,
  title,
  body,
  tone
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "cyan" | "green" | "orange" | "red";
}) {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <section className="glass max-w-xl rounded-lg p-8 text-center">
        <Icon className="mx-auto h-12 w-12 text-cyan" />
        <Badge tone={tone} className="mt-5">
          Watch Together
        </Badge>
        <h1 className="mt-4 font-display text-5xl font-black">{title}</h1>
        <p className="mt-3 text-muted">{body}</p>
        <Link to="/dashboard">
          <Button className="mt-6">
            <MonitorPlay className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-snow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass rounded-2xl border border-white/5 bg-[#111111]/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff3d47]/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="h-12 w-12 rounded-xl bg-cyan/15 flex items-center justify-center border border-cyan/25">
              <FileText className="h-6 w-6 text-cyan" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black">Terms & Conditions</h1>
              <p className="text-sm text-neutral-400">Last updated: May 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">1. Agreement to Terms</h2>
              <p>
                Welcome to Watch Together. By accessing or using our service, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, you must not access or use the service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">2. Use of Service</h2>
              <p>
                Our platform provides real-time media synchronization, voice calling, and room-based watch parties. You agree to use the service only for lawful purposes and in accordance with these terms. You must not stream copyrighted content that you do not own or have authorization to share.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">3. User Accounts</h2>
              <p>
                You are responsible for safeguarding your account credentials and for any activity under your account. You must notify us immediately of any unauthorized use or security breach.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">4. Disclaimers & Limitation of Liability</h2>
              <p>
                The service is provided on an "AS IS" and "AS AVAILABLE" basis. Watch Together makes no warranties regarding reliability, uptime, or data persistence. We shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
              </p>
            </section>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-end">
            <Link to="/login">
              <Button>
                <MonitorPlay className="h-4 w-4" />
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-snow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass rounded-2xl border border-white/5 bg-[#111111]/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
              <Lock className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black">Privacy Policy</h1>
              <p className="text-sm text-neutral-400">Last updated: May 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">1. Information We Collect</h2>
              <p>
                We collect personal information that you provide to us, such as your display name, email address, and profile photo when signing up or using Google OAuth. We also collect ephemeral room configuration and synchronization metadata.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">2. How We Use Information</h2>
              <p>
                Your information is used to facilitate real-time synchronization, voice calls (WebRTC), customize room control authorization, and maintain watchlist logs. We do not sell or rent your personal data.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">3. Media and Voice Stream Data</h2>
              <p>
                Audio and video stream connections established via WebRTC are peer-to-peer and are not stored or recorded on our servers. Ephemeral room signaling tokens are securely transmitted and cleaned up immediately after usage.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">4. Data Security</h2>
              <p>
                We implement strict security guidelines, relying on Firebase's standard security rules and secure token validation to prevent unauthorized access.
              </p>
            </section>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-end">
            <Link to="/login">
              <Button>
                <MonitorPlay className="h-4 w-4" />
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-snow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass rounded-2xl border border-white/5 bg-[#111111]/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff3d47]/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
              <Cookie className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black">Cookie Policy</h1>
              <p className="text-sm text-neutral-400">Last updated: May 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">1. What are Cookies?</h2>
              <p>
                Cookies and browser local storage options are small text tokens stored on your computer or device by your web browser. They help us remember your preferences, authentication tokens, and theme settings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">2. How We Use Cookies</h2>
              <p>
                We use cookies and local storage (such as <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[11px] text-white">localStorage</code>) to keep you signed in, remember your user preferences (such as deafen status and volume), and verify if you have visited before to guide your onboarding.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">3. Third-Party Services</h2>
              <p>
                We utilize Firebase Authentication which relies on secure browser storage cookies to authenticate users. Standard analytical or performance monitoring platforms may also set tracking cookies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">4. Controlling Your Cookie Settings</h2>
              <p>
                You can block or clean cookies through your browser preferences. However, please note that disabling cookies will prevent you from signing in or maintaining state sync on the website.
              </p>
            </section>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-end">
            <Link to="/login">
              <Button>
                <MonitorPlay className="h-4 w-4" />
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
