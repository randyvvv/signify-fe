"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CalendarClock,
  Check,
  ChevronLeft,
  Coins,
  Eye,
  Hand,
  Keyboard,
  Languages,
  Loader2,
  Plus,
  Search,
  SearchX,
  Sparkles,
  Sprout,
  Trash2,
  Trophy,
  X,
  type LucideIcon,
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

type Filter = "all" | "due" | "learning" | "mastered";

// Sama dengan backend: interval >= 21 hari dianggap "dikuasai".
const MASTERED_INTERVAL = 21;

const RATINGS: {
  value: Rating;
  label: string;
  hint: string;
  key: string;
  className: string;
  dot: string;
}[] = [
  {
    value: "again",
    label: "Again",
    hint: "Forgot it",
    key: "1",
    className: "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50",
    dot: "bg-rose-400",
  },
  {
    value: "hard",
    label: "Hard",
    hint: "Barely",
    key: "2",
    className: "border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50",
    dot: "bg-amber-400",
  },
  {
    value: "good",
    label: "Good",
    hint: "Got it",
    key: "3",
    className: "border-teal-200 text-teal-600 hover:border-teal-300 hover:bg-teal-50",
    dot: "bg-teal-400",
  },
  {
    value: "easy",
    label: "Easy",
    hint: "Instantly",
    key: "4",
    className: "border-sky-200 text-sky-600 hover:border-sky-300 hover:bg-sky-50",
    dot: "bg-sky-400",
  },
];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due" },
  { value: "learning", label: "Learning" },
  { value: "mastered", label: "Mastered" },
];

const SOURCE_LABEL: Record<VocabItem["source"], string> = {
  practice: "Practice",
  quiz: "Quiz",
  translator: "Translator",
  manual: "Added",
};

const SIGN_LANGUAGE_LABEL: Record<string, string> = { ase: "ASL" };

const nowMs = () => Date.now();

function dueLabel(dueDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate <= today) return "Due now";
  const days = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

// Helper status kartu (di luar komponen supaya render tetap murni).
function isDue(dueDate: string): boolean {
  return dueDate <= new Date().toISOString().slice(0, 10);
}

function isMastered(item: VocabItem): boolean {
  return item.intervalDays >= MASTERED_INTERVAL;
}

function matchesFilter(item: VocabItem, filter: Filter): boolean {
  if (filter === "due") return isDue(item.dueDate);
  if (filter === "mastered") return isMastered(item);
  if (filter === "learning") return !isMastered(item);
  return true;
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint: string;
  tone: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-125",
          tone,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 font-heading text-3xl font-bold text-slate-800">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}

const valueSkeleton = (
  <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-200/70 align-middle" />
);

export default function MySignsPage() {
  const avatar = useEquippedAvatar();
  const [data, setData] = useState<VocabResponse | null>(null);
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  // Keluar dari review / ringkasan, kembali ke daftar.
  const exitReview = () => {
    setQueue(null);
    setSummary(null);
  };

  const reviewing = queue !== null && !summary;
  const card = reviewing ? queue![pos] : null;
  const stats = data?.stats;
  // Semua kartu sudah dinilai, tinggal menunggu hasil simpan.
  const saving = reviewing && ratings.length >= queue!.length;

  // Shortcut keyboard saat review: Space = tampilkan jawaban, 1-4 = nilai.
  // `rate` dibaca lewat ref supaya listener tidak perlu dipasang ulang tiap render.
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  });
  useEffect(() => {
    if (!card || saving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (!revealed) {
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      const r = RATINGS.find((x) => x.key === e.key);
      if (r) {
        e.preventDefault();
        rateRef.current(r.value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, revealed, saving]);

  // Daftar kata: pencarian + filter di sisi klien.
  const items = data?.items ?? [];
  const query = search.trim().toLowerCase();
  const counts: Record<Filter, number> = {
    all: items.length,
    due: items.filter((i) => isDue(i.dueDate)).length,
    learning: items.filter((i) => !isMastered(i)).length,
    mastered: items.filter(isMastered).length,
  };
  const visible = items.filter(
    (i) => matchesFilter(i, filter) && (!query || i.word.toLowerCase().includes(query)),
  );
  const hasFilters = !!query || filter !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const reviewTotal = queue?.length ?? 0;
  const reviewPercent = reviewTotal ? Math.round((ratings.length / reviewTotal) * 100) : 0;
  const ratingCounts = RATINGS.map((r) => ({
    ...r,
    count: ratings.filter((x) => x.rating === r.value).length,
  }));
  const due = stats?.due ?? 0;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Hero ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {queue || summary ? (
              <button
                onClick={exitReview}
                aria-label="Back to My Signs"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
            )}
            <div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">My Signs</h1>
              <p className="text-sm text-white/80">
                {summary
                  ? "Review finished — nice work!"
                  : reviewing
                    ? `Daily review · card ${Math.min(pos + 1, reviewTotal)} of ${reviewTotal}`
                    : "Every sign you meet, reviewed at the right time"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            {data && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
                <Languages className="h-3.5 w-3.5" />
                {SIGN_LANGUAGE_LABEL[data.signedLanguage] ?? data.signedLanguage.toUpperCase()}
              </span>
            )}
            {!queue && !summary && due > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0B7077] shadow-sm">
                <CalendarClock className="h-3.5 w-3.5" />
                {due} due today
              </span>
            )}
          </div>
        </div>
      </div>

      {summary ? (
        /* ===== Selesai review ===== */
        <div className="mx-auto w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#C5FBF9] to-[#FDF5BF] p-8 text-center shadow-sm ring-1 ring-teal-100 md:p-12">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-[#FFE75C]/40 blur-2xl" />
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-amber-300/30 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-amber-500 shadow-md">
                <Trophy className="h-10 w-10" />
              </div>
            </div>
            <div className="relative">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">
                Review complete!
              </h2>
              <p className="mt-1 text-slate-600">
                You reviewed {summary.reviewed} sign{summary.reviewed === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="relative flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xl font-bold text-amber-500 shadow-sm">
              <Coins className="h-5 w-5" /> +{summary.coinsEarned} coins
            </div>
            <div className="relative grid w-full grid-cols-4 gap-2">
              {ratingCounts.map((r) => (
                <div key={r.value} className="rounded-2xl bg-white/70 px-2 py-3 backdrop-blur">
                  <p className="font-heading text-xl font-bold text-slate-800">{r.count}</p>
                  <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                    <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                    {r.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="relative flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={exitReview}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
              >
                Back to My Signs
              </Button>
              {due > 0 && (
                <Button
                  variant="outline"
                  onClick={startReview}
                  className="h-11 rounded-xl border-slate-200 bg-white/80 px-6 font-semibold text-slate-700"
                >
                  Keep going ({due} due) <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : card ? (
        /* ===== Kartu review ===== */
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Card {Math.min(pos + 1, reviewTotal)} of {reviewTotal}
              </span>
              <span className="text-[#0B7077]">{reviewPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-all duration-500"
                style={{ width: `${reviewPercent}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="font-heading text-lg font-bold text-slate-800">What does the avatar sign?</p>
            <p className="text-xs text-slate-500">Think of the word, then check your answer</p>
          </div>

          <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#C5FBF9]/60 to-[#FDF5BF]/60">
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

          {saving ? (
            <div className="flex h-[116px] flex-col items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#2DA5A2]" />
              Saving your review…
            </div>
          ) : revealed ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Answer</p>
                <p className="font-heading text-3xl font-bold capitalize text-[#0B7077]">{card.word}</p>
              </div>
              <div>
                <p className="mb-2 text-center text-xs font-semibold text-slate-500">
                  How well did you know it?
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => rate(r.value)}
                      className={cn(
                        "relative flex flex-col items-center rounded-2xl border-2 bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm",
                        r.className,
                      )}
                    >
                      <kbd className="absolute right-2 top-1.5 hidden rounded-md bg-slate-100 px-1.5 font-sans text-[10px] font-bold text-slate-400 sm:block">
                        {r.key}
                      </kbd>
                      <span className="font-semibold">{r.label}</span>
                      <span className="text-xs opacity-70">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setRevealed(true)}
              className="h-12 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-base font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
            >
              <Eye className="h-5 w-5" /> Show answer
              <kbd className="ml-1 hidden rounded-md bg-white/20 px-1.5 py-0.5 font-sans text-[10px] font-bold sm:inline">
                Space
              </kbd>
            </Button>
          )}

          <p className="hidden items-center justify-center gap-1.5 text-[11px] text-slate-400 sm:flex">
            <Keyboard className="h-3.5 w-3.5" />
            Space to reveal · 1–4 to rate
          </p>
        </div>
      ) : (
        /* ===== Ringkasan + daftar ===== */
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={BookMarked}
              label="Total signs"
              value={stats ? stats.total : valueSkeleton}
              hint="in your vocabulary"
              tone="bg-sky-100 text-sky-600"
            />
            <StatTile
              icon={CalendarClock}
              label="Due today"
              value={stats ? stats.due : valueSkeleton}
              hint="ready to review"
              tone="bg-rose-100 text-rose-500"
            />
            <StatTile
              icon={Sprout}
              label="Learning"
              value={stats ? stats.learning : valueSkeleton}
              hint="still sinking in"
              tone="bg-teal-100 text-teal-600"
            />
            <StatTile
              icon={Trophy}
              label="Mastered"
              value={stats ? stats.mastered : valueSkeleton}
              hint={`${MASTERED_INTERVAL}+ day interval`}
              tone="bg-amber-100 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            {/* ===== Daftar kata ===== */}
            <section className="order-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none lg:col-span-2">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-800">All signs</h2>
                  <p className="text-xs text-slate-500">
                    From practice, quizzes, the translator — or added by you
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-56 sm:flex-none">
                    <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addWord()}
                      placeholder="Add a word..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
                    />
                  </div>
                  <Button
                    onClick={addWord}
                    disabled={adding}
                    className="h-10 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-4 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                </div>
              </div>

              <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative md:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your signs"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm transition-colors focus:border-[#2DA5A2] focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:ml-auto md:pb-0">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        filter === f.value
                          ? "bg-[#0B7077] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {f.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-xs",
                          filter === f.value ? "bg-white/20" : "bg-white text-slate-500",
                        )}
                      >
                        {counts[f.value]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {!data ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 5 }, (_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              ) : data.items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-500">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <p className="font-heading text-lg font-bold text-slate-700">No signs yet</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    Practice signs, take a sign quiz, or add a word above — they&apos;ll show up here
                    for review.
                  </p>
                  <Link
                    href="/sign-practice"
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
                  >
                    <Hand className="h-4 w-4" /> Start sign practice
                  </Link>
                </div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                    <SearchX className="h-8 w-8" />
                  </div>
                  <p className="font-heading text-lg font-bold text-slate-700">No signs match</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    Try another word or switch the filter.
                  </p>
                  {hasFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-1 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-slate-100">
                  {visible.map((item) => {
                    const dueNow = isDue(item.dueDate);
                    const mastered = isMastered(item);
                    return (
                      <li key={item.id} className="group flex items-center gap-3 py-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-heading text-base font-bold uppercase",
                            mastered
                              ? "bg-amber-50 text-amber-600"
                              : dueNow
                                ? "bg-rose-50 text-rose-500"
                                : "bg-teal-50 text-teal-600",
                          )}
                        >
                          {item.word.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold capitalize text-slate-800">{item.word}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {SOURCE_LABEL[item.source]}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                dueNow ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700",
                              )}
                            >
                              <CalendarClock className="h-3 w-3" />
                              {dueLabel(item.dueDate)}
                            </span>
                            {mastered && (
                              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                                <Trophy className="h-3 w-3" /> Mastered
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => remove(item)}
                          aria-label={`Remove ${item.word}`}
                          className="shrink-0 rounded-xl p-2 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 group-hover:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ===== Kolom kanan: CTA review + penjelasan ===== */}
            <div className="contents lg:flex lg:flex-col lg:gap-6">
              <div className="relative order-1 flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#6632FF] to-[#8B5CF6] p-6 text-white shadow-lg shadow-violet-900/15 lg:order-none">
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#FFC619]/40 blur-xl" />
                <BookMarked className="absolute -bottom-6 right-4 h-32 w-32 -rotate-12 text-white/10" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> Daily review
                  </span>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-heading text-5xl font-bold leading-none">
                      {stats ? due : "–"}
                    </span>
                    <span className="pb-1 text-sm font-medium text-white/80">
                      sign{due === 1 ? "" : "s"} due
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">
                    {due
                      ? `${due} sign${due === 1 ? " is" : "s are"} waiting for you. Keep your streak going!`
                      : "You're all caught up. New signs from practice and quizzes land here."}
                  </p>
                </div>
                <Button
                  onClick={startReview}
                  disabled={!due}
                  className="relative mt-5 h-11 w-full rounded-xl bg-white font-semibold text-[#6632FF] shadow-md hover:bg-white/90 sm:w-fit sm:px-6"
                >
                  {due ? (
                    <>
                      Start review <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> All caught up
                    </>
                  )}
                </Button>
              </div>

              <div className="order-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none">
                <h3 className="font-heading font-bold text-slate-800">How reviews work</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Rate each card honestly — signs you know come back less often.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {RATINGS.map((r) => (
                    <li key={r.value} className="flex items-center gap-3 text-sm">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", r.dot)} />
                      <span className="w-12 font-semibold text-slate-700">{r.label}</span>
                      <span className="text-slate-500">{r.hint}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                  <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                  <p>
                    A sign counts as mastered once its review gap reaches {MASTERED_INTERVAL} days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
