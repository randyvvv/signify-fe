"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speechApi, speechLocale, type SpeechLang, type SpeechVoice } from "@/lib/speech";

export type SpeechEngine = "gemini" | "browser";

// Setelah Gemini TTS gagal, pakai suara browser dulu selama ini supaya tidak menunggu tiap kali.
const SERVER_RETRY_MS = 60_000;

function speakWithBrowser(text: string, lang: SpeechLang, onDone: () => void) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) {
    onDone();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLocale(lang);
  const voices = synth.getVoices();
  const prefix = utterance.lang.slice(0, 2);
  utterance.voice =
    voices.find((v) => v.lang.replace("_", "-") === utterance.lang) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  synth.speak(utterance);
}

/**
 * Membacakan pesan: Gemini TTS (suara natural) bila tersedia, kalau tidak suara
 * bawaan browser. Audio yang sudah dibuat disimpan per teks+suara untuk diputar ulang.
 */
export function useSpeaker({ voice, lang }: { voice: SpeechVoice; lang: SpeechLang }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [engine, setEngine] = useState<SpeechEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioUrls = useRef(new Map<string, string>());
  const serverDownUntil = useRef(0);
  // Naik tiap kali ada permintaan baru, supaya hasil permintaan lama diabaikan.
  const turn = useRef(0);

  const stop = useCallback(() => {
    turn.current++;
    abortRef.current?.abort();
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setLoadingId(null);
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      stop();
      const myTurn = turn.current;
      const isCurrent = () => turn.current === myTurn;
      const done = () => {
        if (isCurrent()) setSpeakingId(null);
      };
      setLoadingId(id);

      const key = `${voice}|${text}`;
      let url = audioUrls.current.get(key);
      if (!url && Date.now() >= serverDownUntil.current) {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          url = URL.createObjectURL(await speechApi.speak(text, voice, controller.signal));
          audioUrls.current.set(key, url);
        } catch {
          if (controller.signal.aborted) return;
          serverDownUntil.current = Date.now() + SERVER_RETRY_MS;
        }
      }
      if (!isCurrent()) return;
      setLoadingId(null);
      setSpeakingId(id);

      if (url) {
        const audio = new Audio(url);
        audio.onended = done;
        audio.onerror = done;
        audioRef.current = audio;
        try {
          await audio.play();
          setEngine("gemini");
          return;
        } catch {
          // Diblokir browser: lanjut ke suara bawaan.
        }
      }
      setEngine("browser");
      speakWithBrowser(text, lang, done);
    },
    [voice, lang, stop],
  );

  const releaseAudio = useCallback(() => {
    audioUrls.current.forEach((url) => URL.revokeObjectURL(url));
    audioUrls.current.clear();
  }, []);

  useEffect(
    () => () => {
      stop();
      releaseAudio();
    },
    [stop, releaseAudio],
  );

  return { speak, stop, loadingId, speakingId, engine };
}
