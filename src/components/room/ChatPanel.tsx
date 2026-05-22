import { FormEvent, useRef, useState, useEffect, useMemo } from "react";
import { AtSign, Pin, Send, Smile } from "lucide-react";
import { addMessageReaction, sendRoomMessage, updateRoomState } from "../../hooks/useRooms";
import { REACTIONS } from "../../lib/constants";
import type { UserProfile, ChatMessage, Participant } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useUISound } from "../../hooks/useUISound";
import { AnimatePresence, motion } from "framer-motion";

interface ChatPanelProps {
  roomId: string;
  profile: UserProfile;
  messages: ChatMessage[];
  participants: Participant[];
}

const REACTION_STICKERS = [
  { name: "Popcorn", url: "https://i.giphy.com/media/vNsx09bTjFm39T4S5m/giphy.gif" },
  { name: "Mind Blown", url: "https://i.giphy.com/media/g5yQ6hT4yVvSifG4q0/giphy.gif" },
  { name: "Dancing", url: "https://i.giphy.com/media/K3S3Fi2oP8oMv9Wj90/giphy.gif" },
  { name: "Heart Eyes", url: "https://i.giphy.com/media/iI5ENmK5TNu3Yadp4V/giphy.gif" },
  { name: "Fire", url: "https://i.giphy.com/media/R3Z5B6P08fXUpWffQ9/giphy.gif" },
  { name: "Cry", url: "https://i.giphy.com/media/Y48mGtrA79BF5lEL2F/giphy.gif" }
];

function isImageUrl(url: string) {
  return url.startsWith("http") && (
    url.includes(".gif") ||
    url.includes(".png") ||
    url.includes(".jpg") ||
    url.includes(".webp") ||
    url.includes("giphy.com")
  );
}

export function ChatPanel({ roomId, profile, messages, participants }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isLocalTyping, setIsLocalTyping] = useState(false);
  const typingTimer = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { play } = useUISound();

  // Scroll to bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Clean up typing state on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      void updateRoomState(roomId, {
        [`participants.${profile.uid}.isTyping`]: false
      }).catch(() => undefined);
    };
  }, [roomId, profile.uid]);

  const handleTyping = () => {
    if (!isLocalTyping) {
      setIsLocalTyping(true);
      void updateRoomState(roomId, {
        [`participants.${profile.uid}.isTyping`]: true
      }).catch(() => undefined);
    }

    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      setIsLocalTyping(false);
      void updateRoomState(roomId, {
        [`participants.${profile.uid}.isTyping`]: false
      }).catch(() => undefined);
    }, 2000);
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    setIsLocalTyping(false);
    
    const messageText = text;
    setText("");
    
    // Optimistically update Firestore before sending
    await Promise.all([
      sendRoomMessage(roomId, profile, messageText),
      updateRoomState(roomId, {
        [`participants.${profile.uid}.isTyping`]: false
      }).catch(() => undefined)
    ]);
  }

  const handleSendSticker = async (url: string) => {
    play("click");
    setShowStickers(false);
    await sendRoomMessage(roomId, profile, url);
  };

  const typingParticipants = useMemo(() => {
    return participants.filter((p) => p.uid !== profile.uid && p.isTyping === true);
  }, [participants, profile.uid]);

  const typingText = useMemo(() => {
    if (typingParticipants.length === 0) return null;
    if (typingParticipants.length === 1) return `${typingParticipants[0].name} is typing`;
    if (typingParticipants.length === 2) return `${typingParticipants[0].name} and ${typingParticipants[1].name} are typing`;
    return "Multiple people are typing";
  }, [typingParticipants]);

  return (
    <aside className="glass flex min-h-[350px] xl:min-h-0 xl:h-full flex-col rounded-lg relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Live Chat</h2>
          <p className="text-xs text-muted">{messages.length} synced messages</p>
        </div>
        <Badge tone="cyan">Realtime</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {messages.map((message) => (
          <article key={message.id} className="group">
            <div className="flex gap-3">
              <Avatar user={{ name: message.userName, avatar: message.userAvatar, avatarColor: "#DC2626" }} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{message.userName}</span>
                  <span className="text-xs text-muted">
                    {new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.pinned ? <Pin className="h-3.5 w-3.5 text-movie" /> : null}
                </div>
                {isImageUrl(message.text) ? (
                  <div className="mt-2 max-w-[160px] rounded-[16px] overflow-hidden border border-white/10 bg-black/40 shadow-lg animate-fade-in hover:scale-105 transition-all duration-300">
                    <img src={message.text} alt="Sticker" className="w-full h-auto object-contain max-h-[120px]" />
                  </div>
                ) : (
                  <p className="mt-1 break-words text-sm leading-6 text-slate-200">{message.text}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="rounded-md border border-white/10 bg-white/8 px-2 py-1 text-xs transition hover:bg-white/15 cursor-pointer"
                      onClick={() => addMessageReaction(roomId, message, emoji, profile.uid)}
                    >
                      {emoji} {message.reactions?.[emoji]?.length || ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Synchronized typing indicator floating just above the form */}
      {typingText && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-cyan animate-pulse bg-cyan/5 border-t border-cyan/10">
          <span className="font-semibold">{typingText}</span>
          <span className="flex gap-1 items-center pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      )}

      {/* Stickers and Reaction GIFs panel */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-[66px] inset-x-0 bg-[#121216]/95 border-t border-white/10 p-3.5 backdrop-blur-md z-30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">Premium Stickers</span>
              <button
                type="button"
                onClick={() => setShowStickers(false)}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {REACTION_STICKERS.map((sticker) => (
                <button
                  type="button"
                  key={sticker.name}
                  onClick={() => handleSendSticker(sticker.url)}
                  className="flex flex-col items-center justify-center p-1.5 rounded-xl border border-white/5 hover:border-cyan/40 bg-white/5 hover:bg-cyan/5 transition-all duration-300 hover:scale-102 group cursor-pointer"
                >
                  <img src={sticker.url} alt={sticker.name} className="h-12 w-12 object-contain rounded" />
                  <span className="text-[9px] font-bold text-neutral-400 group-hover:text-cyan mt-1 uppercase tracking-wider">
                    {sticker.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="border-t border-white/10 p-3 bg-black/25">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/8 p-2">
          <Button variant="ghost" size="icon" aria-label="Mention" type="button" onClick={() => play("click")}>
            <AtSign className="h-4 w-4" />
          </Button>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              handleTyping();
            }}
            placeholder="React, quote, or drop a GIF link..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Stickers"
            type="button"
            className={showStickers ? "text-cyan" : "text-neutral-400"}
            onClick={() => {
              play("click");
              setShowStickers(!showStickers);
            }}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </aside>
  );
}
