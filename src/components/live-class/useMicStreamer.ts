"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MicResources {
  stream: MediaStream;
  context: AudioContext;
  node: AudioWorkletNode;
}

/**
 * Mikrofon guru -> potongan PCM 16 kHz (100 ms) lewat AudioWorklet
 * (public/worklets/pcm-recorder.js), plus level suara untuk indikator.
 */
export function useMicStreamer() {
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const resources = useRef<MicResources | null>(null);

  const stop = useCallback(() => {
    const res = resources.current;
    resources.current = null;
    if (res) {
      res.node.port.onmessage = null;
      res.node.disconnect();
      res.stream.getTracks().forEach((t) => t.stop());
      void res.context.close();
    }
    setActive(false);
    setLevel(0);
  }, []);

  /** Minta izin mikrofon & mulai mengalirkan audio ke `onChunk`. Melempar error bila ditolak. */
  const start = useCallback(
    async (onChunk: (pcm: ArrayBuffer) => void) => {
      if (resources.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const context = new AudioContext();
      try {
        await context.audioWorklet.addModule("/worklets/pcm-recorder.js");
        const source = context.createMediaStreamSource(stream);
        const node = new AudioWorkletNode(context, "pcm-recorder");
        node.port.onmessage = (event: MessageEvent<{ pcm: ArrayBuffer; level: number }>) => {
          onChunk(event.data.pcm);
          setLevel(event.data.level);
        };
        // Disambung ke output yang dibisukan supaya worklet tetap diproses browser.
        const mute = context.createGain();
        mute.gain.value = 0;
        source.connect(node).connect(mute).connect(context.destination);
        resources.current = { stream, context, node };
        setActive(true);
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        void context.close();
        throw err;
      }
    },
    [],
  );

  /** Untuk callback di luar render (event socket). */
  const isActive = useCallback(() => resources.current !== null, []);
  /** Track mikrofon yang sedang direkam (juga disiarkan ke video kelas). */
  const getTrack = useCallback(() => resources.current?.stream.getAudioTracks()[0] ?? null, []);

  useEffect(() => stop, [stop]);

  return { active, level, start, stop, isActive, getTrack };
}
