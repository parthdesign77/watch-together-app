import { Check, Copy, Mail, MessageCircle, Send, Twitter } from "lucide-react";
import { useState } from "react";
import { appUrl } from "../../lib/constants";
import type { WatchRoom } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface InviteModalProps {
  open: boolean;
  room: WatchRoom;
  onClose: () => void;
}

export function InviteModal({ open, room, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${appUrl}/room/${room.id}?code=${room.code}`;
  const text = encodeURIComponent(`Join my Watch Together room: ${inviteUrl}`);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Modal open={open} title="Invite Friends" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Invite via Code</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-ink px-4 py-3 text-center font-display text-3xl font-black tracking-[0.24em] text-white">
              {room.code}
            </code>
            <Button variant="secondary" size="icon" onClick={() => copy(room.code)} aria-label="Copy code">
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Invite via Link</p>
          <div className="mt-3 flex items-center gap-2">
            <input value={inviteUrl} readOnly className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-ink px-3 text-sm text-muted outline-none" />
            <Button onClick={() => copy(inviteUrl)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              <Send className="h-3.5 w-3.5" />
              Telegram
            </Button>
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${text}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              <Twitter className="h-3.5 w-3.5" />X
            </Button>
          </a>
          <a href={`mailto:?subject=Join my Watch Together room&body=${text}`}>
            <Button variant="secondary" size="sm" className="w-full text-xs">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
          </a>
          <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => copy(inviteUrl)}>
            <Copy className="h-3.5 w-3.5" />
            Discord
          </Button>
        </div>
      </div>
    </Modal>
  );
}
