import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ContentCard } from "../components/media/ContentCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { useStartRoom } from "../hooks/useStartRoom";
import { searchContent } from "../services/contentService";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [value, setValue] = useState(initial);
  const startRoom = useStartRoom();
  const searchTerm = useMemo(() => params.get("q") || "", [params]);
  const results = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: () => searchContent(searchTerm),
    enabled: Boolean(searchTerm)
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setParams(value.trim() ? { q: value.trim() } : {});
  }

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <h1 className="font-display text-4xl font-black">Search</h1>
        <p className="mt-2 text-sm text-muted">Find movies and anime across local seeds, TMDB when configured, and Jikan.</p>
        <form onSubmit={onSubmit} className="mt-5 flex gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search for Interstellar, Jujutsu Kaisen..."
            className="h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/8 px-4 outline-none focus:border-cyan"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </section>

      {results.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[2/3]" />
          ))}
        </div>
      ) : results.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {results.data.map((item) => (
            <ContentCard key={item.id} item={item} onStartRoom={startRoom} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Search} title="No search running" description="Try a movie, anime, genre, or friend-watching title." />
      )}
    </div>
  );
}
