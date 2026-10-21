"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_CHAT_CHARS, type LiveChatMessage } from "@/lib/live-class";
import { cn } from "@/lib/utils";

function initials(name: string | null): string {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Chat Kelas Live untuk guru dan murid. Guru bisa menghapus pesan siapa saja,
 * murid hanya pesannya sendiri. Menggulir ke bawah selama pengguna tidak sedang
 * membaca pesan lama.
 */
export function ChatPanel({
  messages,
  myUserId,
  isTeacher,
  closedText,
  onSend,
  onDelete,
  className,
}: {
  messages: LiveChatMessage[];
  myUserId: string | null;
  isTeacher: boolean;
  /** Diisi bila chat tidak bisa dipakai (kelas berakhir, sedang menyambung). */
  closedText: string | null;
  onSend: (text: string) => boolean;
  onDelete: (id: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (!onSend(text)) {
      toast.error("Not connected, try again in a moment");
      return;
    }
    stickToBottom.current = true;
    setDraft("");
  };

  return (
    <div className={cn("flex min-h-0 flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-100", className)}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FD661F]">
          <MessageSquare className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-bold text-slate-800">Chat</h2>
          <p className="text-xs text-slate-500">
            {messages.length
              ? `${messages.length} message${messages.length === 1 ? "" : "s"}`
              : isTeacher
                ? "Questions from your students show up here"
                : "Ask a question or say hi"}
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-slate-400">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.userId === myUserId;
            const teacher = m.role === "teacher";
            const canDelete = isTeacher || mine;
            return (
              <div
                key={m.id}
                className={cn(
                  "group flex gap-3 rounded-2xl px-3 py-2 transition-colors",
                  mine ? "bg-teal-50/70" : "hover:bg-slate-50",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    teacher ? "bg-[#0B7077] text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="font-semibold text-slate-700">{mine ? "You" : (m.name ?? "Student")}</span>
                    {teacher && (
                      <span className="rounded-full bg-[#0B7077]/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[#0B7077]">
                        Teacher
                      </span>
                    )}
                    <span className="text-slate-400">{timeOf(m.at)}</span>
                  </p>
                  <p className="mt-0.5 break-words text-sm leading-relaxed text-slate-800">{m.text}</p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    aria-label={mine ? "Delete your message" : `Delete message from ${m.name ?? "student"}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-slate-100 p-3">
        <label htmlFor="live-chat-input" className="sr-only">
          Message
        </label>
        <input
          id="live-chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_CHAT_CHARS}
          disabled={!!closedText}
          placeholder={closedText ?? (isTeacher ? "Message your students" : "Ask a question…")}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2DA5A2]/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!!closedText || !draft.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B7077] text-white transition-colors hover:bg-[#0B7077]/90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
