"use client";

// Hook bersama: ambil transcript YouTube -> pre-translate ke pose -> sinkronkan
// klip aktif dengan waktu pemutaran video. Dipakai halaman yang ingin avatar
// "berisyarat sesuai isi video" (live-translator & detail learning-material).
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { translateToPose, type PoseClip } from "./translate";

// Subset method YT.Player yang dipakai.
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
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

export interface TranscriptSign {
  /** Pasang ke <YouTube onReady>. */
  onReady: (e: { target: YTPlayer }) => void;
  /** Pasang ke <YouTube onStateChange>. */
  onStateChange: (e: { data: number }) => void;
  /** True saat video sedang diputar (YT state 1). */
  videoPlaying: boolean;
  /** Klip pose untuk cue yang sedang aktif (null = jeda/diam). */
  activeClip: PoseClip | null;
  /** True selagi transcript diambil / diterjemahkan. */
  preparing: boolean;
  /** True bila video tak punya caption -> caller boleh fallback gerak acak. */
  unavailable: boolean;
  /** Progres pre-translate (untuk UI loading opsional). */
  progress: { done: number; total: number };
}

/**
 * Sinkronkan avatar dengan transcript video YouTube.
 * @param videoUrl URL/embed video (butuh caption/subtitle). null = nonaktif.
 */
export function useTranscriptSign(videoUrl: string | null): TranscriptSign {
  const [rawCues, setRawCues] = useState<RawCue[] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [cues, setCues] = useState<Cue[] | null>(null);
  const [poses, setPoses] = useState<(PoseClip | null)[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [activeIdx, setActiveIdx] = useState(-1);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const processedRef = useRef(false);

  // Ambil transcript begitu ada videoUrl.
  useEffect(() => {
    if (!videoUrl) return;
    let cancelled = false;
    setUnavailable(false);
    api.post<{ cues: RawCue[] }>("/api/translator/transcript", { url: videoUrl })
      .then((d) => {
        if (cancelled) return;
        if (d.cues && d.cues.length) setRawCues(d.cues);
        else setUnavailable(true);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true); // tak ada caption -> fallback caller
      });
    return () => {
      cancelled = true;
    };
  }, [videoUrl]);

  const onReady = useCallback((e: { target: YTPlayer }) => {
    playerRef.current = e.target;
    try {
      setDuration(e.target.getDuration() || null);
    } catch {
      setDuration(null);
    }
    setPlayerReady(true);
  }, []);

  // Avatar ikut play/pause video. YT.PlayerState: 1 = playing.
  const onStateChange = useCallback((e: { data: number }) => {
    setVideoPlaying(e.data === 1);
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
  const activeClip = activeIdx >= 0 ? poses[activeIdx] ?? null : null;
  const preparing = !!videoUrl && !unavailable && (!cues || preTranslating);

  return {
    onReady,
    onStateChange,
    videoPlaying,
    activeClip,
    preparing,
    unavailable,
    progress,
  };
}
