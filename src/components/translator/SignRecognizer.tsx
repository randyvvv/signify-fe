"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { Camera, Circle, Square, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

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
    <div className="grid grid-cols-1 gap-y-[30px] gap-x-[20px] lg:grid-cols-3">
      <div className="self-start rounded-[10px] bg-white px-[30px] pt-[35px] pb-[35px] lg:col-span-2">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[10px] bg-senary/30 shadow-sm">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 transform object-cover"
            />
          ) : (
            <Button
              onClick={startCamera}
              className="flex items-center gap-2 rounded-xl bg-quinary px-8 py-6 text-lg font-semibold text-white hover:bg-quinary/90"
            >
              <Camera className="h-5 w-5" /> Start camera
            </Button>
          )}

          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="font-heading text-8xl font-bold text-white drop-shadow-lg">
                {countdown}
              </span>
            </div>
          )}
          {phase === "recording" && (
            <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
              <Circle className="h-3 w-3 animate-pulse fill-current" /> Recording…
            </div>
          )}

          {stream && (
            <div className="absolute bottom-6 right-6 flex gap-2">
              {phase === "recording" ? (
                <Button
                  onClick={stopRecording}
                  className="rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  <Square className="h-4 w-4 fill-current" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  disabled={phase !== "idle" || !models}
                  className="rounded-lg bg-quinary text-white hover:bg-quinary/90"
                >
                  {phase === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4 fill-current" />
                  )}
                  {!models ? "Loading tracker…" : phase === "processing" ? "Recognizing…" : "Record sign"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[30px] rounded-[10px] bg-white px-[30px] py-[45px]">
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-2xl font-bold text-black">Recognized Text</h3>
          <p className="text-sm text-grey">
            Start the camera, press Record, sign in front of the camera, then press Stop
            (recording stops by itself after {MAX_RECORD_MS / 1000} seconds).
          </p>
        </div>

        {unavailable ? (
          <div className="flex gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>
              The sign recognition model is not available yet. Your recording worked — it
              will be translated once the model server is connected.
            </p>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-3 rounded-[10px] bg-gradient-to-r from-[#C5FBF9] to-secondary p-5">
            <p className="font-heading text-2xl font-bold text-black">
              {result.text || "No sign recognized"}
            </p>
            {result.confidence != null && (
              <p className="text-xs font-medium text-black/60">
                Confidence {Math.round(result.confidence * 100)}%
              </p>
            )}
            <Button
              variant="outline"
              onClick={startRecording}
              disabled={phase !== "idle"}
              className="self-start rounded-lg"
            >
              <RotateCcw className="h-4 w-4" /> Try another sign
            </Button>
          </div>
        ) : (
          <p className="rounded-[10px] border border-dashed border-gray-200 p-6 text-center text-sm text-grey/70">
            The translation will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
