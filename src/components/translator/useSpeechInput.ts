"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API belum ada di lib.dom TypeScript; cukup bagian yang dipakai.
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface ListenHandlers {
  onFinal: (text: string) => void;
  /** Kode error Web Speech, mis. "not-allowed" (izin mikrofon ditolak) atau "network". */
  onError: (code: string) => void;
}

/**
 * Suara teman dengar -> teks lewat pengenalan suara bawaan browser (Chrome, Edge,
 * Safari). Satu ucapan per ketukan; berhenti sendiri saat orangnya diam.
 */
export function useSpeechInput() {
  const [supported] = useState(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognition = useRef<Recognition | null>(null);

  const start = useCallback((locale: string, { onFinal, onError }: ListenHandlers) => {
    const Ctor = recognitionCtor();
    if (!Ctor || recognition.current) return;
    const rec = new Ctor();
    rec.lang = locale;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else pending += result[0].transcript;
      }
      setInterim(`${finalText} ${pending}`.trim());
    };
    rec.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") onError(event.error);
    };
    rec.onend = () => {
      recognition.current = null;
      setListening(false);
      setInterim("");
      const text = finalText.trim();
      if (text) onFinal(text);
    };

    recognition.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognition.current = null;
      setListening(false);
      onError("start-failed");
    }
  }, []);

  /** Selesai bicara: hasil yang sudah terdengar tetap dikirim. */
  const stop = useCallback(() => recognition.current?.stop(), []);

  const cancel = useCallback(() => {
    const rec = recognition.current;
    if (!rec) return;
    rec.onend = null;
    rec.abort();
    recognition.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return { supported, listening, interim, start, stop };
}
