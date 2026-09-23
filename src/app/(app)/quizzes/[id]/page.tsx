"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Eraser,
  Hand,
  Heart,
  ImageIcon,
  LayoutGrid,
  ListChecks,
  Loader2,
  PartyPopper,
  RotateCcw,
  SearchX,
  Send,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Target,
  Timer,
  Trophy,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";

interface Question {
  id: string;
  ordering: number;
  type: "text" | "image" | "sign";
  question: string;
  promptImageUrl: string | null;
  term: string | null;
  options: string[];
  correctIndex: number;
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl?: string | null;
  level: string;
  category: string;
  likesCount: number;
  rewardCoins?: number;
  totalQuestions: number;
  questions: Question[];
}

interface ResultItem {
  questionId: string;
  question: string;
  type: "text" | "image" | "sign";
  term: string | null;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

interface AttemptResult {
  correctCount: number;
  totalCount: number;
  accuracy: number;
  pointsEarned: number;
  timeTakenSeconds: number;
  results: ResultItem[];
}

interface FetchState {
  id: string;
  quiz: QuizDetail | null;
  error: "not-found" | "failed" | null;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

const REVIEW_FILTERS = ["All", "Correct", "Wrong"] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

const LEVEL_META: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  BEGINNER: { label: "Beginner", icon: SignalLow, badge: "bg-emerald-100 text-emerald-700" },
  INTERMEDIATE: { label: "Intermediate", icon: SignalMedium, badge: "bg-amber-100 text-amber-700" },
  EXPERT: { label: "Expert", icon: SignalHigh, badge: "bg-rose-100 text-rose-700" },
};

const TYPE_META: Record<Question["type"], { label: string; icon: LucideIcon }> = {
  text: { label: "Read the sign", icon: ImageIcon },
  image: { label: "Find the sign", icon: LayoutGrid },
  sign: { label: "Watch the avatar", icon: Hand },
};

type OptionState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const OPTION_STYLE: Record<OptionState, { card: string; badge: string }> = {
  idle: {
    card: "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-md",
    badge: "bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-[#0B7077]",
  },
  selected: {
    card: "border-[#2DA5A2] bg-teal-50 text-slate-900 shadow-md ring-4 ring-teal-100",
    badge: "bg-[#0B7077] text-white",
  },
  correct: {
    card: "border-teal-500 bg-teal-50 text-teal-900",
    badge: "bg-teal-500 text-white",
  },
  wrong: {
    card: "border-rose-400 bg-rose-50 text-rose-900",
    badge: "bg-rose-500 text-white",
  },
  dimmed: {
    card: "cursor-not-allowed border-slate-200 bg-white text-slate-800 opacity-50",
    badge: "bg-slate-100 text-slate-400",
  },
};

// Hiasan konfeti statis untuk hero hasil.
const CONFETTI = [
  "left-[6%] top-[22%] h-3 w-3 rotate-12 rounded-sm bg-[#FFE75C]",
  "left-[16%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-[#DF5D73]",
  "left-[28%] top-[12%] h-2 w-4 -rotate-12 rounded-sm bg-white/70",
  "right-[24%] top-[16%] h-3 w-3 rotate-45 rounded-sm bg-[#6632FF]/80",
  "right-[10%] top-[40%] h-2.5 w-2.5 rounded-full bg-[#FFE75C]",
  "right-[18%] bottom-[14%] h-2 w-4 rotate-12 rounded-sm bg-[#DF5D73]/90",
  "left-[40%] bottom-[10%] h-2 w-2 rounded-full bg-white/70",
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function levelMeta(level: string) {
  return LEVEL_META[level] ?? LEVEL_META.BEGINNER;
}

function LevelBadge({ level }: { level: string }) {
  const meta = levelMeta(level);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", meta.badge)}>
      <meta.icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function ScoreRing({
  percent,
  className,
  tone = "stroke-[#2DA5A2]",
  track = "stroke-teal-100",
}: {
  percent: number;
  className?: string;
  tone?: string;
  track?: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const value = Math.min(100, Math.max(0, percent));
  return (
    <svg viewBox="0 0 120 120" className={cn("-rotate-90", className)}>
      <circle cx="60" cy="60" r={r} strokeWidth="12" className={cn("fill-none", track)} />
      <circle
        cx="60"
        cy="60"
        r={r}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / 100) * c}
        className={cn("fill-none transition-[stroke-dashoffset] duration-1000 ease-out", tone)}
      />
    </svg>
  );
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
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-125", tone)} />
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

function OptionIndicator({ state }: { state: OptionState }) {
  if (state === "correct" || state === "selected") {
    return (
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white animate-in zoom-in-50 duration-200",
          state === "correct" ? "bg-teal-500" : "bg-[#0B7077]",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  if (state === "wrong") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white animate-in zoom-in-50 duration-200">
        <X className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  return <span className="h-7 w-7 shrink-0 rounded-full border-2 border-slate-200 bg-white" />;
}

function PlaySkeleton() {
  const block = "animate-pulse rounded-3xl bg-slate-200/70";
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6" aria-busy="true">
      <div className={`h-24 ${block}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className={`h-24 ${block}`} />
          <div className={`h-[480px] ${block}`} />
        </div>
        <div className={`h-[420px] lg:col-span-4 ${block}`} />
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Link
      href="/quizzes"
      aria-label="Back to quizzes"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
    >
      <ChevronLeft className="h-6 w-6" />
    </Link>
  );
}

function HeroDecor() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-15 mix-blend-overlay"
        style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
      />
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
    </>
  );
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();

  const [fetched, setFetched] = useState<FetchState | null>(null);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCurrentSubmitted, setIsCurrentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("All");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const topRef = useRef<HTMLDivElement>(null);
  const avatar = useEquippedAvatar();

  // Status loading diturunkan dari id yang sudah dimuat (tanpa setState sinkron di effect).
  const state = fetched && fetched.id === id ? fetched : null;
  const quizReady = !!state?.quiz;

  useEffect(() => {
    let cancelled = false;
    api
      .get<QuizDetail>(`/api/quizzes/${id}`)
      .then((q) => {
        if (cancelled) return;
        startRef.current = Date.now();
        setFetched({ id, quiz: q, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setFetched({
          id,
          quiz: null,
          error: err instanceof ApiError && err.status === 404 ? "not-found" : "failed",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Timer berjalan selama quiz dikerjakan.
  useEffect(() => {
    if (!quizReady || result) return;
    const t = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [quizReady, result]);

  if (!state) return <PlaySkeleton />;

  const quiz = state.quiz;
  if (!quiz) {
    const notFound = state.error === "not-found";
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="font-heading text-lg font-bold text-slate-700">
          {notFound ? "Quiz not found" : "Couldn't load this quiz"}
        </p>
        <p className="max-w-sm text-sm text-slate-500">
          {notFound
            ? "This quiz may have been removed. Pick another one to keep practicing."
            : "Something went wrong while loading. Please refresh or try again later."}
        </p>
        <Link
          href="/quizzes"
          className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  const questions = quiz.questions;
  const current = questions[index];
  const isLast = index === questions.length - 1;

  const select = (i: number) => {
    if (!current || isCurrentSubmitted) return;
    setSelectedOption(i);
  };

  const clear = () => {
    if (!current || isCurrentSubmitted) return;
    setSelectedOption(null);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setSelectedOption(null);
    setIsCurrentSubmitted(false);
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submitLocal = () => {
    if (selectedOption === null || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selectedOption }));
    setIsCurrentSubmitted(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: questions
          .filter((q) => answers[q.id] !== undefined)
          .map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] })),
        timeTakenSeconds: Math.round((Date.now() - startRef.current) / 1000),
      };
      const res = await api.post<AttemptResult>(
        `/api/quizzes/${id}/attempts`,
        payload,
      );
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengirim jawaban";
      toast.error("Gagal", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setIsCurrentSubmitted(false);
    setReviewFilter("All");
    setElapsed(0);
    startRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- Results screen ---------------- */
  if (result) {
    const great = result.accuracy >= 70;
    const correctTotal = result.results.filter((r) => r.isCorrect).length;
    const wrongTotal = result.results.length - correctTotal;
    const skipped = Math.max(0, result.totalCount - result.results.length);
    const addsVocabulary = result.results.some((r) => r.type !== "text" && !!r.term);
    const counts: Record<ReviewFilter, number> = {
      All: result.results.length,
      Correct: correctTotal,
      Wrong: wrongTotal,
    };
    const reviewItems = result.results
      .map((ans, i) => ({ ans, number: i + 1 }))
      .filter(({ ans }) => {
        if (reviewFilter === "Correct") return ans.isCorrect;
        if (reviewFilter === "Wrong") return !ans.isCorrect;
        return true;
      });
    const pct = (n: number) => (result.totalCount > 0 ? (n / result.totalCount) * 100 : 0);

    return (
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ===== Celebration hero ===== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-10">
          <HeroDecor />
          <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#DF5D73]/25 blur-2xl" />
          {CONFETTI.map((c) => (
            <span key={c} className={cn("pointer-events-none absolute hidden sm:block", c)} />
          ))}
          <div className="absolute left-4 top-4 md:left-6 md:top-6">
            <BackButton />
          </div>
          <div className="relative flex flex-col items-center pt-8 text-center md:pt-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 ring-1 ring-white/30 backdrop-blur animate-float md:h-20 md:w-20">
              <PartyPopper className="h-8 w-8 text-[#FFE75C] md:h-10 md:w-10" />
            </div>
            <span className="mt-5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20">
              Quiz Completed!
            </span>
            <h1 className="mt-3 max-w-2xl font-heading text-2xl font-bold leading-tight md:text-4xl">
              {quiz.title}
            </h1>
            <p className="mt-2 max-w-md text-white/85">
              {great
                ? "Great job for finishing the quiz! Your signing skills are shining."
                : "Great job for finishing the quiz! A bit more practice and you'll nail it."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0B7077] shadow-md transition-transform hover:scale-[1.03]"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25"
              >
                More quizzes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ===== Score + stats ===== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col items-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-4">
            <div className="flex w-full items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-800">Your Score</h2>
                <p className="text-xs text-slate-500">Accuracy on this attempt</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="relative my-5 flex items-center justify-center">
              <ScoreRing percent={result.accuracy} className="h-40 w-40" />
              <div className="absolute text-center">
                <p className="font-heading text-4xl font-bold text-slate-800">{result.accuracy}%</p>
                <p className="text-xs text-slate-500">Accuracy</p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-6 py-1.5 text-sm font-bold",
                great ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {great ? "Great Job!" : "Keep practicing!"}
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile
                icon={CheckCircle2}
                label="Correct answers"
                value={
                  <>
                    {result.correctCount}
                    <span className="text-lg font-medium text-slate-400">/{result.totalCount}</span>
                  </>
                }
                hint="questions answered right"
                tone="bg-teal-100 text-teal-600"
              />
              <StatTile
                icon={Coins}
                label="Coins earned"
                value={`+${result.pointsEarned}`}
                hint="added to your balance"
                tone="bg-amber-100 text-amber-600"
              />
              <StatTile
                icon={Timer}
                label="Time taken"
                value={fmtTime(result.timeTakenSeconds)}
                hint="minutes : seconds"
                tone="bg-violet-100 text-violet-600"
              />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-slate-800">Answer breakdown</h3>
                <span className="text-xs text-slate-500">{result.totalCount} questions</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-teal-500 transition-all duration-700" style={{ width: `${pct(correctTotal)}%` }} />
                <div className="h-full bg-rose-400 transition-all duration-700" style={{ width: `${pct(wrongTotal)}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> {correctTotal} correct
                </span>
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> {wrongTotal} wrong
                </span>
                {skipped > 0 && (
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> {skipped} skipped
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {wrongTotal === 0
                  ? "Flawless! Every answer was right — try a harder level next."
                  : `Review the questions below to see where to practice next.${
                      addsVocabulary ? " Signs from this quiz were added to My Signs." : ""
                    }`}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Review ===== */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Question Review</h2>
              <p className="text-xs text-slate-500">See what you got right and what to practice</p>
            </div>
            <div className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1 sm:inline-grid sm:w-fit">
              {REVIEW_FILTERS.map((f) => {
                const Icon = f === "All" ? ListChecks : f === "Correct" ? CheckCircle2 : XCircle;
                return (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all",
                      reviewFilter === f ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {f}
                    <span className="text-xs font-medium text-slate-400">{counts[f]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {reviewItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                {reviewFilter === "Wrong" ? <Trophy className="h-6 w-6 text-amber-500" /> : <ListChecks className="h-6 w-6" />}
              </div>
              <p className="font-semibold text-slate-700">
                {reviewFilter === "Wrong" ? "No wrong answers — flawless!" : "Nothing to show here"}
              </p>
              <p className="text-sm text-slate-500">
                {reviewFilter === "Correct" ? "No correct answers this time. Keep practicing!" : "Try another filter."}
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {reviewItems.map(({ ans, number }) => {
                const originalQuestion = quiz.questions.find((q) => q.id === ans.questionId);
                const answerLabel = (idx: number) => {
                  const opt = originalQuestion?.options[idx];
                  if (ans.type !== "image") return opt;
                  return (
                    <>
                      {LABELS[idx]}
                      {opt && (
                        <span className="relative h-6 w-6 overflow-hidden rounded-md bg-white ring-1 ring-slate-200">
                          <Image src={opt} alt="" fill className="object-contain" unoptimized={true} />
                        </span>
                      )}
                    </>
                  );
                };

                return (
                  <li
                    key={ans.questionId}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border-l-4 bg-slate-50/60 p-3 ring-1 sm:items-center sm:gap-4 sm:p-4",
                      ans.isCorrect ? "border-l-teal-500 ring-teal-100" : "border-l-rose-500 ring-rose-100",
                    )}
                  >
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 sm:h-20 sm:w-32">
                      {ans.type === "text" ? (
                        <Image
                          src={originalQuestion?.promptImageUrl || "/quizzes/hand.png"}
                          alt="Quiz"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-50 to-amber-50 px-2 text-center font-heading text-base font-bold leading-tight text-[#0B7077] sm:text-lg">
                          {ans.term}
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded-full bg-white/95 px-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                        Q{number}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-slate-800">{ans.question}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
                            ans.isCorrect ? "bg-teal-100 text-teal-700" : "bg-rose-100 text-rose-700",
                          )}
                        >
                          <span className="text-xs font-medium opacity-75">Your answer:</span>
                          {answerLabel(ans.selectedIndex)}
                        </span>
                        {!ans.isCorrect && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 font-semibold text-teal-700">
                            <span className="text-xs font-medium opacity-75">Correct:</span>
                            {answerLabel(ans.correctIndex)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                        ans.isCorrect ? "bg-teal-500" : "bg-rose-500",
                      )}
                    >
                      {ans.isCorrect ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        <X className="h-4 w-4" strokeWidth={3} />
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    );
  }

  /* ---------------- Quiz screen ---------------- */
  const submittedQuestionsCount = Object.keys(answers).length;
  let correctAnswersCount = 0;
  for (const [qId, selIdx] of Object.entries(answers)) {
    const q = questions.find((q) => q.id === qId);
    if (q && q.correctIndex === selIdx) correctAnswersCount++;
  }
  const wrongAnswersCount = submittedQuestionsCount - correctAnswersCount;
  const accuracy = submittedQuestionsCount === 0 ? 0 : Math.round((correctAnswersCount / submittedQuestionsCount) * 100);

  const answeredCount = index + (isCurrentSubmitted ? 1 : 0);
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const isAnswerCorrect = !!current && selectedOption === current.correctIndex;
  const typeMeta = current ? TYPE_META[current.type] : null;

  const optionState = (i: number): OptionState => {
    if (!current) return "idle";
    const isSelected = selectedOption === i;
    const isCorrect = current.correctIndex === i;
    if (isCurrentSubmitted) {
      if (isCorrect) return "correct";
      if (isSelected) return "wrong";
      return "dimmed";
    }
    return isSelected ? "selected" : "idle";
  };

  const primaryBtn =
    "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 text-sm font-semibold text-white shadow-md shadow-teal-900/10 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none sm:w-56";

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-5 text-white shadow-lg shadow-teal-900/10 md:px-8 md:py-6">
        <HeroDecor />
        <div className="relative flex items-center gap-4">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-white/70">
              Quiz · {quiz.category}
            </p>
            <h1 className="truncate font-heading text-xl font-bold md:text-2xl">{quiz.title}</h1>
          </div>
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold tabular-nums ring-1 ring-white/20 backdrop-blur"
            aria-label="Time elapsed"
          >
            <Timer className="h-4 w-4" />
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ===== Main ===== */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {!current ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <ListChecks className="h-8 w-8" />
              </div>
              <p className="font-heading text-lg font-bold text-slate-700">No questions yet</p>
              <p className="max-w-sm text-sm text-slate-500">This quiz has no questions yet.</p>
              <Link
                href="/quizzes"
                className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
              >
                Back to quizzes
              </Link>
            </div>
          ) : (
            <>
              {/* Progress header */}
              <div ref={topRef} className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 font-heading text-lg font-bold text-[#0B7077]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-slate-800">
                        Question {index + 1} of {questions.length}
                      </p>
                      {typeMeta && (
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <typeMeta.icon className="h-3.5 w-3.5" />
                          {typeMeta.label}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[#0B7077]">
                    {Math.round(progressPct)}%
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div
                key={current.id}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-right-4 duration-300 md:p-8"
              >
                {current.type === "sign" ? (
                  <div className="mb-6 text-center">
                    <div className="relative mx-auto mb-5 aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-[#C5FBF9]/60 to-[#FDF5BF]/60 ring-1 ring-teal-100">
                      <SignAvatarViewer
                        key={current.id}
                        text={current.term ?? ""}
                        vrmUrl={avatar.vrmUrl}
                        hairColor={avatar.hairColor}
                        eyeColor={avatar.eyeColor}
                        accessory={avatar.accessory}
                        className="w-full h-full"
                        placeholder="Watch the avatar sign"
                      />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-slate-800 md:text-2xl">{current.question}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      The sign loops — watch it as many times as you need
                    </p>
                  </div>
                ) : current.type === "text" ? (
                  <div className="mb-6 text-center">
                    <div className="relative mx-auto mb-5 h-[240px] w-full max-w-lg overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-100 md:h-[300px]">
                      <Image
                        src={current.promptImageUrl || "/quizzes/hand.png"}
                        alt="Sign language gesture"
                        fill
                        className="object-contain"
                        unoptimized={true}
                        quality={100}
                      />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-slate-800 md:text-2xl">{current.question}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose the best answer from these options below
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 text-center">
                    <h2 className="font-heading text-xl font-bold text-slate-800 md:text-2xl">{current.question}</h2>
                    <div className="mx-auto mt-4 inline-flex max-w-full rounded-3xl bg-gradient-to-br from-teal-50 to-amber-50 px-8 py-5 ring-1 ring-teal-100">
                      <span className="break-words font-heading text-4xl font-bold text-[#0B7077] md:text-5xl">
                        {current.term}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">Pick the image that shows this sign</p>
                  </div>
                )}

                {/* Options */}
                <div
                  className={cn(
                    "mx-auto grid max-w-3xl gap-3",
                    current.type === "image" ? "grid-cols-2 md:gap-4" : "grid-cols-1 sm:grid-cols-2",
                  )}
                >
                  {current.options.map((option, i) => {
                    const st = optionState(i);
                    const style = OPTION_STYLE[st];
                    return (
                      <button
                        key={i}
                        onClick={() => select(i)}
                        disabled={isCurrentSubmitted}
                        aria-pressed={selectedOption === i}
                        className={cn(
                          "group relative rounded-2xl border-2 text-left transition-all duration-200",
                          style.card,
                          current.type === "image"
                            ? "flex flex-col gap-3 p-3"
                            : "flex w-full items-center gap-4 p-3 pr-4 sm:p-4",
                        )}
                      >
                        {current.type !== "image" ? (
                          <>
                            <span
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-heading font-bold transition-colors",
                                style.badge,
                              )}
                            >
                              {LABELS[i]}
                            </span>
                            <span className="flex-1 text-base font-semibold md:text-lg">{option}</span>
                            <OptionIndicator state={st} />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-xl font-heading text-sm font-bold transition-colors",
                                  style.badge,
                                )}
                              >
                                {LABELS[i]}
                              </span>
                              <OptionIndicator state={st} />
                            </div>
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
                              <Image
                                src={option}
                                alt={`Option ${LABELS[i]}`}
                                fill
                                className="object-contain"
                                unoptimized={true}
                                quality={100}
                              />
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {isCurrentSubmitted && (
                  <div
                    role="status"
                    className={cn(
                      "mx-auto mt-5 flex max-w-3xl items-start gap-3 rounded-2xl p-4 ring-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      isAnswerCorrect
                        ? "bg-teal-50 text-teal-800 ring-teal-200"
                        : "bg-rose-50 text-rose-800 ring-rose-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
                        isAnswerCorrect ? "bg-teal-500" : "bg-rose-500",
                      )}
                    >
                      {isAnswerCorrect ? (
                        <Check className="h-5 w-5" strokeWidth={3} />
                      ) : (
                        <X className="h-5 w-5" strokeWidth={3} />
                      )}
                    </span>
                    <div>
                      <p className="font-heading font-bold">
                        {isAnswerCorrect ? "Correct Answer!" : "Wrong Answer"}
                      </p>
                      <p className="text-sm opacity-90">
                        {isAnswerCorrect
                          ? `Great job! Option ${LABELS[current.correctIndex]} is the correct answer.`
                          : `The correct answer is Option ${LABELS[current.correctIndex]}${
                              current.type !== "image" ? ` (${current.options[current.correctIndex]})` : ""
                            }, don't give up!`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    onClick={clear}
                    disabled={isCurrentSubmitted || selectedOption === null}
                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-[#0B7077] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 sm:px-5"
                  >
                    <Eraser className="h-4 w-4" /> Clear
                  </button>
                  <div className="ml-auto flex flex-1 justify-end sm:flex-none">
                    {!isCurrentSubmitted ? (
                      <button onClick={submitLocal} disabled={selectedOption === null} className={primaryBtn}>
                        <Send className="h-4 w-4" /> Submit Answer
                      </button>
                    ) : isLast ? (
                      <button onClick={submit} disabled={submitting} className={primaryBtn}>
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <Trophy className="h-4 w-4" /> Finish Quiz
                          </>
                        )}
                      </button>
                    ) : (
                      <button onClick={next} className={primaryBtn}>
                        Next Question <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== Sidebar ===== */}
        <aside className="lg:col-span-4">
          <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-8">
            {quiz.thumbnailUrl && (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
                <Image src={quiz.thumbnailUrl} alt={quiz.title} fill className="object-cover" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={quiz.level} />
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  {quiz.category}
                </span>
              </div>
              <h2 className="mt-3 font-heading text-xl font-bold text-slate-800">{quiz.title}</h2>
              {quiz.description && (
                <p className="mt-1 line-clamp-3 text-sm text-slate-500">{quiz.description}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <ListChecks className="mx-auto h-4 w-4 text-[#0B7077]" />
                <p className="mt-1 font-heading font-bold text-slate-800">{questions.length}</p>
                <p className="text-[11px] text-slate-500">Questions</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <Coins className="mx-auto h-4 w-4 text-amber-500" />
                <p className="mt-1 font-heading font-bold text-slate-800">
                  {typeof quiz.rewardCoins === "number" ? quiz.rewardCoins : "—"}
                </p>
                <p className="text-[11px] text-slate-500">Max coins</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <Heart className="mx-auto h-4 w-4 fill-[#DF5D73] text-[#DF5D73]" />
                <p className="mt-1 font-heading font-bold text-slate-800">{quiz.likesCount.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Likes</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-slate-800">Progress</h3>
                <p className="text-sm text-slate-500">
                  <span className="font-heading text-lg font-bold text-slate-800">
                    {answeredCount}/{questions.length}
                  </span>{" "}
                  answered
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {questions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {questions.map((q, i) => {
                    const a = answers[q.id];
                    const status =
                      a !== undefined
                        ? a === q.correctIndex
                          ? "correct"
                          : "wrong"
                        : i === index
                          ? "current"
                          : "todo";
                    return (
                      <span
                        key={q.id}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                          status === "correct" && "bg-teal-500 text-white",
                          status === "wrong" && "bg-rose-500 text-white",
                          status === "current" && "bg-white text-[#0B7077] ring-2 ring-[#2DA5A2]",
                          status === "todo" && "bg-white text-slate-400 ring-1 ring-slate-200",
                        )}
                      >
                        {i + 1}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-50 to-amber-50 p-4">
              <div className="relative flex shrink-0 items-center justify-center">
                <ScoreRing percent={accuracy} className="h-20 w-20" track="stroke-white" />
                <span className="absolute font-heading text-lg font-bold text-slate-800">{accuracy}%</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800">Live accuracy</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {submittedQuestionsCount === 0
                    ? "Submit your first answer to start tracking."
                    : `${correctAnswersCount} correct · ${wrongAnswersCount} wrong`}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
