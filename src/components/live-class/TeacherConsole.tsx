"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Link2, Loader2, Mic, Pause, Plus, Square } from "lucide-react";
import { toast } from "sonner";
import { liveApi, type LiveClassDetail, type LiveSegment } from "@/lib/live-class";
import { cn } from "@/lib/utils";
import { ClassHeader, ConnectionNotice, FatalState } from "./LiveClassChrome";
import { TranscriptPanel } from "./TranscriptPanel";
import { useLiveClassSocket } from "./useLiveClassSocket";
import { useMicStreamer } from "./useMicStreamer";

const TIPS = [
  "Use a headset or clip-on mic in noisy rooms.",
  "Pause briefly between sentences so each one is signed sooner.",
  "Keep this tab open while you teach. Closing it pauses the broadcast.",
];

function CodeCard({ code }: { code: string }) {
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Gagal menyalin");
    }
  };
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/live-class/${code}`;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 backdrop-blur">
      <div className="px-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Class code</p>
        <p className="font-mono text-3xl font-bold tracking-[0.2em]">{code}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => copy(code, "Code")}
          className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0B7077] transition-colors hover:bg-teal-50"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden /> Code
        </button>
        <button
          type="button"
          onClick={() => copy(link, "Link")}
          className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden /> Link
        </button>
      </div>
    </div>
  );
}

// Batas tunggu konfirmasi server setelah tombol mulai ditekan.
const START_TIMEOUT_MS = 15_000;
// Audio yang ditahan selama menunggu konfirmasi siaran (50 x 100 ms = 5 detik).
const MAX_PENDING_CHUNKS = 50;

export function TeacherConsole({ initial }: { initial: LiveClassDetail }) {
  const { level: micLevel, start: startMic, stop: stopMic, isActive: isMicActive } = useMicStreamer();
  const [starting, setStartingState] = useState(false);
  // Dibaca di callback event socket (di luar render).
  const startingRef = useRef(false);
  const broadcastingRef = useRef(false);
  // Ucapan pertama guru sering langsung setelah tombol ditekan: tahan dulu sampai server siap.
  const pendingAudio = useRef<ArrayBuffer[]>([]);
  const setStarting = (value: boolean) => {
    startingRef.current = value;
    setStartingState(value);
  };
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [fullTranscript, setFullTranscript] = useState<LiveSegment[] | null>(null);
  const { state, command, sendAudio } = useLiveClassSocket(initial.code, {
    onError: (message) => {
      // Gagal memulai/melanjutkan transkripsi: matikan mikrofon juga.
      setStarting(false);
      stopMic();
      toast.error(message);
    },
    onEvent: (event) => {
      if (event.type !== "status" && event.type !== "ready") return;
      broadcastingRef.current = event.broadcasting;
      if (event.broadcasting) {
        setStarting(false);
        pendingAudio.current.forEach(sendAudio);
        pendingAudio.current = [];
        return;
      }
      pendingAudio.current = [];
      // Siaran berhenti dari sisi server (batas waktu, transkripsi gagal, koneksi putus).
      if (!startingRef.current && isMicActive()) {
        stopMic();
        const status = event.type === "status" ? event.status : event.class.status;
        if (status !== "ended") toast.info("Broadcast paused");
      }
    },
  });

  const cls = state.cls ?? initial;
  const status = state.status ?? initial.status;
  const ended = status === "ended";

  useEffect(() => {
    if (!starting) return;
    const timer = setTimeout(() => {
      startingRef.current = false;
      setStartingState(false);
      stopMic();
      toast.error("Siaran gagal dimulai", { description: "Server tidak merespons, coba lagi." });
    }, START_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [starting, stopMic]);

  useEffect(() => {
    if (!ended) return;
    stopMic();
    liveApi
      .segments(initial.code)
      .then(setFullTranscript)
      .catch(() => {});
  }, [ended, initial.code, stopMic]);

  if (state.fatal) return <FatalState message={state.fatal} />;

  const start = async () => {
    setStarting(true);
    try {
      await startMic((pcm) => {
        if (broadcastingRef.current) {
          sendAudio(pcm);
          return;
        }
        pendingAudio.current.push(pcm);
        if (pendingAudio.current.length > MAX_PENDING_CHUNKS) pendingAudio.current.shift();
      });
    } catch (err) {
      setStarting(false);
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      toast.error("Mikrofon tidak bisa diakses", {
        description: denied ? "Izinkan akses mikrofon di browser, lalu coba lagi." : undefined,
      });
      return;
    }
    command("start");
  };

  const pause = () => {
    command("stop");
    stopMic();
  };

  const end = () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 4000);
      return;
    }
    command("end");
    stopMic();
  };

  const live = state.broadcasting;
  const connected = state.connection === "open";
  // Level RMS ucapan biasanya 0.02-0.2; diperbesar supaya indikator terlihat bergerak.
  const levelPct = Math.min(100, Math.round(Math.sqrt(micLevel) * 220));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ClassHeader cls={cls} status={status} broadcasting={live} viewers={state.viewers}>
        {!ended && <CodeCard code={cls.code} />}
      </ClassHeader>
      <ConnectionNotice connection={state.connection} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {ended ? (
            <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="font-heading text-xl font-bold text-slate-800">This class has ended</h2>
              <p className="text-sm text-slate-500">
                The transcript is saved. Students who open the class link can still read it.
              </p>
              <Link
                href="/live-class"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 text-sm font-semibold text-white shadow-md shadow-teal-900/10"
              >
                <Plus className="h-4 w-4" aria-hidden /> Start a new class
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-col items-center gap-5 py-4 text-center">
                <button
                  type="button"
                  onClick={live ? pause : start}
                  disabled={!connected || starting}
                  aria-label={live ? "Pause broadcast" : "Start broadcast"}
                  className={cn(
                    "relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
                    live
                      ? "bg-gradient-to-br from-[#FD661F] to-[#DF5D73] shadow-orange-900/20"
                      : "bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] shadow-teal-900/20",
                  )}
                >
                  {live && <span className="absolute inset-0 animate-ping rounded-full bg-[#FD661F]/30" aria-hidden />}
                  {starting ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : live ? (
                    <Pause className="h-10 w-10" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </button>
                <div>
                  <p className="font-heading text-lg font-bold text-slate-800">
                    {starting
                      ? "Connecting…"
                      : live
                        ? "You're live"
                        : status === "live"
                          ? "Broadcast paused"
                          : "Ready when you are"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {live
                      ? "Students see your words as captions and sign language."
                      : "Press the mic to start. Students can join with the class code."}
                  </p>
                </div>
                <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-[width] duration-100"
                    style={{ width: `${live ? levelPct : 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Live caption</p>
                <p className="mt-2 min-h-[3rem] text-lg leading-relaxed text-slate-700" aria-live="polite">
                  {state.partial || (live ? "Listening…" : "—")}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <ul className="space-y-1.5 text-sm text-slate-500">
                  {TIPS.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2DA5A2]" aria-hidden />
                      {tip}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={end}
                  disabled={!connected}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-50",
                    confirmEnd
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
                  )}
                >
                  <Square className="h-4 w-4" aria-hidden />
                  {confirmEnd ? "Tap again to end" : "End class"}
                </button>
              </div>
            </div>
          )}
        </div>

        <TranscriptPanel
          cls={cls}
          segments={ended && fullTranscript ? fullTranscript : state.segments}
          partial={ended ? "" : state.partial}
          emptyText={ended ? "No transcript for this class." : "Your sentences appear here as you speak."}
          className="h-[480px] lg:col-span-5 lg:h-auto lg:max-h-[640px]"
        />
      </div>
    </div>
  );
}
