"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type { Point2 } from "@/components/shared/avatar/signScore";

export type RecordPhase = "idle" | "countdown" | "recording";

const COUNTDOWN_SECONDS = 3;

/**
 * Kamera + MediaPipe HandLandmarker untuk merekam satu isyarat, dengan format
 * rekaman yang sama seperti Sign Practice (dinilai `scoreSign`).
 */
export function useHandRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [handsVisible, setHandsVisible] = useState(false);
  const recording = useRef(false);
  const frames = useRef<Point2[][][]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      const hand = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      if (!cancelled) setLandmarker(hand);
    })().catch((err) => {
      console.error("MediaPipe gagal dimuat", err);
      if (!cancelled) setLoadFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream],
  );

  // Deteksi tangan tiap frame video; saat merekam, titik tangan disimpan
  // (x dikali rasio aspek supaya skala x = y, sama seperti Sign Practice).
  useEffect(() => {
    if (!stream || !landmarker) return;
    let raf = 0;
    let lastTime = -1;
    let visible = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const nowVisible = result.landmarks.length > 0;
      if (nowVisible !== visible) {
        visible = nowVisible;
        setHandsVisible(nowVisible);
      }
      if (recording.current) {
        const aspect = video.videoWidth / (video.videoHeight || 1);
        frames.current.push(result.landmarks.map((hand) => hand.map((l) => ({ x: l.x * aspect, y: l.y }))));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stream, landmarker]);

  /** Nyalakan kamera. Melempar error bila izin kamera ditolak. */
  const startCamera = useCallback(async () => {
    setStream(await navigator.mediaDevices.getUserMedia({ video: true }));
  }, []);

  /** Hitung mundur lalu rekam selama `seconds`; hasilnya titik tangan per frame. */
  const record = useCallback(
    (seconds: number) =>
      new Promise<Point2[][][]>((resolve) => {
        const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
        setPhase("countdown");
        setCountdown(COUNTDOWN_SECONDS);
        for (let s = 1; s < COUNTDOWN_SECONDS; s++) later(() => setCountdown(COUNTDOWN_SECONDS - s), s * 1000);
        later(() => {
          frames.current = [];
          recording.current = true;
          setPhase("recording");
          later(() => {
            recording.current = false;
            timers.current = [];
            setPhase("idle");
            resolve(frames.current);
          }, seconds * 1000);
        }, COUNTDOWN_SECONDS * 1000);
      }),
    [],
  );

  return {
    videoRef,
    ready: !!landmarker,
    loadFailed,
    cameraOn: !!stream,
    phase,
    countdown,
    handsVisible,
    startCamera,
    record,
  };
}
