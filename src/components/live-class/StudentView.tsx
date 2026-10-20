"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FastForward, Maximize2, Minimize2, Radio, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { translateToPose, type PoseClip } from "@/components/shared/avatar/translate";
import { liveApi, type LiveClassDetail, type LiveSegment } from "@/lib/live-class";
import { cn } from "@/lib/utils";
import { ClassHeader, ConnectionNotice, FatalState } from "./LiveClassChrome";
import { TranscriptPanel } from "./TranscriptPanel";
import { useLiveClassSocket, type LiveState } from "./useLiveClassSocket";
import { useLiveVideo } from "./useLiveVideo";
import { VideoTile } from "./VideoTile";

// Jeda antar kalimat (juga mereset frame avatar ke awal klip).
const GAP_MS = 150;
// Tombol "Catch up" muncul bila avatar tertinggal sebanyak ini.
const BEHIND_LIMIT = 3;
// Kalimat yang isyaratnya tak kunjung siap dilewati setelah ini.
const STALL_MS = 20_000;

interface QueueView {
  current: { seq: number; clip: PoseClip } | null;
  playing: boolean;
  /** Kalimat berikutnya yang akan diputar. */
  cursor: number | null;
}

/**
 * Antrean isyarat: kalimat diputar berurutan (seq) begitu posenya siap.
 * Kalimat tanpa isyarat dilewati; kalimat yang posenya tak kunjung siap juga
 * dilewati setelah STALL_MS supaya antrean tidak macet.
 */
class SignQueue {
  private readonly clips = new Map<number, PoseClip | null>();
  private cursor: number | null = null;
  private current: QueueView["current"] = null;
  private lastSeq = -1;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private stall: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onChange: (view: QueueView) => void) {}

  /** Mulai dari kalimat pertama yang diucapkan setelah bergabung (atau tersambung ulang). */
  startFrom(seq: number): void {
    this.cursor = this.cursor === null ? seq : Math.max(this.cursor, seq);
    this.pump();
  }

  seen(seq: number): void {
    this.lastSeq = Math.max(this.lastSeq, seq);
    this.pump();
  }

  resolve(seq: number, clip: PoseClip | null): void {
    this.clips.set(seq, clip);
    this.pump();
  }

  catchUp(): void {
    this.clearTimers();
    this.current = null;
    this.cursor = this.lastSeq;
    this.emit(false);
    this.pump();
  }

  dispose(): void {
    this.clearTimers();
  }

  private pump(): void {
    if (this.current || this.cursor === null) return;
    while (this.clips.has(this.cursor) && this.clips.get(this.cursor) === null) this.cursor++;
    const clip = this.clips.get(this.cursor);
    if (!clip) {
      this.watchStall();
      this.emit(false);
      return;
    }
    if (this.stall) clearTimeout(this.stall);
    this.stall = null;
    const seq = this.cursor;
    this.cursor = seq + 1;
    this.current = { seq, clip };
    // playing=false sebentar: frame avatar kembali ke awal klip sebelum diputar.
    this.emit(false);
    const durationMs = (clip.frames.length / (clip.meta.fps || 25)) * 1000;
    this.timers.push(
      setTimeout(() => this.emit(true), GAP_MS),
      setTimeout(() => {
        this.current = null;
        this.emit(false);
        this.pump();
      }, GAP_MS + durationMs),
    );
  }

  private watchStall(): void {
    if (this.stall || this.cursor === null || this.cursor > this.lastSeq) return;
    const waitingFor = this.cursor;
    this.stall = setTimeout(() => {
      this.stall = null;
      if (this.cursor === waitingFor && !this.clips.has(waitingFor)) this.cursor = waitingFor + 1;
      this.pump();
    }, STALL_MS);
  }

  private emit(playing: boolean): void {
    this.onChange({ current: this.current, playing, cursor: this.cursor });
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.stall) clearTimeout(this.stall);
    this.stall = null;
  }
}

function useSignQueue(state: LiveState) {
  const { cls, segments, poses, liveFromSeq } = state;
  const [view, setView] = useState<QueueView>({ current: null, playing: false, cursor: null });
  const [queue] = useState(() => new SignQueue(setView));
  const requested = useRef(new Set<number>());

  useEffect(() => () => queue.dispose(), [queue]);

  useEffect(() => {
    if (cls) queue.startFrom(liveFromSeq);
  }, [queue, cls, liveFromSeq]);

  const lastSeq = segments.at(-1)?.seq ?? -1;
  useEffect(() => {
    queue.seen(lastSeq);
  }, [queue, lastSeq]);

  // Ambil pose (sudah di-cache server) untuk setiap kalimat yang siap.
  useEffect(() => {
    if (!cls) return;
    for (const [key, ok] of Object.entries(poses)) {
      const seq = Number(key);
      if (seq < liveFromSeq || requested.current.has(seq)) continue;
      const segment = segments.find((s) => s.seq === seq);
      if (!segment) continue;
      requested.current.add(seq);
      if (!ok) {
        queue.resolve(seq, null);
        continue;
      }
      translateToPose(segment.text, cls.signedLanguage, cls.spokenLanguage)
        .then((clip) => queue.resolve(seq, clip))
        .catch(() => queue.resolve(seq, null));
    }
  }, [queue, cls, poses, segments, liveFromSeq]);

  const behind = view.cursor === null ? 0 : Math.max(0, lastSeq - view.cursor + 1);
  const catchUp = useCallback(() => queue.catchUp(), [queue]);

  return { current: view.current, playing: view.playing, behind, catchUp };
}

export function StudentView({ initial }: { initial: LiveClassDetail }) {
  const { state } = useLiveClassSocket(initial.code, { onError: (message) => toast.error(message) });
  const avatar = useEquippedAvatar();
  const queue = useSignQueue(state);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullTranscript, setFullTranscript] = useState<LiveSegment[] | null>(null);

  const cls = state.cls ?? initial;
  const status = state.status ?? initial.status;
  const ended = status === "ended";
  const video = useLiveVideo(initial.code, !!initial.videoEnabled && !ended);
  // Mode video (seperti video call) hanya saat kamera guru menyala.
  const hasVideo = !!video.videoTrack;

  // Kelas selesai: tampilkan transkrip lengkap (WebSocket hanya mengirim 100 kalimat terakhir).
  useEffect(() => {
    if (!ended) return;
    liveApi
      .segments(initial.code)
      .then(setFullTranscript)
      .catch(() => {});
  }, [ended, initial.code]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen().catch(() => toast.error("Layar penuh tidak didukung"));
  };

  if (state.fatal) return <FatalState message={state.fatal} />;

  const signingText = queue.current
    ? state.segments.find((s) => s.seq === queue.current?.seq)?.text
    : null;
  const teacher = cls.teacherName ?? "the teacher";

  // Selama avatar masih memperagakan antrean, subtitle tetap tampil (juga setelah kelas berakhir).
  let stageMessage: string | null = null;
  if (queue.current) stageMessage = null;
  else if (ended) stageMessage = "This class has ended. The full transcript is on the right.";
  else if (!state.broadcasting)
    stageMessage =
      status === "waiting" ? `Waiting for ${teacher} to start the class…` : `${teacher} paused the broadcast.`;

  const transcript = (
    <TranscriptPanel
      cls={cls}
      segments={ended && fullTranscript ? fullTranscript : state.segments}
      partial={ended ? "" : state.partial}
      activeSeq={queue.current?.seq ?? null}
      emptyText={ended ? "No transcript for this class." : "Sentences appear here as the teacher speaks."}
      className={hasVideo ? "h-[360px]" : "h-[480px] lg:col-span-5 lg:h-auto lg:max-h-[620px]"}
    />
  );
  const liveCaption = state.partial || state.segments.at(-1)?.text;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ClassHeader cls={cls} status={status} broadcasting={state.broadcasting} viewers={state.viewers} />
      <ConnectionNotice connection={state.connection} />

      <div
        ref={hasVideo ? stageRef : undefined}
        className={cn(
          "grid grid-cols-1 gap-6 lg:grid-cols-12",
          hasVideo && fullscreen && "h-screen w-screen content-center bg-slate-950 p-4",
        )}
      >
        {/* Video guru (slot tetap supaya avatar di sebelahnya tidak dimuat ulang). */}
        {hasVideo && video.videoTrack && (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-sm lg:col-span-8">
            <VideoTile track={video.videoTrack} className="aspect-video h-full w-full object-contain" />
            {video.audioBlocked && (
              <button
                type="button"
                onClick={video.unlockAudio}
                className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden /> Turn on sound
              </button>
            )}
            {liveCaption && !ended && (
              <p
                aria-live="polite"
                className={cn(
                  "absolute inset-x-4 bottom-4 rounded-2xl bg-black/65 px-4 py-2 text-center font-semibold leading-snug text-white",
                  fullscreen ? "text-2xl" : "text-base md:text-lg",
                )}
              >
                {liveCaption}
              </p>
            )}
          </div>
        )}

        <div
          ref={hasVideo ? undefined : stageRef}
          className={cn(
            "relative flex flex-col overflow-hidden bg-white shadow-sm ring-1 ring-slate-100",
            hasVideo ? "rounded-3xl lg:col-span-4" : "lg:col-span-7",
            !hasVideo && (fullscreen ? "h-screen w-screen rounded-none" : "rounded-3xl"),
          )}
        >
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            {queue.behind >= BEHIND_LIMIT && (
              <button
                type="button"
                onClick={queue.catchUp}
                className="flex items-center gap-1.5 rounded-full bg-[#FD661F] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
              >
                <FastForward className="h-3.5 w-3.5" aria-hidden />
                Catch up ({queue.behind})
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md ring-1 ring-slate-100 transition-colors hover:text-[#0B7077]"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          <SignAvatarViewer
            frames={queue.current?.clip.frames ?? null}
            meta={queue.current?.clip.meta}
            playing={queue.playing}
            vrmUrl={avatar.vrmUrl}
            hairColor={avatar.hairColor}
            eyeColor={avatar.eyeColor}
            accessory={avatar.accessory}
            placeholder=""
            className={cn(
              "w-full bg-gradient-to-b from-[#E7F3F2] to-white",
              hasVideo ? "h-[300px] lg:h-auto lg:flex-1" : fullscreen ? "flex-1" : "h-[380px] md:h-[460px]",
            )}
          />

          <div className={cn("border-t border-slate-100 px-6 py-5", !hasVideo && fullscreen && "pb-10")}>
            {stageMessage ? (
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                {!ended && <Radio className="h-4 w-4 text-[#2DA5A2]" aria-hidden />}
                {stageMessage}
              </p>
            ) : (
              <>
                <p
                  className={cn(
                    "font-heading font-bold leading-snug text-[#0F5A5A]",
                    !hasVideo && fullscreen ? "text-3xl md:text-4xl" : "min-h-[1.75rem] text-xl md:text-2xl",
                  )}
                >
                  {signingText ?? "\u00A0"}
                </p>
                {!hasVideo && (
                  <p
                    className={cn("mt-2 italic text-slate-500", fullscreen ? "text-xl" : "min-h-[1.5rem] text-base")}
                    aria-live="polite"
                  >
                    {state.partial || "\u00A0"}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {!hasVideo && transcript}
      </div>

      {hasVideo && transcript}
    </div>
  );
}
