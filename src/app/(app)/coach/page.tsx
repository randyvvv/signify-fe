"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Briefcase,
  CalendarDays,
  History,
  ListChecks,
  MessageSquarePlus,
  PlayCircle,
  Square,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, streamPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/shared/Markdown";
import { CoachCardView } from "@/components/coach/CoachCards";
import { StepTimeline } from "@/components/coach/StepTimeline";
import { SignaAvatar } from "@/components/coach/SignaAvatar";
import type {
  CoachCard,
  CoachEvent,
  CoachMessage,
  CoachSessionSummary,
  CoachStep,
} from "@/components/coach/types";

const SUGGESTIONS: { icon: LucideIcon; title: string; prompt: string; send: boolean; tone: string }[] = [
  {
    icon: Briefcase,
    title: "Prepare for a job interview",
    prompt: "I have a job interview next week. Help me get ready to use sign language in it.",
    send: true,
    tone: "bg-rose-50 text-rose-500",
  },
  {
    icon: CalendarDays,
    title: "Plan my week",
    prompt: "Look at my progress and make me a 5-day study plan.",
    send: true,
    tone: "bg-teal-50 text-teal-600",
  },
  {
    icon: ListChecks,
    title: "Quiz me on my weak signs",
    prompt: "Find the signs I struggle with, make a quiz from them and add them to My Signs.",
    send: true,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    icon: PlayCircle,
    title: "Learn from a YouTube video",
    prompt: "Teach me the key signs from this YouTube video: ",
    send: false,
    tone: "bg-amber-50 text-amber-600",
  },
];

const CAPABILITIES = ["Reads your progress", "Finds materials", "Builds quizzes", "Adds to My Signs", "Shows signs"];

let tempId = 0;
const nextTempId = () => `tmp-${++tempId}`;

interface SessionDetail {
  id: string;
  title: string;
  messages: { id: string; role: "user" | "assistant"; content: string; steps: CoachStep[]; cards: CoachCard[] }[];
}


export default function CoachPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CoachSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(() => {
    api
      .get<CoachSessionSummary[]>("/api/agent/sessions")
      .then(setSessions)
      .catch(() => {});
  }, []);

  useEffect(loadSessions, [loadSessions]);

  // Gulir ke bawah saat ada konten baru.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Hentikan stream saat halaman ditutup.
  useEffect(() => () => abortRef.current?.abort(), []);

  const updateLast = (fn: (m: CoachMessage) => CoachMessage) =>
    setMessages((prev) => {
      const copy = prev.slice();
      const i = copy.length - 1;
      if (i >= 0 && copy[i]!.role === "assistant") copy[i] = fn(copy[i]!);
      return copy;
    });

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || running) return;
    setInput("");
    setHistoryOpen(false);
    setRunning(true);
    setMessages((prev) => [
      ...prev,
      { id: nextTempId(), role: "user", content: text, steps: [], cards: [] },
      { id: nextTempId(), role: "assistant", content: "", steps: [], cards: [], pending: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const onEvent = (e: CoachEvent) => {
      switch (e.type) {
        case "session":
          setSessionId(e.sessionId);
          setSessions((prev) =>
            prev.some((s) => s.id === e.sessionId)
              ? prev
              : [{ id: e.sessionId, title: e.title, updatedAt: new Date().toISOString() }, ...prev],
          );
          break;
        case "step":
          updateLast((m) => {
            const exists = m.steps.some((s) => s.id === e.step.id);
            return {
              ...m,
              steps: exists ? m.steps.map((s) => (s.id === e.step.id ? e.step : s)) : [...m.steps, e.step],
            };
          });
          break;
        case "card":
          updateLast((m) => ({ ...m, cards: [...m.cards, e.card] }));
          break;
        case "message":
          updateLast((m) => ({ ...m, content: e.text }));
          break;
        case "error":
          updateLast((m) => ({ ...m, content: e.message, error: true }));
          break;
        case "done":
          updateLast((m) => ({ ...m, pending: false }));
          break;
      }
    };

    try {
      await streamPost<CoachEvent>("/api/agent/chat", { sessionId: sessionId ?? undefined, message: text }, onEvent, controller.signal);
    } catch (err) {
      if (controller.signal.aborted) {
        updateLast((m) => ({ ...m, content: m.content || "Stopped.", pending: false }));
      } else {
        const msg =
          err instanceof ApiError && err.code === "ai_unavailable"
            ? "Signify Coach isn't enabled on the server yet. Ask the admin to set AI_ENABLED and GEMINI_API_KEY."
            : err instanceof ApiError
              ? err.message
              : "Couldn't reach Signify Coach. Please try again.";
        updateLast((m) => ({ ...m, content: msg, error: true, pending: false }));
      }
    } finally {
      updateLast((m) => (m.pending ? { ...m, pending: false } : m));
      setRunning(false);
      abortRef.current = null;
      loadSessions();
    }
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    if (running) stop();
    setSessionId(null);
    setMessages([]);
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const openSession = async (id: string) => {
    if (running || id === sessionId) {
      setHistoryOpen(false);
      return;
    }
    setLoadingSession(true);
    setHistoryOpen(false);
    try {
      const detail = await api.get<SessionDetail>(`/api/agent/sessions/${id}`);
      setSessionId(detail.id);
      setMessages(
        detail.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          steps: m.steps ?? [],
          cards: m.cards ?? [],
        })),
      );
    } catch {
      toast.error("Couldn't open that conversation");
    } finally {
      setLoadingSession(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await api.del(`/api/agent/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === sessionId) newChat();
    } catch {
      toast.error("Couldn't delete that conversation");
    }
  };

  const applySuggestion = (s: (typeof SUGGESTIONS)[number]) => {
    if (s.send) {
      send(s.prompt);
    } else {
      setInput(s.prompt);
      inputRef.current?.focus();
    }
  };

  const firstName = (user?.fullName ?? "there").split(" ")[0];

  const historyPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <p className="font-heading font-bold text-slate-800">Conversations</p>
        <button
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-3">
        <button
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6632FF] to-[#8B5CF6] py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-900/15 transition-opacity hover:opacity-95"
        >
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </button>
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-400">No conversations yet.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl transition-colors",
                s.id === sessionId ? "bg-violet-50" : "hover:bg-slate-50",
              )}
            >
              <button
                onClick={() => openSession(s.id)}
                className={cn(
                  "min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm",
                  s.id === sessionId ? "font-semibold text-[#6632FF]" : "text-slate-600",
                )}
              >
                {s.title}
              </button>
              <button
                onClick={() => deleteSession(s.id)}
                aria-label={`Delete ${s.title}`}
                className="mr-1 rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-[1400px] gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 lg:h-[calc(100vh-4rem)]">
      {/* Riwayat (desktop) */}
      <aside className="hidden w-72 shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 lg:block">
        {historyPanel}
      </aside>

      {/* Riwayat (mobile, overlay) */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setHistoryOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {historyPanel}
          </div>
        </div>
      )}

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
        {/* Header */}
        <div className="relative flex shrink-0 items-center gap-3 overflow-hidden border-b border-slate-100 px-5 py-4">
          <div className="relative">
            <SignaAvatar className="h-11 w-11 shadow-md shadow-violet-900/15" priority />
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                running ? "animate-pulse bg-amber-400" : "bg-emerald-400",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold text-slate-800">Signa</h1>
              <span className="rounded-md bg-gradient-to-r from-[#6632FF] to-[#2DA5A2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                AI Agent
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">
              {running ? "Working on your request…" : "Your Signify Coach — plans, builds quizzes and coaches you"}
            </p>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            aria-label="Conversation history"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <History className="h-5 w-5" />
          </button>
          <button
            onClick={newChat}
            aria-label="New chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>

        {/* Pesan */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-4 py-6 md:px-8">
          {loadingSession ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-6 text-center">
              <div className="relative w-44 md:w-52">
                <div className="absolute inset-x-4 bottom-2 top-8 rounded-full bg-gradient-to-br from-violet-200/60 to-teal-100/60 blur-2xl" />
                <SignaAvatar variant="full" className="relative animate-float" priority />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">
                  Hi {firstName}, I&apos;m Signa 👋
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6632FF]">Your Signify Coach</p>
                <p className="mx-auto mt-2 max-w-lg text-slate-500">
                  Tell me your goal. I&apos;ll check your progress, find the right materials, build
                  quizzes and add signs to your review list — automatically.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {CAPABILITIES.map((c) => (
                  <span key={c} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {c}
                  </span>
                ))}
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => applySuggestion(s)}
                    className="group flex items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-violet-200"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.tone)}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{s.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{s.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] px-4 py-3 text-sm text-white shadow-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <SignaAvatar className="h-9 w-9 shadow-sm" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <StepTimeline steps={m.steps} running={!!m.pending} />
                      {m.cards.map((card, i) => (
                        <CoachCardView key={i} card={card} />
                      ))}
                      {m.content ? (
                        <div
                          className={cn(
                            "rounded-2xl rounded-tl-md px-4 py-3 shadow-sm ring-1",
                            m.error ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-white ring-slate-100",
                          )}
                        >
                          {m.error ? <p className="text-sm">{m.content}</p> : <MarkdownContent content={m.content} compact />}
                        </div>
                      ) : (
                        m.pending &&
                        m.steps.length === 0 && (
                          <div className="flex w-fit gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100" aria-label="Signa is thinking">
                            {[0, 150, 300].map((d) => (
                              <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-8"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition-colors focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask Signa, or paste a YouTube link…"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none [field-sizing:content]"
            />
            {running ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition-colors hover:bg-slate-700"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6632FF] to-[#8B5CF6] text-white shadow-sm transition-all hover:opacity-95 active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-400">
            Signa can create quizzes and add signs to My Signs for you. AI can make mistakes.
          </p>
        </form>
      </section>
    </div>
  );
}
