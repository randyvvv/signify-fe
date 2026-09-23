"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  BookmarkPlus,
  Camera,
  Captions,
  Check,
  ChevronLeft,
  Hand,
  Languages,
  Link as LinkIcon,
  Loader2,
  Play,
  Type,
  Video,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { translateToPose, type PoseClip } from "@/components/shared/avatar/translate";
import { SignRecognizer } from "@/components/translator/SignRecognizer";
import { cn } from "@/lib/utils";

type Mode = "to-sign" | "to-text";
type Source = "video" | "text";

const MAX_TEXT = 500;
const QUICK_PHRASES = ["Hello", "Thank you", "How are you?", "Nice to meet you", "I love you"];

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// react-youtube pakai window -> klien saja.
const YouTube = dynamic(() => import("react-youtube"), { ssr: false });

// Subset method YT.Player yang dipakai.
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
}

interface RawCue {
  text: string;
  offset: number;
  duration: number;
}
// Cue ter-normalisasi (detik).
interface Cue {
  start: number;
  end: number;
  text: string;
}

// Ekstrak videoId dari berbagai bentuk URL YouTube (atau id mentah 11 char).
function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  try {
    const u = new URL(raw);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(embed|live|shorts|v)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return /^[\w-]{11}$/.test(raw) ? raw : null;
  }
}

// Gabungkan cue pendek berurutan -> frasa lebih bermakna & lebih sedikit panggilan API.
function mergeCues(cues: Cue[], maxChars = 64, maxSpan = 6): Cue[] {
  const out: Cue[] = [];
  let cur: Cue | null = null;
  for (const c of cues) {
    if (!cur) {
      cur = { ...c };
      continue;
    }
    const merged = `${cur.text} ${c.text}`.trim();
    if (merged.length <= maxChars && c.end - cur.start <= maxSpan) {
      cur.text = merged;
      cur.end = c.end;
    } else {
      out.push(cur);
      cur = { ...c };
    }
  }
  if (cur) out.push(cur);
  return out;
}

export default function LiveTranslatorPage() {
  const [mode, setMode] = useState<Mode>("to-sign");
  const [source, setSource] = useState<Source>("video");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [starting, setStarting] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Transcript & pose hasil pre-translate.
  const [rawCues, setRawCues] = useState<RawCue[] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [cues, setCues] = useState<Cue[] | null>(null);
  const [poses, setPoses] = useState<(PoseClip | null)[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [activeIdx, setActiveIdx] = useState(-1);

  const playerRef = useRef<YTPlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const processedRef = useRef(false); // cegah pre-translate dobel

  // Mode teks manual (saat belum ada video).
  const [signText, setSignText] = useState("");
  const [committedSign, setCommittedSign] = useState("");

  const videoActive = !!videoId;
  const avatar = useEquippedAvatar();

  const handleSign = () => {
    if (!signText.trim()) {
      toast.error("Enter text to translate");
      return;
    }
    setCommittedSign(signText.trim());
  };

  // Simpan teks yang sedang diperagakan ke kosakata pribadi (My Signs).
  const saveToMySigns = async () => {
    if (!committedSign) return;
    try {
      await api.post("/api/vocabulary", { word: committedSign, source: "translator" });
      toast.success(`Saved "${committedSign}" to My Signs`);
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof ApiError ? err.message : undefined,
      });
    }
  };

  const handleStart = async () => {
    const id = parseYouTubeId(url);
    if (!id) {
      toast.error("Invalid YouTube URL");
      return;
    }
    // Reset state lama.
    setStarting(true);
    setVideoId(id);
    setRawCues(null);
    setDuration(null);
    setCues(null);
    setPoses([]);
    setProgress({ done: 0, total: 0 });
    setActiveIdx(-1);
    setPlayerReady(false);
    processedRef.current = false;

    try {
      const data = await api.post<{ cues: RawCue[] }>(
        "/api/translator/transcript",
        { url: url.trim() },
      );
      setRawCues(data.cues);
      toast.success("Transcript loaded", {
        description: "Preparing sign language translation…",
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to fetch transcript";
      toast.error("Failed", { description: msg });
      setVideoId(null);
    } finally {
      setStarting(false);
    }
  };

  const onPlayerReady = useCallback((event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    try {
      setDuration(event.target.getDuration() || null);
    } catch {
      setDuration(null);
    }
    setPlayerReady(true);
  }, []);

  // Avatar ikut play/pause video. YT.PlayerState: 1 = playing.
  const onPlayerStateChange = useCallback((event: { data: number }) => {
    setVideoPlaying(event.data === 1);
  }, []);

  // Pre-translate: jalan saat transcript + durasi video sudah ada.
  useEffect(() => {
    if (!rawCues || duration == null || processedRef.current) return;
    processedRef.current = true;

    // Normalisasi satuan (ms vs detik) pakai durasi video.
    const endRaw = Math.max(...rawCues.map((c) => c.offset + c.duration));
    const scale = endRaw > duration * 2 ? 1000 : 1;
    const normalized: Cue[] = rawCues.map((c) => ({
      start: c.offset / scale,
      end: (c.offset + c.duration) / scale,
      text: c.text,
    }));
    const merged = mergeCues(normalized);
    setCues(merged);
    setPoses(new Array(merged.length).fill(null));
    setProgress({ done: 0, total: merged.length });

    let cancelled = false;
    const cache = new Map<string, PoseClip | null>();
    const CONCURRENCY = 4;
    let next = 0;
    let done = 0;

    const worker = async () => {
      while (next < merged.length && !cancelled) {
        const idx = next++;
        const txt = merged[idx].text.trim();
        let clip: PoseClip | null = null;
        if (txt) {
          if (cache.has(txt)) {
            clip = cache.get(txt) ?? null;
          } else {
            try {
              clip = await translateToPose(txt);
            } catch {
              clip = null;
            }
            cache.set(txt, clip);
          }
        }
        if (cancelled) return;
        setPoses((prev) => {
          const copy = prev.slice();
          copy[idx] = clip;
          return copy;
        });
        done++;
        setProgress({ done, total: merged.length });
      }
    };

    Promise.all(Array.from({ length: CONCURRENCY }, worker));

    return () => {
      cancelled = true;
    };
  }, [rawCues, duration]);

  // Sinkronisasi: cocokkan currentTime video -> cue aktif.
  useEffect(() => {
    if (!playerReady || !cues || cues.length === 0) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      let t = 0;
      try {
        t = p.getCurrentTime() || 0;
      } catch {
        return;
      }
      let idx = -1;
      for (let i = 0; i < cues.length; i++) {
        if (t >= cues[i].start && t < cues[i].end) {
          idx = i;
          break;
        }
        if (cues[i].start > t) break;
      }
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    }, 200);
    return () => clearInterval(id);
  }, [playerReady, cues]);

  // Gulir transcript agar baris aktif tetap terlihat (hanya di dalam panelnya).
  useEffect(() => {
    const box = transcriptRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-cue="${activeIdx}"]`);
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top || r.bottom > b.bottom) {
      box.scrollTo({ top: box.scrollTop + (r.top - b.top) - b.height / 3, behavior: "smooth" });
    }
  }, [activeIdx]);

  const preTranslating = progress.total > 0 && progress.done < progress.total;
  const activeClip = videoActive && activeIdx >= 0 ? poses[activeIdx] : null;

  // Fase: sebelum semua selesai diterjemahkan -> tampilkan loading, sembunyikan
  // player & transcript. Player tetap di-mount (tersembunyi) untuk ambil durasi.
  const ready = videoActive && !!cues && !preTranslating;
  const preparing = videoActive && !ready;
  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const prepLabel = !rawCues
    ? "Fetching transcript…"
    : !cues
      ? "Preparing…"
      : "Translating to sign language…";

  const signingNow = source === "video" ? activeClip != null && videoPlaying : !!committedSign;
  const status: { label: string; tone: string } =
    source === "video" && preparing
      ? { label: "Preparing", tone: "bg-amber-100 text-amber-700" }
      : signingNow
        ? { label: "Signing", tone: "bg-emerald-100 text-emerald-700" }
        : source === "video" && ready && !videoPlaying
          ? { label: "Paused", tone: "bg-slate-100 text-slate-600" }
          : { label: "Ready", tone: "bg-teal-100 text-teal-700" };
  const nowSigning =
    source === "video"
      ? activeIdx >= 0 && cues
        ? cues[activeIdx]?.text
        : null
      : committedSign || null;

  // Langkah progres persiapan video.
  const steps = [
    { label: "Fetch transcript", done: !!rawCues },
    { label: "Translate to sign", done: !!cues && !preTranslating },
    { label: "Ready to play", done: ready },
  ];
  const activeStep = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:px-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">Live Translator</h1>
              <p className="text-sm text-white/80">
                {mode === "to-sign"
                  ? "Turn videos and text into sign language with your avatar"
                  : "Sign in front of your camera and get the text"}
              </p>
            </div>
          </div>
          <div className="flex w-full rounded-2xl bg-white/15 p-1 ring-1 ring-white/20 backdrop-blur md:ml-auto md:w-auto">
            {(
              [
                { value: "to-sign", label: "Text → Sign", icon: Languages },
                { value: "to-text", label: "Sign → Text", icon: Camera },
              ] as const
            ).map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all md:flex-none",
                  mode === m.value
                    ? "bg-white text-[#0B7077] shadow-sm"
                    : "text-white/85 hover:bg-white/10",
                )}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "to-text" ? (
        <SignRecognizer />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ===== Kiri: sumber ===== */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              {/* Tab sumber */}
              <div className="mb-5 inline-flex rounded-2xl bg-slate-100 p-1">
                {(
                  [
                    { value: "video", label: "YouTube video", icon: Video },
                    { value: "text", label: "Type text", icon: Type },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSource(s.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                      source === s.value
                        ? "bg-white text-[#0B7077] shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Kedua panel tetap di-mount supaya player YouTube tidak reset saat ganti tab. */}
              <div className={cn(source !== "video" && "hidden")}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleStart()}
                        placeholder="Paste a YouTube link, e.g. https://youtu.be/..."
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
                      />
                    </div>
                    <Button
                      onClick={handleStart}
                      disabled={starting || preparing}
                      className="h-12 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
                    >
                      {starting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                      Translate
                    </Button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Captions className="h-3.5 w-3.5" />
                    Works with videos that have captions (auto-captions included).
                  </p>

                  {/* Player */}
                  <div className="relative mt-5 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {videoId ? (
                      <YouTube
                        videoId={videoId}
                        className="h-full w-full"
                        iframeClassName="w-full h-full"
                        opts={{
                          width: "100%",
                          height: "100%",
                          playerVars: { autoplay: 0 },
                        }}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 px-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#2DA5A2] shadow-sm">
                          <Video className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-slate-700">No video yet</p>
                        <p className="max-w-xs text-sm text-slate-500">
                          Paste a YouTube link above and the avatar will sign along with the video.
                        </p>
                      </div>
                    )}

                    {/* Overlay persiapan: menutup player sampai terjemahan siap. */}
                    {preparing && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-white/95 px-8 text-center backdrop-blur">
                        <Loader2 className="h-10 w-10 animate-spin text-[#2DA5A2]" />
                        <div>
                          <p className="font-heading text-lg font-bold text-slate-800">{prepLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            The video starts once the sign language translation is ready.
                          </p>
                        </div>
                        <ol className="flex w-full max-w-md items-center">
                          {steps.map((s, i) => (
                            <li key={s.label} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center gap-1.5">
                                <span
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                                    s.done
                                      ? "bg-[#2DA5A2] text-white"
                                      : i === activeStep
                                        ? "bg-teal-100 text-[#0B7077] ring-4 ring-teal-50"
                                        : "bg-slate-100 text-slate-400",
                                  )}
                                >
                                  {s.done ? <Check className="h-4 w-4" /> : i + 1}
                                </span>
                                <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                                  {s.label}
                                </span>
                              </div>
                              {i < steps.length - 1 && (
                                <span
                                  className={cn(
                                    "mx-2 mb-5 h-0.5 flex-1 rounded-full",
                                    s.done ? "bg-[#2DA5A2]" : "bg-slate-200",
                                  )}
                                />
                              )}
                            </li>
                          ))}
                        </ol>
                        {cues && (
                          <div className="w-full max-w-md">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              {percent}% · {progress.done}/{progress.total} segments
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              </div>
              <div className={cn("flex flex-col gap-4", source !== "text" && "hidden")}>
                  <div className="relative">
                    <textarea
                      value={signText}
                      onChange={(e) => setSignText(e.target.value.slice(0, MAX_TEXT))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSign();
                        }
                      }}
                      rows={5}
                      placeholder="Type a word or sentence, then press Sign…"
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 pb-8 text-base text-slate-800 transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-slate-400">
                      {signText.length}/{MAX_TEXT}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PHRASES.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSignText(p);
                          setCommittedSign(p);
                        }}
                        className="rounded-full border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleSign}
                      className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
                    >
                      <Hand className="h-4 w-4" /> Sign it
                    </Button>
                    {committedSign && (
                      <Button
                        variant="outline"
                        onClick={saveToMySigns}
                        className="h-11 rounded-xl border-slate-200 font-semibold text-slate-700"
                      >
                        <BookmarkPlus className="h-4 w-4" /> Save to My Signs
                      </Button>
                    )}
                  </div>
              </div>
            </div>

            {/* Transcript (mode video) */}
            {source === "video" && (
              <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Captions className="h-5 w-5 text-[#2DA5A2]" />
                    <h2 className="font-heading font-bold text-slate-800">Transcript</h2>
                  </div>
                  {ready && cues && (
                    <span className="text-xs text-slate-400">Click a line to jump there</span>
                  )}
                </div>
                <div ref={transcriptRef} className="max-h-[340px] overflow-y-auto p-3">
                  {ready && cues ? (
                    cues.map((c, i) => (
                      <button
                        key={i}
                        data-cue={i}
                        onClick={() => playerRef.current?.seekTo(c.start, true)}
                        className={cn(
                          "flex w-full gap-4 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                          i === activeIdx
                            ? "bg-teal-50 font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-12 shrink-0 font-mono text-xs leading-5",
                            i === activeIdx ? "text-[#0B7077]" : "text-slate-400",
                          )}
                        >
                          {fmtTime(c.start)}
                        </span>
                        <span className="leading-5">{c.text}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">
                      {preparing
                        ? `${prepLabel} ${cues ? `(${percent}%)` : ""}`
                        : "Start a video to see its transcript here."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== Kanan: avatar ===== */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-800">Translator Avatar</h2>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    status.tone,
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full bg-current",
                      status.label === "Signing" && "animate-pulse",
                    )}
                  />
                  {status.label}
                </span>
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#C5FBF9]/60 to-[#FDF5BF]/60">
                {source === "video" ? (
                  <SignAvatarViewer
                    vrmUrl={avatar.vrmUrl}
                    hairColor={avatar.hairColor}
                    eyeColor={avatar.eyeColor}
                    accessory={avatar.accessory}
                    frames={activeClip ? activeClip.frames : null}
                    meta={activeClip?.meta}
                    loading={preparing}
                    playing={videoPlaying}
                    className="h-full w-full"
                    placeholder={videoActive ? "Play the video to see the avatar signing" : ""}
                  />
                ) : (
                  <SignAvatarViewer
                    vrmUrl={avatar.vrmUrl}
                    hairColor={avatar.hairColor}
                    eyeColor={avatar.eyeColor}
                    accessory={avatar.accessory}
                    text={committedSign}
                    className="h-full w-full"
                    placeholder="Type text and press Sign it"
                  />
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Now signing
                </p>
                <p className="mt-0.5 line-clamp-3 text-sm font-medium text-slate-700">
                  {nowSigning ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
