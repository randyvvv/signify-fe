"use client";

import { useState } from "react";
import { Loader2, Mic, MicOff, Users, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { useLiveVideo, VideoPeer } from "./useLiveVideo";
import { VideoTile } from "./VideoTile";

type LiveVideo = ReturnType<typeof useLiveVideo>;

// Ubin yang ditampilkan sekaligus; sisanya hanya dihitung (video mereka tidak diunduh).
const MAX_TILES = 12;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

const deniedMessage = (err: unknown, device: "camera" | "microphone") =>
  err instanceof DOMException && err.name === "NotAllowedError"
    ? `Izinkan akses ${device === "camera" ? "kamera" : "mikrofon"} di browser, lalu coba lagi.`
    : undefined;

/** Murid: tombol mikrofon & kamera sendiri. */
export function MediaControls({ video }: { video: LiveVideo }) {
  const [busy, setBusy] = useState<"mic" | "camera" | null>(null);
  const ready = video.status === "connected";

  const toggleMic = async () => {
    setBusy("mic");
    try {
      await video.setMicEnabled(!video.micOn);
    } catch (err) {
      toast.error("Mikrofon tidak bisa diakses", { description: deniedMessage(err, "microphone") });
    } finally {
      setBusy(null);
    }
  };
  const toggleCamera = async () => {
    setBusy("camera");
    try {
      await video.setCamera(!video.cameraOn);
    } catch (err) {
      toast.error("Kamera tidak bisa diakses", { description: deniedMessage(err, "camera") });
    } finally {
      setBusy(null);
    }
  };

  const button = (on: boolean) =>
    cn(
      "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
      on ? "bg-[#0B7077] text-white hover:bg-[#0B7077]/90" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
    );
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={toggleMic} disabled={!ready || !!busy} aria-pressed={video.micOn} className={button(video.micOn)}>
        {busy === "mic" ? <Loader2 className="h-4 w-4 animate-spin" /> : video.micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        {video.micOn ? "Mic on" : "Mic off"}
      </button>
      <button type="button" onClick={toggleCamera} disabled={!ready || !!busy} aria-pressed={video.cameraOn} className={button(video.cameraOn)}>
        {busy === "camera" ? <Loader2 className="h-4 w-4 animate-spin" /> : video.cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        {video.cameraOn ? "Camera on" : "Camera off"}
      </button>
    </div>
  );
}

function PeerTile({ peer, onMute }: { peer: VideoPeer; onMute?: (identity: string) => void }) {
  return (
    <div
      className={cn(
        "group relative aspect-video overflow-hidden rounded-2xl bg-slate-800 ring-2 transition-shadow",
        peer.speaking && peer.micOn ? "ring-[#2DA5A2]" : "ring-transparent",
      )}
    >
      {peer.videoTrack ? (
        <VideoTile track={peer.videoTrack} mirror={peer.isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-sm font-bold text-white">
            {initials(peer.name)}
          </span>
        </div>
      )}
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
        <span className="flex min-w-0 items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          {peer.micOn ? <Mic className="h-3 w-3 shrink-0" aria-label="Mic on" /> : <MicOff className="h-3 w-3 shrink-0 text-rose-300" aria-label="Mic off" />}
          <span className="truncate">{peer.isLocal ? `${peer.name} (you)` : peer.name}</span>
        </span>
      </div>
      {onMute && peer.micOn && !peer.isLocal && (
        <button
          type="button"
          onClick={() => onMute(peer.identity)}
          aria-label={`Mute ${peer.name}`}
          className="absolute right-2 top-2 flex h-8 items-center gap-1 rounded-lg bg-white/90 px-2 text-xs font-semibold text-rose-600 opacity-0 shadow-sm transition-opacity hover:bg-white focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <MicOff className="h-3.5 w-3.5" /> Mute
        </button>
      )}
    </div>
  );
}

/**
 * Galeri peserta kelas (selain guru): murid yang menyalakan kamera atau mikrofon.
 * Guru mendapat tombol Mute per murid dan "Mute all"; murid mendapat tombol
 * mikrofon & kamera sendiri.
 */
export function ParticipantGrid({
  video,
  role,
  onMute,
  className,
}: {
  video: LiveVideo;
  role: "teacher" | "student";
  /** Guru: matikan mic satu murid (identity) atau semua (tanpa argumen). */
  onMute?: (identity?: string) => Promise<void>;
  className?: string;
}) {
  const [mutingAll, setMutingAll] = useState(false);
  const active = video.peers.filter((p) => p.videoTrack || p.micOn || (p.isLocal && role === "student"));
  // Yang sedang bicara & diri sendiri di depan, lalu yang berkamera.
  active.sort((a, b) => Number(b.speaking && b.micOn) - Number(a.speaking && a.micOn) || Number(b.isLocal) - Number(a.isLocal) || Number(!!b.videoTrack) - Number(!!a.videoTrack));
  const shown = active.slice(0, MAX_TILES);
  // Ubin diri sendiri selalu tampil (murid), tapi hanya dihitung bila kamera/mic menyala.
  const onCount = active.filter((p) => p.videoTrack || p.micOn).length;
  const watching = video.peers.filter((p) => !p.videoTrack && !p.micOn && !p.isLocal).length;
  const anyMicOn = video.peers.some((p) => p.micOn && !p.isLocal);

  const muteAll = async () => {
    if (!onMute) return;
    setMutingAll(true);
    try {
      await onMute();
    } finally {
      setMutingAll(false);
    }
  };

  return (
    <div className={cn("rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#0B7077]">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-slate-800">{role === "teacher" ? "Students" : "Classmates"}</h2>
            <p className="text-xs text-slate-500">
              {onCount > MAX_TILES ? `${onCount} on camera or mic, showing ${MAX_TILES}` : `${onCount} on camera or mic`}
              {watching > 0 && ` · ${watching} watching`}
            </p>
          </div>
        </div>
        {role === "student" ? (
          <MediaControls video={video} />
        ) : (
          anyMicOn && (
            <button
              type="button"
              onClick={muteAll}
              disabled={mutingAll}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              {mutingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicOff className="h-4 w-4" />} Mute all
            </button>
          )
        )}
      </div>

      {shown.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((peer) => (
            <PeerTile key={peer.identity} peer={peer} onMute={role === "teacher" && onMute ? (id) => void onMute(id) : undefined} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {role === "teacher"
            ? "Students who turn on their camera or mic show up here."
            : "Turn on your camera to sign a question, or your mic to speak."}
        </p>
      )}
    </div>
  );
}
