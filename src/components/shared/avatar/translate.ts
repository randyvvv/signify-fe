// Helper bersama: teks -> data pose ter-parse (frames) lewat backend
// POST /api/translator/pose (kamus isyarat lokal dulu, sisanya SignGPT).
// Dipakai oleh SignAvatarViewer (mode teks) maupun pre-translate transcript YouTube.
import { api } from "@/lib/api";
import { parsePoseFile } from "./posefile";

export interface PoseMeta {
  width: number;
  height: number;
  fps: number;
}

export interface PoseClip {
  frames: unknown[];
  meta: PoseMeta;
}

interface TranslatePoseResponse {
  signedLanguage: string;
  clips: { text: string; source: "dictionary" | "signgpt"; pose: string }[];
  missing: string[];
}

type Point = { X: number; Y: number; Z?: number; C: number };
type Person = Record<string, Point[]>;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Samakan skala koordinat klip ke ukuran kanvas klip pertama.
function rescale(frames: unknown[], from: PoseMeta, to: PoseMeta): unknown[] {
  if (from.width === to.width && from.height === to.height) return frames;
  const sx = to.width / (from.width || to.width);
  const sy = to.height / (from.height || to.height);
  return (frames as Person[]).map((person) => {
    const out: Person = {};
    for (const [name, points] of Object.entries(person)) {
      out[name] = points.map((p) => ({ ...p, X: p.X * sx, Y: p.Y * sy }));
    }
    return out;
  });
}

/**
 * Terjemahkan teks -> animasi pose (frames). Klip per kata/frasa digabung
 * berurutan. `signedLanguage` kosong = pakai preferensi user di backend.
 * Throw bila gagal / tidak ada isyarat.
 */
export async function translateToPose(
  text: string,
  signedLanguage?: string,
  spokenLanguage = "en",
): Promise<PoseClip> {
  const data = await api.post<TranslatePoseResponse>("/api/translator/pose", {
    text,
    signedLanguage,
    spokenLanguage,
  });
  if (!data.clips?.length) throw new Error("Respons tidak berisi data pose");

  let meta: PoseMeta | null = null;
  const frames: unknown[] = [];
  for (const clip of data.clips) {
    const parsed = parsePoseFile(base64ToArrayBuffer(clip.pose));
    const clipMeta = { width: parsed.width, height: parsed.height, fps: parsed.fps };
    meta ??= clipMeta;
    frames.push(...rescale(parsed.frames, clipMeta, meta));
  }
  return { frames, meta: meta! };
}
