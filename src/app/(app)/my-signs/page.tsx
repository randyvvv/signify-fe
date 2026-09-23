"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BookMarked,
  CalendarClock,
  Trophy,
  Sprout,
  Plus,
  Trash2,
  Eye,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";

type Rating = "again" | "hard" | "good" | "easy";

interface VocabItem {
  id: string;
  word: string;
  source: "practice" | "quiz" | "translator" | "manual";
  intervalDays: number;
  repetitions: number;
  dueDate: string;
  lastReviewedAt: string | null;
}

interface VocabResponse {
  signedLanguage: string;
  stats: { total: number; due: number; mastered: number; learning: number };
  items: VocabItem[];
}

const RATINGS: { value: Rating; label: string; hint: string; className: string }[] = [
  { value: "again", label: "Again", hint: "Forgot it", className: "border-red-300 text-red-500 hover:bg-red-50" },
  { value: "hard", label: "Hard", hint: "Barely", className: "border-amber-300 text-amber-600 hover:bg-amber-50" },
  { value: "good", label: "Good", hint: "Got it", className: "border-teal-300 text-teal-600 hover:bg-teal-50" },
  { value: "easy", label: "Easy", hint: "Instantly", className: "border-sky-300 text-sky-600 hover:bg-sky-50" },
];

const SOURCE_LABEL: Record<VocabItem["source"], string> = {
  practice: "Practice",
  quiz: "Quiz",
  translator: "Translator",
  manual: "Added",
};

const nowMs = () => Date.now();

function dueLabel(dueDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate <= today) return "Due now";
  const days = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

export default function MySignsPage() {
  const avatar = useEquippedAvatar();
  const [data, setData] = useState<VocabResponse | null>(null);
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);

  // Sesi review
  const [queue, setQueue] = useState<VocabItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<{ id: string; rating: Rating }[]>([]);
  const [summary, setSummary] = useState<{ reviewed: number; coinsEarned: number } | null>(null);
  const reviewStartRef = useRef(0);

  const load = useCallback(() => {
    api
      .get<VocabResponse>("/api/vocabulary")
      .then(setData)
      .catch(() => toast.error("Failed to load your signs"));
  }, []);

  useEffect(load, [load]);

  const startReview = async () => {
    try {
      const due = await api.get<VocabItem[]>("/api/vocabulary/due?limit=20");
      if (due.length === 0) {
        toast.success("Nothing to review right now 🎉");
        return;
      }
      setQueue(due);
      setPos(0);
      setRevealed(false);
      setRatings([]);
      setSummary(null);
      reviewStartRef.current = nowMs();
    } catch {
      toast.error("Failed to start review");
    }
  };

  const finishReview = async (all: { id: string; rating: Rating }[]) => {
    try {
      const res = await api.post<{ reviewed: number; coinsEarned: number }>(
        "/api/vocabulary/reviews",
        {
          reviews: all,
          durationSeconds: Math.round((nowMs() - reviewStartRef.current) / 1000),
        },
      );
      setSummary(res);
      load();
    } catch (err) {
      toast.error("Failed to save review", {
        description: err instanceof ApiError ? err.message : undefined,
      });
      setQueue(null);
    }
  };

  const rate = (rating: Rating) => {
    if (!queue) return;
    const card = queue[pos];
    const next = [...ratings, { id: card.id, rating }];
    setRatings(next);
    setRevealed(false);
    if (pos + 1 < queue.length) setPos(pos + 1);
    else finishReview(next);
  };

  const addWord = async () => {
    const word = newWord.trim();
    if (!word) return;
    setAdding(true);
    try {
      await api.post("/api/vocabulary", { word, source: "manual" });
      setNewWord("");
      load();
      toast.success(`Added "${word}"`);
    } catch (err) {
      toast.error("Failed to add word", {
        description: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (item: VocabItem) => {
    try {
      await api.del(`/api/vocabulary/${item.id}`);
      load();
    } catch {
      toast.error("Failed to remove word");
    }
  };

  const reviewing = queue !== null && !summary;
  const card = reviewing ? queue![pos] : null;
  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
        {queue ? (
          <button
            onClick={() => setQueue(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-bold text-black">My Signs</h1>
          <p className="text-sm text-grey">
            {reviewing
              ? `Review ${pos + 1} / ${queue!.length}`
              : "Every sign you meet, reviewed at the right time"}
          </p>
        </div>
      </div>

      {summary ? (
        /* ===== Selesai review ===== */
        <div className="flex flex-col items-center gap-4 rounded-[20px] bg-gradient-to-r from-[#E0F7FA] to-[#FFF9C4] p-12 text-center shadow-sm">
          <Trophy className="h-12 w-12 text-amber-500" />
          <h2 className="text-2xl font-bold text-black">Review complete!</h2>
          <p className="text-grey">
            You reviewed {summary.reviewed} sign{summary.reviewed === 1 ? "" : "s"}.
          </p>
          <div className="flex items-center gap-2 text-2xl font-bold text-amber-500">
            <Coins className="h-6 w-6" /> +{summary.coinsEarned}
          </div>
          <Button
            onClick={() => setQueue(null)}
            className="mt-2 rounded-xl bg-quinary px-8 text-white hover:bg-quinary/90"
          >
            Back to My Signs
          </Button>
        </div>
      ) : card ? (
        /* ===== Kartu review ===== */
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-[20px] bg-white p-6 shadow-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-tertiary transition-all"
              style={{ width: `${(pos / queue!.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm font-medium text-grey">
            What does the avatar sign?
          </p>
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-senary/30">
            <SignAvatarViewer
              key={card.id}
              text={card.word}
              vrmUrl={avatar.vrmUrl}
              hairColor={avatar.hairColor}
              eyeColor={avatar.eyeColor}
              accessory={avatar.accessory}
              className="h-full w-full"
            />
          </div>

          {revealed ? (
            <>
              <p className="text-center font-heading text-3xl font-bold capitalize text-quinary">
                {card.word}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => rate(r.value)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border-2 bg-white px-3 py-2 transition-colors",
                      r.className,
                    )}
                  >
                    <span className="font-semibold">{r.label}</span>
                    <span className="text-xs opacity-70">{r.hint}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Button
              onClick={() => setRevealed(true)}
              className="h-12 rounded-xl bg-quinary text-base font-semibold text-white hover:bg-quinary/90"
            >
              <Eye className="h-5 w-5" /> Show answer
            </Button>
          )}
        </div>
      ) : (
        /* ===== Ringkasan + daftar ===== */
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total signs", value: stats?.total, icon: BookMarked, tone: "bg-secondary text-quaternary" },
              { label: "Due today", value: stats?.due, icon: CalendarClock, tone: "bg-rose-50 text-rose-500" },
              { label: "Learning", value: stats?.learning, icon: Sprout, tone: "bg-teal-50 text-teal-600" },
              { label: "Mastered", value: stats?.mastered, icon: Trophy, tone: "bg-amber-50 text-amber-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-sm">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.tone)}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-quaternary">{s.value ?? "–"}</p>
                  <p className="text-sm text-grey">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start justify-between gap-4 rounded-[20px] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-lg font-bold text-quaternary">Daily review</h2>
              <p className="text-sm text-grey">
                {stats?.due
                  ? `${stats.due} sign${stats.due === 1 ? " is" : "s are"} waiting for you. Keep your streak going!`
                  : "You're all caught up. New signs from practice and quizzes land here."}
              </p>
            </div>
            <Button
              onClick={startReview}
              disabled={!stats?.due}
              className="h-11 rounded-xl bg-quinary px-6 font-semibold text-white hover:bg-quinary/90"
            >
              Start review
            </Button>
          </div>

          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-heading text-lg font-bold text-quaternary">All signs</h2>
              <div className="flex gap-2">
                <input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWord()}
                  placeholder="Add a word..."
                  className="h-10 w-48 rounded-[10px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-quinary/50"
                />
                <Button
                  onClick={addWord}
                  disabled={adding}
                  className="h-10 rounded-[10px] bg-quinary text-white hover:bg-quinary/90"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            {data && data.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-grey">
                No signs yet. Practice signs, take a sign quiz, or add a word above.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {data?.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium capitalize text-quaternary">{item.word}</p>
                      <p className="text-xs text-grey">
                        {SOURCE_LABEL[item.source]} · {dueLabel(item.dueDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item)}
                      aria-label={`Remove ${item.word}`}
                      className="rounded-lg p-2 text-grey hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
