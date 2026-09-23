// Tipe data Signify Coach (sama dengan backend src/services/agent/types.ts).

export type CoachCard =
  | {
      type: "plan";
      title: string;
      summary?: string;
      days: {
        day: number;
        title: string;
        tasks: { kind: "material" | "quiz" | "practice" | "review"; label: string; href?: string }[];
      }[];
    }
  | { type: "quiz"; quizId: string; title: string; level: string; questionCount: number }
  | { type: "vocabulary"; words: string[]; added: number }
  | { type: "signs"; phrases: string[] }
  | {
      type: "materials";
      note?: string;
      items: {
        id: string;
        title: string;
        category: string;
        type: string;
        thumbnailUrl: string | null;
        durationMinutes: number | null;
        pages: number | null;
        progress: number;
      }[];
    };

export interface CoachStep {
  id: string;
  tool: string;
  label: string;
  status: "running" | "done" | "error";
  summary?: string;
}

export type CoachEvent =
  | { type: "session"; sessionId: string; title: string }
  | { type: "step"; step: CoachStep }
  | { type: "card"; card: CoachCard }
  | { type: "message"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps: CoachStep[];
  cards: CoachCard[];
  /** Sedang berjalan (stream belum selesai). */
  pending?: boolean;
  error?: boolean;
}

export interface CoachSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}
