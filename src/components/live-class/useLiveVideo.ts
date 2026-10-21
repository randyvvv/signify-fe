"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type LocalParticipant,
  type RemoteAudioTrack,
  type RemoteParticipant,
} from "livekit-client";
import { liveApi } from "@/lib/live-class";

export type VideoStatus = "off" | "connecting" | "connected" | "error";

/** Peserta kelas selain guru (termasuk diri sendiri bila murid) di galeri video. */
export interface VideoPeer {
  identity: string;
  name: string;
  isLocal: boolean;
  videoTrack: Track | null;
  micOn: boolean;
  speaking: boolean;
}

const micOnOf = (p: LocalParticipant | RemoteParticipant) => {
  const mic = p.getTrackPublication(Track.Source.Microphone);
  return !!mic && !mic.isMuted;
};
const cameraOf = (p: LocalParticipant | RemoteParticipant) => {
  const cam = p.getTrackPublication(Track.Source.Camera);
  return cam && !cam.isMuted ? (cam.track ?? null) : null;
};

/**
 * Video Kelas Live lewat LiveKit, seperti Zoom: guru dan murid bisa menyalakan
 * kamera & mikrofon. Suara guru memakai salinan track mikrofon transkripsi (setMic);
 * murid memakai mikrofon LiveKit sendiri (setMicEnabled). Guru dikenali dari
 * identity = teacherId. `enabled` false = tidak tersambung (video belum
 * dikonfigurasi atau kelas sudah berakhir).
 */
export function useLiveVideo(code: string, enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const micTrack = useRef<MediaStreamTrack | null>(null);
  const isTeacherRef = useRef(false);
  const [status, setStatus] = useState<Exclude<VideoStatus, "off">>("connecting");
  // Kamera guru: track lokal (di perangkat guru) atau remote (di perangkat murid).
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);
  const [peers, setPeers] = useState<VideoPeer[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  // Ada suara peserta lain yang diputar, dan apakah pengguna membisukannya.
  const [remoteAudio, setRemoteAudio] = useState(false);
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let teacherId = "";
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const refresh = () => {
      const local = room.localParticipant;
      let teacherVideo: Track | null = null;
      let audio = false;
      const list: VideoPeer[] = [];
      for (const p of [local, ...room.remoteParticipants.values()]) {
        const isLocal = p === local;
        const video = cameraOf(p);
        const mic = micOnOf(p);
        if (!isLocal && mic) audio = true;
        if (p.identity === teacherId) {
          teacherVideo = video;
          continue;
        }
        list.push({ identity: p.identity, name: p.name || "Student", isLocal, videoTrack: video, micOn: mic, speaking: p.isSpeaking });
      }
      setVideoTrack(teacherVideo);
      setPeers(list);
      setRemoteAudio(audio);
      setCameraOn(!!cameraOf(local));
      setMicOn(micOnOf(local));
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
          // Suara guru & murid lain; elemen audio tersembunyi.
          const el = track.attach();
          el.style.display = "none";
          document.body.appendChild(el);
          (track as RemoteAudioTrack).setVolume(mutedRef.current ? 0 : 1);
        }
        refresh();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) track.detach().forEach((el) => el.remove());
        refresh();
      })
      .on(RoomEvent.TrackPublished, refresh)
      .on(RoomEvent.TrackUnpublished, refresh)
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.LocalTrackPublished, refresh)
      .on(RoomEvent.LocalTrackUnpublished, refresh)
      .on(RoomEvent.ParticipantConnected, refresh)
      .on(RoomEvent.ParticipantDisconnected, refresh)
      .on(RoomEvent.ParticipantNameChanged, refresh)
      .on(RoomEvent.ActiveSpeakersChanged, refresh)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
      .on(RoomEvent.Reconnecting, () => setStatus("connecting"))
      .on(RoomEvent.Reconnected, () => setStatus("connected"))
      .on(RoomEvent.Disconnected, () => {
        if (!disposed) setStatus("error");
      });

    liveApi
      .videoToken(code)
      .then(async ({ url, token, teacherId: tid }) => {
        if (disposed) return;
        // Diset sebelum connect: event peserta yang datang saat menyambung sudah tahu siapa gurunya.
        teacherId = tid;
        await room.connect(url, token);
        if (disposed) return;
        isTeacherRef.current = room.localParticipant.identity === tid;
        setStatus("connected");
        setAudioBlocked(!room.canPlaybackAudio);
        refresh();
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

  /** Nyalakan/matikan kamera sendiri. Melempar error bila izin kamera ditolak. */
  const setCamera = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    // Guru 540p (video utama); murid 360p cukup untuk ubin galeri dan lebih hemat bandwidth.
    const preset = isTeacherRef.current ? VideoPresets.h540 : VideoPresets.h360;
    await room.localParticipant.setCameraEnabled(on, { resolution: preset.resolution });
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

  /** Murid: nyalakan/matikan mikrofon sendiri. Melempar error bila izin ditolak. */
  const setMicEnabled = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(on);
    setMicOn(on);
  }, []);

  const unlockAudio = useCallback(() => {
    void roomRef.current?.startAudio();
  }, []);

  /** Bisukan/nyalakan semua suara kelas di perangkat ini (video & avatar tetap jalan). */
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
    videoTrack: enabled ? videoTrack : null,
    peers: enabled ? peers : [],
    cameraOn: enabled && cameraOn,
    micOn: enabled && micOn,
    audioBlocked: enabled && audioBlocked,
    remoteAudio: enabled && remoteAudio,
    muted,
    setCamera,
    setMic,
    setMicEnabled,
    unlockAudio,
    setMuted,
  };
}
