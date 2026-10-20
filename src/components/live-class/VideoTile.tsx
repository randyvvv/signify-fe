"use client";

import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";
import { cn } from "@/lib/utils";

/** Menampilkan track video LiveKit. Audio diputar terpisah (lihat useLiveVideo). */
export function VideoTile({ track, mirror, className }: { track: Track; mirror?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <video ref={ref} autoPlay playsInline muted className={cn(mirror && "-scale-x-100", className)} />;
}
