"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Ear, Loader2, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  QUICK_REPLIES,
  SPEECH_LANGS,
  SPEECH_VOICES,
  speechApi,
  speechLocale,
  type SpeechLang,
  type SpeechVoice,
} from "@/lib/speech";
import { cn } from "@/lib/utils";
import { SignRecognizer, type RecognizeResult } from "./SignRecognizer";
import { useSpeaker } from "./useSpeaker";
import { useSpeechInput } from "./useSpeechInput";

const MAX_CHARS = 500;
const PREFS_KEY = "signify_speech_prefs";

interface Message {
  id: string;
  from: "me" | "them";
  text: string;
}

interface Prefs {
  lang: SpeechLang;
  voice: SpeechVoice;
}

function loadPrefs(): Prefs {
  const fallback: Prefs = {
    lang: typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("id") ? "id" : "en",
    voice: "female",
  };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null") as Partial<Prefs> | null;
    return {
      lang: SPEECH_LANGS.some((l) => l.value === saved?.lang) ? (saved!.lang as SpeechLang) : fallback.lang,
      voice: SPEECH_VOICES.some((v) => v.value === saved?.voice) ? (saved!.voice as SpeechVoice) : fallback.voice,
    };
  } catch {
    return fallback;
  }
}

let messageSeq = 0;
const nextId = () => `m${++messageSeq}`;

/**
 * Isyarat -> Suara: teman Tuli merekam isyarat (atau mengetik), Signify menyusunnya
 * jadi kalimat dan membacakannya. Balasan teman dengar (suara/ketik) tampil sebagai
 * teks besar, jadi keduanya bisa mengobrol dua arah.
 */
export function SignConversation() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const speaker = useSpeaker(prefs);
  const listening = useSpeechInput();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* penyimpanan diblokir: pakai default lagi nanti */
    }
  }, [prefs]);

  useEffect(() => {
    const list = listRef.current;
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, listening.interim]);

  const addSign = useCallback((result: RecognizeResult) => {
    if (!result.text) return;
    setDraft((d) => (d ? `${d} ${result.text}` : result.text).slice(0, MAX_CHARS));
  }, []);

  const say = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const id = nextId();
    setMessages((m) => [...m, { id, from: "me", text: clean }]);
    void speaker.speak(id, clean);
  };

  const speakDraft = () => {
    say(draft);
    setDraft("");
  };

  const makeSentence = async () => {
    setComposing(true);
    try {
      const { text } = await speechApi.sentence(draft, prefs.lang);
      setDraft(text);
    } catch (err) {
      toast.error("Couldn't build a sentence", {
        description:
          err instanceof ApiError && err.status === 503
            ? "The sentence helper is offline right now. You can still edit the text and press Speak."
            : undefined,
      });
    } finally {
      setComposing(false);
    }
  };

  const addReply = (text: string) => {
    const clean = text.trim();
    if (clean) setMessages((m) => [...m, { id: nextId(), from: "them", text: clean }]);
  };

  const submitReply = (e: FormEvent) => {
    e.preventDefault();
    addReply(reply);
    setReply("");
  };

  const toggleListening = () => {
    if (listening.listening) {
      listening.stop();
      return;
    }
    speaker.stop();
    listening.start(speechLocale(prefs.lang), {
      onFinal: addReply,
      onError: (code) =>
        toast.error(
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone access is blocked"
            : "Couldn't hear that, try again",
          {
            description:
              code === "not-allowed" || code === "service-not-allowed"
                ? "Allow microphone access in your browser, or type the reply instead."
                : undefined,
          },
        ),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <SignRecognizer onResult={addSign} />

        {/* ===== Pesan yang akan dibacakan ===== */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Your message</h2>
              <p className="text-xs text-slate-500">
                Every sign you record is added here. You can also type or fix it.
              </p>
            </div>
            {draft && (
              <button
                type="button"
                onClick={() => setDraft("")}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <label htmlFor="sign-message" className="sr-only">
            Your message
          </label>
          <textarea
            id="sign-message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && draft.trim()) {
                e.preventDefault();
                speakDraft();
              }
            }}
            maxLength={MAX_CHARS}
            rows={3}
            placeholder="Record a sign, or type what you want to say…"
            className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2DA5A2]/20"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={makeSentence}
              disabled={!draft.trim() || composing}
              className="h-11 rounded-xl px-4 font-semibold"
            >
              {composing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#FD661F]" />}
              Make it a sentence
            </Button>
            <Button
              onClick={speakDraft}
              disabled={!draft.trim()}
              className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
            >
              <Volume2 className="h-4 w-4" /> Speak
            </Button>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500">Quick phrases</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_REPLIES[prefs.lang].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => say(phrase)}
                  className="rounded-full bg-[#E7F3F2] px-3.5 py-1.5 text-sm font-medium text-[#0B7077] transition-colors hover:bg-[#d3ebe9]"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Percakapan ===== */}
      <div className="flex flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 lg:col-span-5">
        <div className="border-b border-slate-100 p-6 pb-4">
          <h2 className="font-heading text-lg font-bold text-slate-800">Conversation</h2>
          <p className="text-xs text-slate-500">
            Your messages are spoken out loud. Their replies show up here in large text.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Segmented
              label="Language"
              options={SPEECH_LANGS}
              value={prefs.lang}
              onChange={(lang) => setPrefs((p) => ({ ...p, lang }))}
            />
            <Segmented
              label="Voice"
              options={SPEECH_VOICES}
              value={prefs.voice}
              onChange={(voice) => setPrefs((p) => ({ ...p, voice }))}
            />
          </div>
          {speaker.engine === "browser" && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The natural voice is offline, so your browser&apos;s voice is used for now.
            </p>
          )}
        </div>

        <div
          ref={listRef}
          aria-live="polite"
          className="flex h-[360px] flex-col gap-3 overflow-y-auto p-6 lg:h-0 lg:min-h-[360px] lg:flex-1"
        >
          {messages.length === 0 && !listening.listening ? (
            <div className="m-auto max-w-xs text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F3F2] text-[#0B7077]">
                <Volume2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Start the conversation</p>
              <p className="mt-1 text-sm text-slate-500">
                Sign or type a message, then press Speak. When the other person answers, tap the
                mic or type their reply below.
              </p>
            </div>
          ) : (
            messages.map((m) =>
              m.from === "me" ? (
                <div key={m.id} className="flex max-w-[85%] flex-col items-end self-end">
                  <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] px-4 py-3 text-base font-semibold text-white">
                    {m.text}
                  </div>
                  <button
                    type="button"
                    onClick={() => (speaker.speakingId === m.id ? speaker.stop() : speaker.speak(m.id, m.text))}
                    className="mt-1 flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:text-[#0B7077]"
                  >
                    {speaker.loadingId === m.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing voice…
                      </>
                    ) : speaker.speakingId === m.id ? (
                      <>
                        <Square className="h-3 w-3 fill-current" /> Speaking… tap to stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" /> Play again
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div key={m.id} className="max-w-[90%] self-start">
                  <p className="mb-1 text-xs font-semibold text-slate-400">They said</p>
                  <div className="rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3 font-heading text-xl font-bold leading-snug text-slate-900 ring-1 ring-slate-100 md:text-2xl">
                    {m.text}
                  </div>
                </div>
              ),
            )
          )}
          {listening.listening && (
            <div className="max-w-[90%] self-start">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#DF5D73]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> Listening
              </p>
              <div className="rounded-2xl rounded-bl-md border border-dashed border-slate-200 px-4 py-3 text-xl font-semibold italic text-slate-500">
                {listening.interim || "…"}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submitReply} className="border-t border-slate-100 p-4">
          <label htmlFor="their-reply" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Ear className="h-3.5 w-3.5" /> Their reply
          </label>
          <div className="flex gap-2">
            {listening.supported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={listening.listening ? "Stop listening" : "Listen to their reply"}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                  listening.listening
                    ? "bg-[#DF5D73] text-white"
                    : "bg-[#E7F3F2] text-[#0B7077] hover:bg-[#d3ebe9]",
                )}
              >
                {listening.listening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
            <input
              id="their-reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder={listening.supported ? "Tap the mic, or type their reply" : "Type their reply"}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2DA5A2]/20"
            />
            <Button
              type="submit"
              disabled={!reply.trim()}
              aria-label="Add their reply"
              className="h-11 w-11 shrink-0 rounded-xl bg-[#0B7077] p-0 text-white hover:bg-[#0B7077]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              value === o.value ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
