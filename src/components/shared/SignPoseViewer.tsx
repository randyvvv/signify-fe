"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Hand, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Registrasi web component <pose-viewer> sekali saja (client-only).
let loaderPromise: Promise<void> | null = null;
function ensurePoseViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!loaderPromise) {
    loaderPromise = import("pose-viewer/loader").then(({ defineCustomElements }) =>
      defineCustomElements(),
    );
  }
  return loaderPromise;
}

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/octet-stream" });
}

interface SignPoseViewerProps {
  /** Teks yang diterjemahkan ke animasi pose. Kosong = tampilkan placeholder. */
  text: string;
  signedLanguage?: string;
  spokenLanguage?: string;
  className?: string;
  /** Warna latar canvas pose-viewer. */
  background?: string;
  /** Pesan placeholder saat belum ada teks. */
  placeholder?: string;
}

/**
 * Menerjemahkan teks -> .pose lewat /api/translate-pose (proxy SignGPT),
 * lalu merendernya sebagai animasi memakai web component <pose-viewer>.
 * Auto-translate setiap kali `text` berubah.
 */
export function SignPoseViewer({
  text,
  signedLanguage = "ase",
  spokenLanguage = "en",
  className,
  background = "transparent",
  placeholder = "Animasi bahasa isyarat akan muncul di sini",
}: SignPoseViewerProps) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [poseUrl, setPoseUrl] = useState("");
  const urlRef = useRef("");

  // Muat web component.
  useEffect(() => {
    let mounted = true;
    ensurePoseViewer()
      .then(() => mounted && setReady(true))
      .catch((e) => mounted && setError("Gagal memuat pose viewer: " + String(e)));
    return () => {
      mounted = false;
    };
  }, []);

  // Terjemahkan setiap kali teks / bahasa berubah.
  useEffect(() => {
    const query = text.trim();
    if (!query) {
      setPoseUrl("");
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
        const url = URL.createObjectURL(base64ToBlob(data.pose));
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setPoseUrl(url);
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

  // Bersihkan object URL terakhir saat unmount.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {poseUrl && !error && (
        <pose-viewer
          src={poseUrl}
          loop
          autoplay
          background={background}
          style={{ width: "100%", height: "100%" }}
        />
      )}

      {/* Overlay loading */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-sm text-grey">
          <Loader2 className="h-8 w-8 animate-spin text-quinary" />
          <span className="text-sm font-medium">Menerjemahkan…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-2 px-6 text-center text-primary">
          <AlertCircle className="h-8 w-8" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Placeholder kosong */}
      {!poseUrl && !loading && !error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 text-center text-grey/70">
          <Hand className="h-12 w-12" />
          <p className="font-medium leading-relaxed">
            {ready ? placeholder : "Memuat pose viewer…"}
          </p>
        </div>
      )}
    </div>
  );
}
