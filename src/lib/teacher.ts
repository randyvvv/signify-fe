// Fitur akun guru: materi buatan guru & transkrip Kelas Live -> materi + kuis.
import { api } from "./api";
import type { LiveClass } from "./live-class";

/** Sama dengan kategori filter Learning Materials. */
export const MATERIAL_CATEGORIES = ["K-12", "Vocational", "University", "Career", "Sign Language"] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
] as const;

export interface TeacherMaterial {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "article" | "document";
  category: string;
  language: string;
  thumbnailUrl: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
  transcript: string[] | null;
  createdAt: string;
}

/** Item daftar kelas guru: kelas + jumlah kalimat transkrip + materi/kuis hasilnya. */
export interface TeacherLiveClass extends LiveClass {
  segmentCount: number;
  materialId: string | null;
  quizId: string | null;
}

export type NewMaterial =
  | { type: "video"; videoUrl: string }
  | { type: "article"; content: string; articleUrl?: string };

export interface NewMaterialFields {
  title: string;
  description?: string;
  category: MaterialCategory;
  language: string;
}

export interface ClassMaterialResult {
  materialId: string;
  quizId: string;
  title: string;
  questions: number;
}

export const teacherApi = {
  materials: () => api.get<TeacherMaterial[]>("/api/materials/mine"),
  createMaterial: (body: NewMaterial & NewMaterialFields) => api.post<TeacherMaterial>("/api/materials", body),
  deleteMaterial: (id: string) => api.del<{ ok: true }>(`/api/materials/${encodeURIComponent(id)}`),
  classes: () => api.get<TeacherLiveClass[]>("/api/live/classes"),
  classToMaterial: (code: string, category: MaterialCategory) =>
    api.post<ClassMaterialResult>(`/api/live/classes/${encodeURIComponent(code)}/material`, { category }),
};

/** ID video YouTube dari link (watch, youtu.be, embed, shorts) atau ID 11 karakter. */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  try {
    const url = new URL(raw);
    if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    const v = url.searchParams.get("v");
    if (v) return v;
    return url.pathname.match(/\/(embed|live|shorts|v)\/([\w-]{11})/)?.[2] ?? null;
  } catch {
    return /^[\w-]{11}$/.test(raw) ? raw : null;
  }
}
