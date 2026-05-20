import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "cyan" | "purple" | "green" | "orange" | "red" | "muted";
  className?: string;
}

const tones = {
  cyan: "border-red-500/35 bg-red-500/12 text-red-200",
  purple: "border-red-600/35 bg-red-600/14 text-red-100",
  green: "border-rose-400/35 bg-rose-500/12 text-rose-100",
  orange: "border-red-800/40 bg-red-950/35 text-red-200",
  red: "border-danger/30 bg-danger/12 text-red-200",
  muted: "border-white/10 bg-white/8 text-muted"
};

export function Badge({ children, tone = "muted", className }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold uppercase tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
