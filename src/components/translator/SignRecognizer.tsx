"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  AlertCircle,
  Camera,
  Check,
  Circle,
  Lightbulb,
  Loader2,
  RotateCcw,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// Format keypoint signify-model: 17 pose + 21 tangan kiri + 21 tangan kanan (x, y, z).
const POSE_POINTS = 17;
const HAND_POINTS = 21;
const MAX_RECORD_MS = 8000;
const MIN_FRAMES = 8;
const COUNTDOWN_SECONDS = 3;

type Triple = [number, number, number];
const zeros = (n: number): Triple[] => Array.from({ length: n }, () => [0, 0, 0]);

type Phase = "idle" | "countdown" | "recording" | "processing";

interface RecognizeResult {
  text: string;
  confidence: number | null;
}

/**
 * Isyarat -> teks: rekam gerakan dari webcam (MediaPipe pose + tangan), kirim
 * keypoint ke backend (/api/translator/recognize -> server signify-model).
 */
export function SignRecognizer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [models, setModels] = useState<{ hand: HandLandmarker; pose: PoseLandmarker } | null>(
    null,
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const phaseRef = useRef<Phase>("idle");
  const framesRef = useRef<Triple[][]>([]);
  const recordStartRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Muat model MediaPipe sekali.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      const [hand, pose] = await Promise.all([
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        }),
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        }),
      ]);
      if (!cancelled) setModels({ hand, pose });
    })().catch((err) => {
      console.error("MediaPipe gagal dimuat", err);
      toast.error("Failed to load hand tracking");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  // Hentikan kamera & timer saat unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream],
  );

  // Loop deteksi: selama merekam, simpan satu frame 59 keypoint per video frame.
  useEffect(() => {
    if (!stream || !models) return;
    let raf = 0;
    let lastTime = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (phaseRef.current !== "recording" || !video || video.videoWidth === 0) return;
      if (video.currentTime === lastTime) return;
      lastTime = video.currentTime;

      const now = performance.now();
      const hands = models.hand.detectForVideo(video, now);
      const pose = models.pose.detectForVideo(video, now);

      const posePts: Triple[] = pose.landmarks[0]
        ? pose.landmarks[0].slice(0, POSE_POINTS).map((l) => [l.x, l.y, l.z])
        : zeros(POSE_POINTS);
      let left = zeros(HAND_POINTS);
      let right = zeros(HAND_POINTS);
      hands.landmarks.forEach((lm, i) => {
        const pts: Triple[] = lm.map((l) => [l.x, l.y, l.z]);
        // Label handedness MediaPipe mengasumsikan gambar ter-mirror (selfie);
        // frame webcam di sini tidak di-mirror, jadi "Left" = tangan kanan user.
        const label = hands.handedness[i]?.[0]?.categoryName;
        if (label === "Left") right = pts;
        else left = pts;
      });
      framesRef.current.push([...posePts, ...left, ...right]);

      if (now - recordStartRef.current >= MAX_RECORD_MS) stopRecording();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // stopRecording stabil lewat ref; cukup bergantung pada stream & model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, models]);

  const startCamera = async () => {
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: true }));
    } catch {
      toast.error("Could not access camera", {
        description: "Please allow camera permissions in your browser settings.",
      });
    }
  };

  const startRecording = () => {
    if (phaseRef.current !== "idle") return;
    setResult(null);
    setPhaseBoth("countdown");
    setCountdown(COUNTDOWN_SECONDS);
    for (let s = 1; s < COUNTDOWN_SECONDS; s++) {
      timersRef.current.push(setTimeout(() => setCountdown(COUNTDOWN_SECONDS - s), s * 1000));
    }
    timersRef.current.push(
      setTimeout(() => {
        framesRef.current = [];
        recordStartRef.current = performance.now();
        setPhaseBoth("recording");
      }, COUNTDOWN_SECONDS * 1000),
    );
  };

  async function stopRecording() {
    if (phaseRef.current !== "recording") return;
    setPhaseBoth("processing");
    const frames = framesRef.current;
    const seconds = (performance.now() - recordStartRef.current) / 1000;

    if (frames.length < MIN_FRAMES) {
      toast.error("Recording too short — try again");
      setPhaseBoth("idle");
      return;
    }
    try {
      const res = await api.post<RecognizeResult>("/api/translator/recognize", {
        frames,
        fps: Math.round(frames.length / Math.max(seconds, 0.1)),
      });
      setResult(res);
      setUnavailable(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "model_unavailable") {
        setUnavailable(true);
      } else {
        toast.error("Recognition failed", {
          description: err instanceof ApiError ? err.message : undefined,
        });
      }
    } finally {
      setPhaseBoth("idle");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ===== Kamera ===== */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-800">Camera</h2>
            <p className="text-xs text-slate-500">
              Recording stops by itself after {MAX_RECORD_MS / 1000} seconds
            </p>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              !models
                ? "bg-amber-100 text-amber-700"
                : stream
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {!models ? "Loading tracker" : stream ? "Camera on" : "Camera off"}
          </span>
        </div>

        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 transform object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#2DA5A2] shadow-sm">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Turn on your camera</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Your video stays in the browser — only hand & body keypoints are sent.
                </p>
              </div>
              <Button
                onClick={startCamera}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
              >
                <Camera className="h-4 w-4" /> Start camera
              </Button>
            </div>
          )}

          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="font-heading text-8xl font-bold text-white drop-shadow-lg">
                {countdown}
              </span>
            </div>
          )}
          {phase === "recording" && (
            <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
              <Circle className="h-3 w-3 animate-pulse fill-current" /> Recording…
            </div>
          )}

          {stream && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/40 to-transparent p-4">
              {phase === "recording" ? (
                <Button
                  onClick={stopRecording}
                  className="h-12 rounded-full bg-primary px-6 font-semibold text-white shadow-lg hover:bg-primary/90"
                >
                  <Square className="h-4 w-4 fill-current" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  disabled={phase !== "idle" || !models}
                  className="h-12 rounded-full bg-white px-6 font-semibold text-[#0B7077] shadow-lg hover:bg-white/90"
                >
                  {phase === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4 fill-[#DF5D73] text-[#DF5D73]" />
                  )}
                  {!models
                    ? "Loading tracker…"
                    : phase === "processing"
                      ? "Recognizing…"
                      : phase === "countdown"
                        ? "Get ready…"
                        : "Record sign"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Hasil + tips ===== */}
      <div className="flex flex-col gap-6 lg:col-span-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-heading text-lg font-bold text-slate-800">Recognized Text</h2>
          <div className="mt-4">
            {unavailable ? (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                  The sign recognition model is not available yet. Your recording worked — it
                  will be translated once the model server is connected.
                </p>
              </div>
            ) : result ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#C5FBF9] to-[#FDF5BF] p-5">
                <p className="font-heading text-2xl font-bold text-slate-900">
                  {result.text || "No sign recognized"}
                </p>
                {result.confidence != null && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Confidence</span>
                      <span>{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-[#2DA5A2]"
                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={startRecording}
                  disabled={phase !== "idle" || !stream}
                  className="self-start rounded-xl bg-white/70"
                >
                  <RotateCcw className="h-4 w-4" /> Try another sign
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-500">
                  The translation will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="flex items-center gap-2 font-heading font-bold text-slate-800">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Tips for better results
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            {[
              "Keep both hands and your upper body in the frame",
              "Use good, even lighting in front of you",
              "Sign at a natural pace, then press Stop",
            ].map((tip) => (
              <li key={tip} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2DA5A2]" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
