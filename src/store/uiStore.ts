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
  audioInputDeviceId: string;
  audioOutputDeviceId: string;
  noiseSuppressionEnabled: boolean;
  masterVolume: number;
  participantVolumes: Record<string, number>;
  pushToTalkEnabled: boolean;
  deafened: boolean;
  setTheme: (theme: "dark" | "light") => void;
  toggleSidebar: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  setAudioInputDeviceId: (id: string) => void;
  setAudioOutputDeviceId: (id: string) => void;
  setNoiseSuppressionEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setParticipantVolume: (uid: string, volume: number) => void;
  setPushToTalkEnabled: (enabled: boolean) => void;
  setDeafened: (deafened: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  theme: (localStorage.getItem("theme") as "dark" | "light") || "dark",
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  audioInputDeviceId: localStorage.getItem("audioInputDeviceId") || "default",
  audioOutputDeviceId: localStorage.getItem("audioOutputDeviceId") || "default",
  noiseSuppressionEnabled: localStorage.getItem("noiseSuppressionEnabled") !== "false",
  masterVolume: Number(localStorage.getItem("masterVolume") ?? "1"),
  participantVolumes: JSON.parse(localStorage.getItem("participantVolumes") || "{}"),
  pushToTalkEnabled: localStorage.getItem("pushToTalkEnabled") === "true",
  deafened: localStorage.getItem("deafened") === "true",
  setTheme: (theme) => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }].slice(-4)
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setAudioInputDeviceId: (id) => {
    localStorage.setItem("audioInputDeviceId", id);
    set({ audioInputDeviceId: id });
  },
  setAudioOutputDeviceId: (id) => {
    localStorage.setItem("audioOutputDeviceId", id);
    set({ audioOutputDeviceId: id });
  },
  setNoiseSuppressionEnabled: (enabled) => {
    localStorage.setItem("noiseSuppressionEnabled", String(enabled));
    set({ noiseSuppressionEnabled: enabled });
  },
  setMasterVolume: (volume) => {
    localStorage.setItem("masterVolume", String(volume));
    set({ masterVolume: volume });
  },
  setParticipantVolume: (uid, volume) => {
    set((state) => {
      const next = { ...state.participantVolumes, [uid]: volume };
      localStorage.setItem("participantVolumes", JSON.stringify(next));
      return { participantVolumes: next };
    });
  },
  setPushToTalkEnabled: (enabled) => {
    localStorage.setItem("pushToTalkEnabled", String(enabled));
    set({ pushToTalkEnabled: enabled });
  },
  setDeafened: (deafened) => {
    localStorage.setItem("deafened", String(deafened));
    set({ deafened });
  }
}));
