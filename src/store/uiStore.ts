import { create } from "zustand";

type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface UiStore {
  theme: "dark" | "light";
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: ToastMessage[];
  setTheme: (theme: "dark" | "light") => void;
  toggleSidebar: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  theme: "dark",
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  setTheme: (theme) => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }].slice(-4)
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));
