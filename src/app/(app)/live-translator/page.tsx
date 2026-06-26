"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Link as LinkIcon, Play, Video, Hand, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { translateToPose, type PoseClip } from "@/components/shared/avatar/translate";

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
      const res = await fetch("/api/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch transcript");
      setRawCues(data.cues as RawCue[]);
      toast.success("Transcript loaded", {
        description: "Preparing sign language translation…",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch transcript";
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

  return (
    <>
      <div className="flex flex-col gap-[30px]">
        {/* Header */}
        <div className="flex items-center gap-6 bg-white px-[50px] p-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Live Translator</h1>
            <p className="text-base text-gray-500">
              Watch a YouTube video and let the avatar translate it into sign
              language
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4 bg-white px-[57px] py-[20px] rounded-[10px]">
          <h2 className="font-heading text-2xl font-bold text-black">
            Enter YouTube URL
          </h2>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                placeholder="https://youtu.be/..."
                className="w-full h-12 rounded-[10px] border border-gray-300 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={starting}
              className="h-12 bg-quinary hover:bg-quinary/90 text-white px-8 rounded-[10px] font-semibold flex items-center gap-2"
            >
              {starting ? "Loading..." : "Start"}{" "}
              <Play className="w-4 h-4 fill-current" />
            </Button>
          </div>
          <p className="text-base text-grey">
            Supports YouTube videos that have captions/subtitles (including auto-captions).
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-[30px] gap-x-[20px]">
          {/* Video Player */}
          <div className="lg:col-span-2 bg-white pt-[35px] px-[30px] pb-[35px] rounded-[10px]">
            <div className="bg-senary/30 rounded-[10px] aspect-video relative flex items-center justify-center overflow-hidden shadow-sm">
              {videoId ? (
                <YouTube
                  videoId={videoId}
                  className="w-full h-full"
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
                <div className="flex flex-col items-center gap-3 text-grey/70 px-6 text-center">
                  <Video className="w-12 h-12" />
                  <p className="font-medium">
                    Enter a YouTube URL to start translating
                  </p>
                </div>
              )}

              {/* Loading overlay: menutup player sampai semua selesai diterjemahkan. */}
              {preparing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white px-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-quinary" />
                  <p className="text-lg font-semibold text-black">{prepLabel}</p>
                  {cues && (
                    <>
                      <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-quinary transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-grey">
                        {percent}% &middot; {progress.done}/{progress.total} segments
                      </p>
                    </>
                  )}
                  <p className="max-w-sm text-xs text-grey/70">
                    The video & transcript will appear once the sign language translation is ready.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex bg-white py-[45px] px-[30px] rounded-[10px] flex-col gap-[30px]">
            {/* Avatar Penerjemah */}
            <div className="flex flex-col gap-4">
              <h3 className="font-heading text-2xl font-bold text-black">
                Translator Avatar
              </h3>
              <div className="bg-senary/30 rounded-[10px] shadow-sm aspect-square w-full">
                {videoActive ? (
                  <SignAvatarViewer
                    vrmUrl={avatar.vrmUrl}
                    hairColor={avatar.hairColor}
                    eyeColor={avatar.eyeColor}
                    accessory={avatar.accessory}
                    frames={activeClip ? activeClip.frames : null}
                    meta={activeClip?.meta}
                    loading={preparing}
                    playing={videoPlaying}
                    className="w-full h-full"
                    placeholder="Play the video to see the avatar signing"
                  />
                ) : (
                  <SignAvatarViewer
                    vrmUrl={avatar.vrmUrl}
                    hairColor={avatar.hairColor}
                    eyeColor={avatar.eyeColor}
                    accessory={avatar.accessory}
                    text={committedSign}
                    className="w-full h-full"
                    placeholder="Type text then press Sign to see the avatar signing"
                  />
                )}
              </div>

              {/* Input teks manual hanya saat belum ada video. */}
              {!videoActive && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signText}
                    onChange={(e) => setSignText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSign()}
                    placeholder="e.g. HELLO"
                    className="flex-1 h-11 rounded-[10px] border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
                  />
                  <Button
                    onClick={handleSign}
                    className="h-11 bg-quinary hover:bg-quinary/90 text-white px-5 rounded-[10px] font-semibold flex items-center gap-2"
                  >
                    <Hand className="w-4 h-4" /> Sign
                  </Button>
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-[#C5FBF9] to-secondary p-4 rounded-t-[10px] flex justify-between items-center">
                <span className="font-bold text-black">Video Transcript</span>
                {preTranslating && (
                  <span className="text-xs font-semibold text-black/70">
                    Translating {progress.done}/{progress.total}
                  </span>
                )}
              </div>
              <div className="bg-white border-x border-b border-gray-100 rounded-b-[10px] py-[30px] px-[24px] shadow-sm max-h-[320px] overflow-y-auto">
                <div className="flex flex-col gap-2 text-sm text-grey leading-relaxed">
                  {ready && cues ? (
                    activeIdx >= 0 ? (
                      <p className="text-base font-medium leading-relaxed text-black">
                        {cues[activeIdx].text}
                      </p>
                    ) : (
                      <p className="text-center text-grey/70">
                        Play the video to follow the transcript.
                      </p>
                    )
                  ) : preparing ? (
                    <p className="text-center text-grey/70">
                      {prepLabel} {cues ? `(${percent}%)` : ""}
                    </p>
                  ) : (
                    <p className="text-center text-grey/70">
                      Start a video to show its transcript.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
