import { Crown, MicOff, MonitorUp, HeadphoneOff } from "lucide-react";
import type { Participant, UserProfile } from "../../types";

interface AvatarProps {
  user?: Partial<UserProfile> | Participant | null;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl"
};

export function Avatar({ user, size = "md", showStatus = false }: AvatarProps) {
  const name = user?.name || "Guest";
  const avatar = user?.avatar;
  const color = "avatarColor" in (user || {}) ? user?.avatarColor : "#DC2626";
  const participant = user as Participant | null;

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`${sizes[size]} inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-elevated font-bold text-white`}
        style={{ backgroundColor: avatar ? undefined : color }}
      >
        {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover rounded-full" /> : name.slice(0, 2).toUpperCase()}
      </span>
      {showStatus && participant?.isSpeaking ? (
        <span className="absolute -inset-1 rounded-full border-2 border-cyan shadow-glow" aria-hidden />
      ) : null}
      {showStatus && participant?.isHost ? (
        <Crown className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-movie p-0.5 text-white" aria-label="Host" />
      ) : null}
      {showStatus && participant?.isDeafened ? (
        <HeadphoneOff className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-danger p-0.5 text-white" aria-label="Deafened" />
      ) : showStatus && participant?.isMuted ? (
        <MicOff className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-danger p-0.5 text-white" aria-label="Muted" />
      ) : null}
      {showStatus && participant?.isScreenSharing ? (
        <MonitorUp className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-cyan p-0.5 text-white" aria-label="Screen sharing" />
      ) : null}
    </span>
  );
}
