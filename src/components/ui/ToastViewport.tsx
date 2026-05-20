import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useUiStore } from "../../store/uiStore";
import { Button } from "./Button";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

export function ToastViewport() {
  const { toasts, dismissToast } = useUiStore();

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), 4200));
    return () => timers.forEach(window.clearTimeout);
  }, [dismissToast, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              className="glass flex items-start gap-3 rounded-lg border border-white/10 p-3"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
            >
              <Icon className="mt-0.5 h-5 w-5 text-cyan" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-snow">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-muted">{toast.description}</p> : null}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
