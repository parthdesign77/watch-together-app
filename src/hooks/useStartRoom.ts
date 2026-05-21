import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createWatchRoom } from "./useRooms";
import { useUiStore } from "../store/uiStore";
import type { ContentItem } from "../types";

export function useStartRoom() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);

  return async (content?: ContentItem, videoUrl?: string, roomType: "public" | "private" = "private") => {
    if (!profile) {
      navigate("/login");
      return;
    }

    // Restrict room hosting to Premium subscribers
    if (profile.subscriptionPlan !== "premium") {
      pushToast({
        title: "Premium Feature Required",
        description: "Only Premium members can host watch rooms. Free accounts are welcome to join existing rooms!",
        type: "info"
      });
      navigate("/billing");
      return;
    }

    try {
      const room = await createWatchRoom(profile, content, videoUrl, roomType);
      pushToast({ title: "Room created", description: `${room.roomName} is ready.`, type: "success" });
      navigate(`/room/${room.id}`);
    } catch (error) {
      pushToast({
        title: "Could not create room",
        description: error instanceof Error ? error.message : "Please check Firestore permissions.",
        type: "error"
      });
    }
  };
}
