import { Camera, Crown, Mail, User } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar user={profile} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl font-black">{profile?.name}</h1>
              {profile?.premiumBadge ? (
                <Badge tone="purple">
                  <Crown className="h-3.5 w-3.5" />
                  Premium
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Mail className="h-4 w-4" />
              {profile?.email}
            </p>
          </div>
          <Button variant="secondary">
            <Camera className="h-4 w-4" />
            Update Avatar
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Recent rooms", profile?.recentRooms?.length || 0],
          ["Watchlist saves", profile?.watchlist?.length || 0],
          ["Plan", profile?.subscriptionPlan || "free"]
        ].map(([label, value]) => (
          <article key={label as string} className="glass rounded-lg p-5">
            <User className="h-6 w-6 text-cyan" />
            <p className="mt-4 text-3xl font-black capitalize">{value}</p>
            <p className="text-sm text-muted">{label as string}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
