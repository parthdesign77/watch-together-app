import { ChevronRight } from "lucide-react";
import type { ContentItem } from "../../types";
import { ContentCard } from "./ContentCard";

interface ContentRailProps {
  title: string;
  eyebrow?: string;
  items: ContentItem[];
  onStartRoom?: (item: ContentItem) => void;
}

export function ContentRail({ title, eyebrow, items, onStartRoom }: ContentRailProps) {
  return (
    <section className="py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan">{eyebrow}</p> : null}
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        </div>
        <ChevronRight className="h-5 w-5 text-muted" />
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onStartRoom={onStartRoom} />
        ))}
      </div>
    </section>
  );
}
