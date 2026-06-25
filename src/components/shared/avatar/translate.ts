// Helper bersama: teks -> data pose ter-parse (frames) lewat /api/translate-pose.
// Dipakai oleh SignAvatarViewer (mode teks) maupun pre-translate transcript YouTube.
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

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Terjemahkan teks -> animasi pose (frames). Throw bila gagal / kosong. */
export async function translateToPose(
  text: string,
  signedLanguage = "ase",
  spokenLanguage = "en",
): Promise<PoseClip> {
  const res = await fetch("/api/translate-pose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, signedLanguage, spokenLanguage }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menerjemahkan");
  if (!data.pose) throw new Error("Respons tidak berisi data pose");
  const parsed = parsePoseFile(base64ToUint8Array(data.pose).buffer);
  return {
    frames: parsed.frames,
    meta: { width: parsed.width, height: parsed.height, fps: parsed.fps },
  };
}
