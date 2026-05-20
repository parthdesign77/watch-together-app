import { Heart, Play, Trash2 } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { removeWatchlistEntry, useWatchlist } from "../hooks/useWatchlist";

export function WatchlistPage() {
  const { profile } = useAuth();
  const items = useWatchlist(profile);

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <h1 className="font-display text-4xl font-black">Watchlist</h1>
        <p className="mt-2 text-sm text-muted">Favorites, watch later, watched history, collections, and continue-watching progress.</p>
      </section>

      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="glass flex gap-4 rounded-lg p-4">
              <img src={item.poster} alt={item.title} className="h-32 w-24 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan">{item.status.replace("_", " ")}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-cyan to-premium" style={{ width: `${item.progress}%` }} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">
                    <Play className="h-4 w-4" />
                    Continue
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeWatchlistEntry(item.id)} aria-label="Remove from watchlist">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Heart} title="Your watchlist is waiting" description="Add movies or anime from catalog pages and they will appear here in realtime." />
      )}
    </div>
  );
}
