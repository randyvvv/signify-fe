import { api } from "@/lib/api";

// Role play dengan Signa: Signa memerankan tokoh, pelajar menjawab dengan isyarat.

export type RolePlayLang = "en" | "id";

export interface RolePlayScenario {
  id: string;
  icon: "coffee" | "briefcase" | "users" | "stethoscope";
  title: Record<RolePlayLang, string>;
  description: Record<RolePlayLang, string>;
  /** Jumlah balasan pelajar sebelum Signa menutup percakapan. */
  turns: number;
}

export interface RolePlayReply {
  text: string;
  /** 1-3 isyarat utama untuk diperagakan, mis. "COFFEE PLEASE". */
  gloss: string;
}

export interface RolePlayMessage {
  from: "signa" | "learner";
  text: string;
  score?: number | null;
}

export interface RolePlayTurn {
  line: string;
  replies: RolePlayReply[];
  done: boolean;
  summary: string | null;
  source: "gemini" | "script";
}

export const roleplayApi = {
  scenarios: () => api.get<RolePlayScenario[]>("/api/roleplay/scenarios"),
  turn: (scenarioId: string, lang: RolePlayLang, history: RolePlayMessage[]) =>
    api.post<RolePlayTurn>("/api/roleplay/turn", { scenarioId, lang, history }),
};
