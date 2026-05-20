import { FormEvent, useRef, useState } from "react";
import { AtSign, Pin, Send, Smile } from "lucide-react";
import { addMessageReaction, sendRoomMessage, useRoomMessages } from "../../hooks/useRooms";
import { REACTIONS } from "../../lib/constants";
import type { UserProfile } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface ChatPanelProps {
  roomId: string;
  profile: UserProfile;
}

export function ChatPanel({ roomId, profile }: ChatPanelProps) {
  const messages = useRoomMessages(roomId);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<number | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await sendRoomMessage(roomId, profile, text);
    setText("");
    setTyping(false);
  }

  return (
    <aside className="glass flex min-h-[520px] flex-col rounded-lg">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Live Chat</h2>
          <p className="text-xs text-muted">{messages.length} synced messages</p>
        </div>
        <Badge tone="cyan">Realtime</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <article key={message.id} className="group">
            <div className="flex gap-3">
              <Avatar user={{ name: message.userName, avatar: message.userAvatar, avatarColor: "#DC2626" }} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{message.userName}</span>
                  <span className="text-xs text-muted">{new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {message.pinned ? <Pin className="h-3.5 w-3.5 text-movie" /> : null}
                </div>
                <p className="mt-1 break-words text-sm leading-6 text-slate-200">{message.text}</p>
                <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="rounded-md border border-white/10 bg-white/8 px-2 py-1 text-xs transition hover:bg-white/15"
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
        {typing ? <p className="text-xs text-cyan">Someone is typing...</p> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/8 p-2">
          <Button variant="ghost" size="icon" aria-label="Mention">
            <AtSign className="h-4 w-4" />
          </Button>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setTyping(true);
              if (typingTimer.current) window.clearTimeout(typingTimer.current);
              typingTimer.current = window.setTimeout(() => setTyping(false), 1200);
            }}
            placeholder="React, quote, or drop a GIF link..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <Button variant="ghost" size="icon" aria-label="Emoji">
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
