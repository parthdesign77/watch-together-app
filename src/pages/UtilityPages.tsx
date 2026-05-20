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
  XCircle
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
