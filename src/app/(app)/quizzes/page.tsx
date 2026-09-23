"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  Coins,
  Flame,
  Heart,
  Layers,
  ListChecks,
  Search,
  SearchX,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Level = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: Level;
  likesCount: number;
  rewardCoins?: number;
}

const LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"] as const;

interface QuizMeta {
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
}

const CARD_IMAGE_FALLBACK = "/learning-materials/image-not-found.png";

const LEVEL_META: Record<Level, { label: string; icon: LucideIcon; badge: string; dot: string }> = {
  BEGINNER: {
    label: "Beginner",
    icon: SignalLow,
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    icon: SignalMedium,
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  EXPERT: {
    label: "Expert",
    icon: SignalHigh,
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
};

function levelMeta(level: string) {
  return LEVEL_META[level as Level] ?? LEVEL_META.BEGINNER;
}

function LevelBadge({ level, className }: { level: string; className?: string }) {
  const meta = levelMeta(level);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.badge,
        className,
      )}
    >
      <meta.icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <Link
      href={`/quizzes/${quiz.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-teal-200"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <Image
          src={quiz.thumbnailUrl || CARD_IMAGE_FALLBACK}
          alt={quiz.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <LevelBadge level={quiz.level} className="absolute left-3 top-3 shadow-sm ring-1 ring-white/60" />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          <Heart className="h-3.5 w-3.5 fill-[#DF5D73] text-[#DF5D73]" />
          {quiz.likesCount.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 font-semibold text-violet-700">
            {quiz.category}
          </span>
          {typeof quiz.rewardCoins === "number" && quiz.rewardCoins > 0 && (
            <span className="ml-auto flex items-center gap-1 font-semibold text-amber-600">
              <Coins className="h-3.5 w-3.5" />
              up to {quiz.rewardCoins}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-heading font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#0B7077]">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{quiz.description}</p>
        )}
        <span className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/10 transition-opacity group-hover:opacity-95">
          Start Quiz
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function PopularCard({ quiz, rank }: { quiz: Quiz; rank: number }) {
  return (
    <Link
      href={`/quizzes/${quiz.id}`}
      className="group flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={quiz.thumbnailUrl || CARD_IMAGE_FALLBACK}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span
          className={cn(
            "absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-heading text-xs font-bold shadow-sm",
            rank === 1 ? "bg-[#FFE75C] text-slate-800" : "bg-white/95 text-[#0B7077]",
          )}
        >
          #{rank}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-[#0B7077]">
          {quiz.title}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-500">
            <span className={cn("h-1.5 w-1.5 rounded-full", levelMeta(quiz.level).dot)} />
            {levelMeta(quiz.level).label}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Heart className="h-3.5 w-3.5 fill-[#DF5D73] text-[#DF5D73]" />
            {quiz.likesCount.toLocaleString()}
          </span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-teal-500" />
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100">
      <div className="aspect-video animate-pulse bg-slate-200/70" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [popular, setPopular] = useState<Quiz[]>([]);
  const [meta, setMeta] = useState<QuizMeta>({ byCategory: {}, byLevel: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Quiz[]>("/api/quizzes/popular").then(setPopular).catch(() => {});
    api.get<QuizMeta>("/api/quizzes/meta").then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedLevel) params.set("level", selectedLevel);
      if (selectedCategory) params.set("category", selectedCategory);
      api
        .get<Quiz[]>(`/api/quizzes?${params.toString()}`)
        .then(setQuizzes)
        .catch(() => setQuizzes([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedLevel, selectedCategory]);

  const toggleLevel = (level: string) =>
    setSelectedLevel((prev) => (prev === level ? null : level));

  const hasFilters = !!searchQuery.trim() || !!selectedLevel || !!selectedCategory;
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedLevel(null);
    setSelectedCategory(null);
  };

  const categories = Object.keys(meta.byCategory).sort();
  const totalQuizzes = Object.values(meta.byLevel).reduce((sum, n) => sum + n, 0);
  const showPopular = popular.length > 0 && !hasFilters;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Hero + search ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-6 hidden font-heading text-[180px] font-black leading-none text-white/10 md:block">
          ?
        </div>
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">Quizzes</h1>
              <p className="text-sm text-white/80">
                Practice to test your sign language skills and gain coins
              </p>
            </div>
          </div>
          <div className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="What topic do you want to practice today?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full rounded-2xl bg-white pl-14 pr-12 text-sm text-slate-800 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {totalQuizzes > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20 backdrop-blur">
                <ListChecks className="h-3.5 w-3.5" /> {totalQuizzes} quiz{totalQuizzes === 1 ? "" : "zes"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20 backdrop-blur">
                <Layers className="h-3.5 w-3.5" /> {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20 backdrop-blur">
                <Coins className="h-3.5 w-3.5 text-[#FFE75C]" /> Earn coins every quiz
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              !selectedCategory ? "bg-[#0B7077] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                selectedCategory === cat
                  ? "bg-[#0B7077] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {cat}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  selectedCategory === cat ? "bg-white/20" : "bg-white text-slate-500",
                )}
              >
                {meta.byCategory[cat] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid w-full grid-cols-4 rounded-2xl bg-slate-100 p-1 sm:inline-grid sm:w-fit">
            <button
              onClick={() => setSelectedLevel(null)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm",
                !selectedLevel ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Sparkles className="hidden h-4 w-4 sm:block" />
              All
            </button>
            {LEVELS.map((level) => {
              const m = LEVEL_META[level];
              return (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm",
                    selectedLevel === level
                      ? "bg-white text-[#0B7077] shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <m.icon className="hidden h-4 w-4 sm:block" />
                  {m.label}
                  <span className="hidden text-xs font-medium text-slate-400 md:inline">
                    {meta.byLevel[level] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm font-semibold text-[#DF5D73] hover:underline sm:ml-auto"
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ===== Popular ===== */}
      {showPopular && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
            <Flame className="h-5 w-5 fill-orange-400 text-orange-400" />
            Popular quizzes
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {popular.map((quiz, i) => (
              <PopularCard key={`popular-${quiz.id}`} quiz={quiz} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* ===== Results ===== */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-bold text-slate-800">
            {hasFilters ? "Results" : "All quizzes"}
          </h2>
          {!loading && (
            <span className="text-sm text-slate-500">
              {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <SearchX className="h-8 w-8" />
            </div>
            <p className="font-heading text-lg font-bold text-slate-700">No quizzes found</p>
            <p className="max-w-sm text-sm text-slate-500">
              Try another keyword or remove some filters.
            </p>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
