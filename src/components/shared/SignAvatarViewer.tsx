"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateToPose, type PoseMeta } from "./avatar/translate";

// Komponen three.js / WebGL hanya untuk browser (tanpa SSR).
const SignAvatar = dynamic(() => import("./avatar/SignAvatar"), { ssr: false });

// Model VRM bawaan (avatar 3D). Bisa di-override lewat prop `vrmUrl`.
// Sampel VRoid CC0 di public/avatar.vrm.
const DEFAULT_VRM = "/avatar.vrm";

const DEFAULT_META: PoseMeta = { width: 512, height: 512, fps: 25 };

interface SignAvatarViewerProps {
  /**
   * Mode TEKS: teks yang diterjemahkan otomatis ke animasi pose.
   * Diabaikan bila `frames` disuplai (mode controlled).
   */
  text?: string;
  /**
   * Mode CONTROLLED: frames pose yang sudah di-parse di luar (mis. hasil
   * pre-translate transcript). Bila prop ini ada (termasuk null), komponen
   * tidak menerjemahkan sendiri dan langsung memutar frames ini.
   */
  frames?: unknown[] | null;
  meta?: PoseMeta;
  /** Indikator loading eksternal (mode controlled). */
  loading?: boolean;
  /** Jalankan/bekukan animasi. false = avatar berhenti di frame terakhir. */
  playing?: boolean;
  signedLanguage?: string;
  spokenLanguage?: string;
  className?: string;
  /** Sumber model VRM. Default memakai sample VRM dari CDN pixiv/three-vrm. */
  vrmUrl?: string;
  /** Warna rambut (hex). null/undefined = warna asli model. */
  hairColor?: string | null;
  /** Warna iris mata (hex). null/undefined = warna asli model. */
  eyeColor?: string | null;
  /** Aksesoris kepala: "Glasses"/"Hat" (cocok longgar). null = tanpa aksesoris. */
  accessory?: string | null;
  /**
   * Gerak acak prosedural saat `playing` & belum ada pose: avatar bergoyang
   * sendiri (tanpa jaringan). Berhenti otomatis saat `playing` false.
   */
  randomMotion?: boolean;
  /** Pesan placeholder saat belum ada pose. */
  placeholder?: string;
}

/**
 * Menganimasikan model VRM 3D (three.js + @pixiv/three-vrm) untuk bahasa isyarat.
 * - Mode teks: terjemahkan `text` -> pose lewat /api/translate-pose otomatis.
 * - Mode controlled: putar `frames` yang disuplai dari luar (untuk sinkron video).
 */
export function SignAvatarViewer({
  text = "",
  frames: controlledFrames,
  meta: controlledMeta,
  loading: controlledLoading,
  playing = true,
  signedLanguage = "ase",
  spokenLanguage = "en",
  className,
  vrmUrl = DEFAULT_VRM,
  hairColor,
  eyeColor,
  accessory,
  randomMotion = false,
  placeholder = "Ketik teks lalu tekan Sign untuk melihat avatar berisyarat",
}: SignAvatarViewerProps) {
  const controlled = controlledFrames !== undefined;

  const [avatarReady, setAvatarReady] = useState(false);
  const [error, setError] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);

  // State mode teks (tidak dipakai saat controlled).
  const [textLoading, setTextLoading] = useState(false);
  const [textFrames, setTextFrames] = useState<unknown[] | null>(null);
  const [textMeta, setTextMeta] = useState<PoseMeta>(DEFAULT_META);

  // Terjemahkan setiap kali teks / bahasa berubah (hanya mode teks).
  useEffect(() => {
    if (controlled) return;
    const query = text.trim();
    if (!query) {
      setTextFrames(null);
      setError("");
      return;
    }

    let cancelled = false;
    setTextLoading(true);
    setError("");

    translateToPose(query, signedLanguage, spokenLanguage)
      .then((clip) => {
        if (cancelled) return;
        setTextMeta(clip.meta);
        setTextFrames(clip.frames);
        setFrameIndex(0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setTextLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [controlled, text, signedLanguage, spokenLanguage]);

  // Reset index frame saat sumber pose controlled berganti.
  useEffect(() => {
    if (controlled) setFrameIndex(0);
  }, [controlled, controlledFrames]);

  const frames = controlled ? controlledFrames ?? null : textFrames;
  const meta = controlled ? controlledMeta ?? DEFAULT_META : textMeta;
  const loading = controlled ? !!controlledLoading : textLoading;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {/* Avatar selalu dirender (berdiri diam saat belum ada pose). */}
      <SignAvatar
        vrmUrl={vrmUrl}
        frames={frames}
        meta={meta}
        playing={playing}
        frameIndex={frameIndex}
        mirror={false}
        swap={false}
        lerp={0.5}
        depth={1.0}
        hairColor={hairColor}
        eyeColor={eyeColor}
        accessory={accessory}
        randomMotion={randomMotion}
        onFrame={setFrameIndex}
        onLoaded={() => setAvatarReady(true)}
        onError={(e: string) => setError("Gagal memuat avatar: " + e)}
      />

      {/* Overlay loading translate */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-sm text-grey">
          <Loader2 className="h-8 w-8 animate-spin text-quinary" />
          <span className="text-sm font-medium">Menerjemahkan…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-primary/90 px-4 py-2 text-center text-xs font-medium text-white">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint placeholder saat avatar siap tapi belum ada pose */}
      {avatarReady && !frames && !loading && !error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 py-2 text-center text-xs font-medium text-grey/70">
          {placeholder}
        </div>
      )}
    </div>
  );
}
