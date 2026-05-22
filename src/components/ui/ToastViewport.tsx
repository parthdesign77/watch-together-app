import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useUiStore } from "../../store/uiStore";
import { Button } from "./Button";

const toastStyles = {
  success: {
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/20",
    glow: "0 0 20px rgba(244, 63, 94, 0.12)",
    icon: CheckCircle2
  },
  error: {
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/20",
    glow: "0 0 20px rgba(244, 63, 94, 0.12)",
    icon: XCircle
  },
  info: {
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/20",
    glow: "0 0 20px rgba(244, 63, 94, 0.12)",
    icon: Info
  }
};

export function ToastViewport() {
  const { toasts, dismissToast } = useUiStore();
  const activeToast = toasts[0];

  useEffect(() => {
    if (!activeToast) return;
    // Auto-dismiss the active toast after 3.5 seconds
    // This leaves a 1.5s margin under the 5-second limit for transition exit animations.
    const timer = window.setTimeout(() => {
      dismissToast(activeToast.id);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [activeToast?.id, dismissToast]);

  const style = activeToast ? toastStyles[activeToast.type] : null;
  const Icon = style ? style.icon : null;

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence mode="wait">
        {activeToast && style && Icon && (
          <motion.div
            key={activeToast.id}
            className={`glass flex items-start gap-3 rounded-xl border ${style.borderColor} p-4`}
            style={{
              boxShadow: `0 20px 80px rgba(0, 0, 0, 0.4), ${style.glow}`
            }}
            initial={{ x: 50, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-snow leading-tight">{activeToast.title}</p>
              {activeToast.description ? (
                <p className="mt-1 text-sm text-muted leading-snug">{activeToast.description}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 shrink-0"
              onClick={() => dismissToast(activeToast.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

