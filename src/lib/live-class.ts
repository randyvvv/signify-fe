// Kelas Live: guru berbicara -> subtitle live + avatar isyarat di perangkat murid.
// REST untuk mengelola kelas, WebSocket (/api/live/ws) untuk siaran.
import { api, BASE_URL } from "./api";

export type LiveStatus = "waiting" | "live" | "ended";
export type LiveRole = "teacher" | "student";

export interface LiveClass {
  id: string;
  code: string;
  title: string;
  spokenLanguage: string;
  signedLanguage: string;
  status: LiveStatus;
  teacherId: string;
  teacherName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface LiveClassDetail extends LiveClass {
  broadcasting: boolean;
  viewers: number;
  isTeacher: boolean;
  /** Materi & kuis yang sudah dibuat dari transkrip kelas ini. */
  materialId: string | null;
  quizId: string | null;
  /** Video guru (LiveKit) sudah dikonfigurasi di server. */
  videoEnabled?: boolean;
}

export interface LiveSegment {
  seq: number;
  text: string;
  offsetMs: number;
}

export type LiveServerEvent =
  | {
      type: "ready";
      role: LiveRole;
      class: LiveClass;
      segments: LiveSegment[];
      broadcasting: boolean;
      viewers: number;
    }
  | { type: "status"; status: LiveStatus; broadcasting: boolean }
  | { type: "partial"; text: string }
  | { type: "segment"; segment: LiveSegment }
  | { type: "pose_ready"; seq: number; ok: boolean }
  | { type: "viewers"; count: number }
  | { type: "error"; message: string; code: string }
  | { type: "ping" };

/** Pasangan bahasa yang bisa dipilih guru (bahasa lisan -> bahasa isyarat avatar). */
export const LIVE_LANGUAGES = [
  { spokenLanguage: "en", signedLanguage: "ase", label: "English → ASL" },
  { spokenLanguage: "id", signedLanguage: "ins", label: "Bahasa Indonesia → BISINDO" },
] as const;

export function languageLabel(cls: Pick<LiveClass, "spokenLanguage" | "signedLanguage">): string {
  return (
    LIVE_LANGUAGES.find(
      (l) => l.spokenLanguage === cls.spokenLanguage && l.signedLanguage === cls.signedLanguage,
    )?.label ?? `${cls.spokenLanguage} → ${cls.signedLanguage}`
  );
}

/** Kode kelas dari input user: huruf besar, tanpa spasi/tanda hubung. */
export function normalizeClassCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function liveSocketUrl(): string {
  return `${BASE_URL.replace(/^http/, "ws")}/api/live/ws`;
}

export const liveApi = {
  myClasses: () => api.get<LiveClass[]>("/api/live/classes"),
  create: (body: { title: string; spokenLanguage: string; signedLanguage: string }) =>
    api.post<LiveClass>("/api/live/classes", body),
  get: (code: string) => api.get<LiveClassDetail>(`/api/live/classes/${encodeURIComponent(code)}`),
  segments: (code: string) =>
    api.get<LiveSegment[]>(`/api/live/classes/${encodeURIComponent(code)}/segments`),
  end: (code: string) => api.post<LiveClass>(`/api/live/classes/${encodeURIComponent(code)}/end`),
  videoToken: (code: string) =>
    api.post<{ url: string; token: string; canPublish: boolean }>(
      `/api/live/classes/${encodeURIComponent(code)}/video-token`,
    ),
};

/** "1:05:30" / "12:04" dari milidetik. */
export function formatOffset(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Transkrip sebagai teks biasa (untuk disalin/diunduh). */
export function transcriptText(cls: Pick<LiveClass, "title">, segments: LiveSegment[]): string {
  return [cls.title, "", ...segments.map((s) => `[${formatOffset(s.offsetMs)}] ${s.text}`)].join("\n");
}
