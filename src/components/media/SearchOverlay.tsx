import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

export function SearchOverlay() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass flex items-center gap-2 rounded-full p-1.5 pl-4 pr-2">
      <Search className="h-5 w-5 text-muted flex-shrink-0" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search movies, anime, friends watching..."
        className="h-9 min-w-0 flex-1 bg-transparent px-1 text-base md:text-sm text-snow outline-none placeholder:text-muted"
      />
      {query ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQuery("")} aria-label="Clear search">
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </form>
  );
}
