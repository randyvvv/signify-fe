import { api, ApiError, BASE_URL, getToken } from "@/lib/api";

// Isyarat -> Suara: kalimat dari isyarat disusun Gemini lalu dibacakan (Gemini TTS).

export type SpeechLang = "id" | "en";
export type SpeechVoice = "female" | "male";

export const SPEECH_LANGS: { value: SpeechLang; label: string; locale: string }[] = [
  { value: "id", label: "ID", locale: "id-ID" },
  { value: "en", label: "EN", locale: "en-US" },
];

export const SPEECH_VOICES: { value: SpeechVoice; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export const speechLocale = (lang: SpeechLang) =>
  SPEECH_LANGS.find((l) => l.value === lang)?.locale ?? "en-US";

// Frasa siap pakai untuk teman Tuli: sekali ketuk langsung dibacakan.
export const QUICK_REPLIES: Record<SpeechLang, string[]> = {
  id: ["Halo!", "Terima kasih.", "Bisa diulangi?", "Tolong bicara lebih pelan.", "Saya Tuli, tolong ketik saja."],
  en: ["Hello!", "Thank you.", "Could you repeat that?", "Please speak more slowly.", "I'm Deaf, please type it."],
};

export const speechApi = {
  sentence: (text: string, lang: SpeechLang) =>
    api.post<{ text: string }>("/api/translator/sentence", { text, lang }),

  /** Audio WAV dari Gemini TTS. Melempar ApiError (mis. 503 tts_failed) bila gagal. */
  async speak(text: string, voice: SpeechVoice, signal?: AbortSignal): Promise<Blob> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/translator/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, voice }),
      signal,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      throw new ApiError(res.status, data?.error || res.statusText || "Request failed", data?.code);
    }
    return res.blob();
  },
};
