"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, VideoPresets, type RemoteAudioTrack } from "livekit-client";
import { liveApi } from "@/lib/live-class";

export type VideoStatus = "off" | "connecting" | "connected" | "error";

/**
 * Video Kelas Live lewat LiveKit. Guru menyiarkan kamera (dan suaranya, memakai
 * track mikrofon yang sama dengan transkripsi); murid menonton. `enabled` false =
 * tidak tersambung (video belum dikonfigurasi atau kelas sudah berakhir).
 */
export function useLiveVideo(code: string, enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const micTrack = useRef<MediaStreamTrack | null>(null);
  const [status, setStatus] = useState<Exclude<VideoStatus, "off">>("connecting");
  const [canPublish, setCanPublish] = useState(false);
  // Kamera guru: track lokal (di perangkat guru) atau track remote (di perangkat murid).
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  // Murid: suara guru sedang dikirim, dan apakah murid membisukannya.
  const [teacherAudio, setTeacherAudio] = useState(false);
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const refreshRemote = () => {
      let video: Track | null = null;
      let audio = false;
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (!publication.track || publication.isMuted) continue;
          if (publication.kind === Track.Kind.Video) video ??= publication.track;
          if (publication.kind === Track.Kind.Audio) audio = true;
        }
      }
      setVideoTrack(video);
      setTeacherAudio(audio);
    };

    // Browser menahan audio sampai ada interaksi; sentuhan pertama di halaman langsung membukanya.
    const unlockOnGesture = () => {
      if (!room.canPlaybackAudio) void room.startAudio();
    };
    window.addEventListener("pointerdown", unlockOnGesture);
    window.addEventListener("keydown", unlockOnGesture);

    room
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          // Suara guru untuk murid yang bisa mendengar; elemen audio tersembunyi.
          const el = track.attach();
          el.style.display = "none";
          document.body.appendChild(el);
          (track as RemoteAudioTrack).setVolume(mutedRef.current ? 0 : 1);
        }
        refreshRemote();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) track.detach().forEach((el) => el.remove());
        refreshRemote();
      })
      .on(RoomEvent.TrackMuted, refreshRemote)
      .on(RoomEvent.TrackUnmuted, refreshRemote)
      .on(RoomEvent.ParticipantDisconnected, refreshRemote)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
      .on(RoomEvent.Reconnecting, () => setStatus("connecting"))
      .on(RoomEvent.Reconnected, () => setStatus("connected"))
      .on(RoomEvent.Disconnected, () => {
        if (!disposed) setStatus("error");
      });

    liveApi
      .videoToken(code)
      .then(async ({ url, token, canPublish: publish }) => {
        if (disposed) return;
        setCanPublish(publish);
        await room.connect(url, token);
        if (disposed) return;
        setStatus("connected");
        setAudioBlocked(!room.canPlaybackAudio);
        refreshRemote();
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      window.removeEventListener("pointerdown", unlockOnGesture);
      window.removeEventListener("keydown", unlockOnGesture);
      micTrack.current = null;
      void room.disconnect();
      roomRef.current = null;
    };
  }, [code, enabled]);

  /** Guru: nyalakan/matikan kamera. Melempar error bila izin kamera ditolak. */
  const setCamera = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    // 540p cukup untuk ukuran video di layar murid dan lebih ringan untuk laptop guru.
    await room.localParticipant.setCameraEnabled(on, { resolution: VideoPresets.h540.resolution });
    const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
    setVideoTrack(on ? (publication?.videoTrack ?? null) : null);
    setCameraOn(on);
  }, []);

  /** Guru: siarkan suara (salinan track mikrofon transkripsi) atau hentikan (null). */
  const setMic = useCallback(async (track: MediaStreamTrack | null) => {
    const room = roomRef.current;
    if (!room || room.state !== "connected") return;
    if (micTrack.current) {
      await room.localParticipant.unpublishTrack(micTrack.current);
      micTrack.current = null;
    }
    if (track) {
      const copy = track.clone();
      micTrack.current = copy;
      await room.localParticipant.publishTrack(copy, { source: Track.Source.Microphone });
    }
  }, []);

  const unlockAudio = useCallback(() => {
    void roomRef.current?.startAudio();
  }, []);

  /** Murid: bisukan/nyalakan suara guru (video & avatar tetap jalan). */
  const setMuted = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMutedState(next);
    const room = roomRef.current;
    if (!room) return;
    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.audioTrackPublications.values()) {
        (publication.track as RemoteAudioTrack | undefined)?.setVolume(next ? 0 : 1);
      }
    }
  }, []);

  return {
    status: enabled ? status : ("off" as VideoStatus),
    canPublish,
    videoTrack: enabled ? videoTrack : null,
    cameraOn: enabled && cameraOn,
    audioBlocked: enabled && audioBlocked,
    teacherAudio: enabled && teacherAudio,
    muted,
    setCamera,
    setMic,
    unlockAudio,
    setMuted,
  };
}
