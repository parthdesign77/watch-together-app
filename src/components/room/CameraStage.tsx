import { Maximize2, Video } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { StreamVideo } from "./StreamVideo";

export interface CameraFeed {
  id: string;
  name: string;
  stream: MediaStream;
  muted?: boolean;
}

interface CameraStageProps {
  feeds: CameraFeed[];
  screenShareActive: boolean;
}

export function CameraStage({ feeds, screenShareActive }: CameraStageProps) {
  const spotlight = feeds.length <= 1;

  if (!feeds.length) return null;

  return (
    <section
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl ${
        screenShareActive ? "pointer-events-auto absolute bottom-4 left-4 z-20 h-36 w-56" : "min-h-[520px]"
      }`}
    >
      {screenShareActive ? (
        <div className="h-full w-full">
          <StreamVideo stream={feeds[0].stream} muted={feeds[0].muted} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="truncate text-xs font-bold">{feeds[0].name}</p>
          </div>
        </div>
      ) : (
        <div className={`grid h-full min-h-[520px] gap-3 p-3 ${spotlight ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {feeds.map((feed) => (
            <article key={feed.id} className="relative overflow-hidden rounded-lg border border-white/10 bg-elevated">
              <StreamVideo stream={feed.stream} muted={feed.muted} className="h-full min-h-[240px] w-full object-cover" />
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <Badge tone="red">
                  <Video className="h-3.5 w-3.5" />
                  Camera
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent p-3">
                <p className="truncate font-bold">{feed.name}</p>
                <Button variant="ghost" size="icon" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Fullscreen camera grid">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
