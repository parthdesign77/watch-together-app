import { Bell, Keyboard, Mic, Moon, MonitorUp, Shield, SlidersHorizontal, Sun } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useUiStore } from "../store/uiStore";

const sections = [
  { title: "Audio Settings", icon: Mic, body: "Krisp AI noise cancellation, echo cancellation, automatic gain, push-to-talk, and user volume controls." },
  { title: "Streaming Settings", icon: MonitorUp, body: "Default quality, bitrate indicator, screen share source switching, and reconnect overlays." },
  { title: "Keyboard Shortcuts", icon: Keyboard, body: "Space to play/pause, M to mute, F for fullscreen, T for theater, and / for search." },
  { title: "Privacy & Security", icon: Shield, body: "Protected rooms, password rooms, session persistence, and authenticated Firestore access." },
  { title: "Notifications", icon: Bell, body: "Room joins, mentions, screen share live events, and subscription renewal reminders." },
  { title: "Advanced Room Controls", icon: SlidersHorizontal, body: "Host authority, participant limits, latency thresholds, and inactivity cleanup." }
];

export function SettingsPage() {
  const { theme, setTheme } = useUiStore();

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <h1 className="font-display text-4xl font-black">Settings</h1>
        <p className="mt-2 text-sm text-muted">Profile, audio, streaming, notifications, shortcuts, and room defaults.</p>
        <div className="mt-5 flex gap-2">
          <Button variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>
            <Sun className="h-4 w-4" />
            Light
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="glass rounded-lg p-5">
            <section.icon className="h-7 w-7 text-cyan" />
            <h2 className="mt-4 font-display text-xl font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
            <div className="mt-5 flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3">
              <span className="text-sm font-semibold">Enabled</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-cyan" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
