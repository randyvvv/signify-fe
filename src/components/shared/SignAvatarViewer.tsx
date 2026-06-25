"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePoseFile } from "./avatar/posefile";

// Komponen three.js / WebGL hanya untuk browser (tanpa SSR).
const SignAvatar = dynamic(() => import("./avatar/SignAvatar"), { ssr: false });

// Model VRM bawaan (avatar 3D). Bisa di-override lewat prop `vrmUrl`,
// atau letakkan file .vrm di /public lalu pakai path lokal (mis. "/avatar.vrm").
const DEFAULT_VRM =
  "https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

interface PoseMeta {
  width: number;
  height: number;
  fps: number;
}

interface SignAvatarViewerProps {
  /** Teks yang diterjemahkan ke animasi pose. Kosong = avatar diam. */
  text: string;
  signedLanguage?: string;
  spokenLanguage?: string;
  className?: string;
  /** Sumber model VRM. Default memakai sample VRM dari CDN pixiv/three-vrm. */
  vrmUrl?: string;
  /** Pesan placeholder saat belum ada teks. */
  placeholder?: string;
}

/**
 * Menerjemahkan teks -> .pose lewat /api/translate-pose (proxy SignGPT),
 * lalu menganimasikan model VRM 3D (three.js + @pixiv/three-vrm) dengan
 * mengarahkan tulang lengan & jari ke landmark pose tiap frame.
 * Auto-translate setiap kali `text` berubah.
 */
export function SignAvatarViewer({
  text,
  signedLanguage = "ase",
  spokenLanguage = "en",
  className,
  vrmUrl = DEFAULT_VRM,
  placeholder = "Ketik teks lalu tekan Sign untuk melihat avatar berisyarat",
}: SignAvatarViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarReady, setAvatarReady] = useState(false);

  // Data pose terurai untuk dianimasikan avatar.
  const [frames, setFrames] = useState<unknown[] | null>(null);
  const [meta, setMeta] = useState<PoseMeta>({ width: 512, height: 512, fps: 25 });
  const [frameIndex, setFrameIndex] = useState(0);

  // Terjemahkan setiap kali teks / bahasa berubah.
  useEffect(() => {
    const query = text.trim();
    if (!query) {
      setFrames(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/translate-pose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query, signedLanguage, spokenLanguage }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menerjemahkan");
        if (!data.pose) throw new Error("Respons tidak berisi data pose");
        if (cancelled) return;
        const bytes = base64ToUint8Array(data.pose);
        const parsed = parsePoseFile(bytes.buffer);
        setMeta({ width: parsed.width, height: parsed.height, fps: parsed.fps });
        setFrames(parsed.frames);
        setFrameIndex(0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, signedLanguage, spokenLanguage]);

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
        playing
        frameIndex={frameIndex}
        mirror={false}
        swap={false}
        lerp={0.5}
        depth={1.0}
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
