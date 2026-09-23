"use client";

import React from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Clock,
  Coins,
  Flame,
  Hand,
  Languages,
  ListChecks,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Video,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCachedGet } from "@/lib/cache";
import { cn } from "@/lib/utils";

const CARD_IMAGE_FALLBACK = "/learning-materials/image-not-found.png";

interface DashboardData {
  user: { id: string; fullName: string | null; avatarUrl: string | null; coins: number };
  stats: {
    streak: number;
    rank: number;
    totalLearningHours: number;
    dailyGoal: { target: number; current: number; percent: number };
  };
  recommended: {
    id: string;
    title: string;
    durationMinutes: number | null;
    thumbnailUrl: string | null;
    category: string;
    progress: number;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    durationSeconds: number;
    createdAt: string;
  }[];
  dailyQuiz: { id: string; title: string } | null;
}

interface VocabularyStats {
  stats: { total: number; due: number; mastered: number; learning: number };
}

// Helper waktu di luar komponen supaya render tetap murni (aturan purity React).
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - Date.parse(iso)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function goalMessage(percent: number) {
  if (percent >= 100) return "Daily goal reached — amazing work! 🎉";
  if (percent >= 50) return "You're more than halfway to today's goal.";
  if (percent > 0) return "Nice start! Keep going to hit today's goal.";
  return "Ready to continue your learning journey today?";
}

const ACTIVITY_STYLE: Record<string, { icon: LucideIcon; tone: string; label: string }> = {
  material: { icon: BookOpen, tone: "bg-teal-50 text-teal-600", label: "Learning material" },
  quiz: { icon: ListChecks, tone: "bg-violet-50 text-violet-600", label: "Quiz" },
  practice: { icon: Hand, tone: "bg-orange-50 text-orange-500", label: "Sign practice" },
  review: { icon: BookMarked, tone: "bg-sky-50 text-sky-600", label: "Vocabulary review" },
};

// Kerangka dashboard selagi data pertama kali dimuat (belum ada cache).
function DashboardSkeleton() {
  const block = "animate-pulse rounded-3xl bg-slate-200/70";
  return (
    <div className="mx-auto max-w-[1400px] space-y-6" aria-busy="true">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`h-[280px] lg:col-span-8 ${block}`} />
        <div className={`h-[280px] lg:col-span-4 ${block}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-28 ${block}`} />
        ))}
      </div>
      <div className={`h-64 ${block}`} />
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const value = Math.min(100, Math.max(0, percent));
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
      <circle cx="60" cy="60" r={r} strokeWidth="12" className="fill-none stroke-teal-100" />
      <circle
        cx="60"
        cy="60"
        r={r}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / 100) * c}
        className="fill-none stroke-[#2DA5A2] transition-[stroke-dashoffset] duration-1000 ease-out"
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
  value: React.ReactNode;
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

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
  tone,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
    >
      <div className={cn("relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110", tone)}>
        <Icon className="h-6 w-6" />
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#DF5D73] px-1.5 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="truncate text-xs text-slate-500">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-teal-500" />
    </Link>
  );
}

export function MainDashboard() {
  const { user: me } = useAuth();
  // Tampil instan dari cache terakhir, lalu diperbarui di belakang.
  const { data, error } = useCachedGet<DashboardData>(
    "/api/dashboard",
    me ? `dashboard:${me.id}` : null,
  );
  const { data: vocab } = useCachedGet<VocabularyStats>(
    "/api/vocabulary",
    me ? `vocabulary:${me.id}` : null,
  );

  if (error) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        Gagal memuat dashboard. Coba refresh.
      </div>
    );
  }
  if (!data) return <DashboardSkeleton />;

  const { user, stats, recommended, recentActivity, dailyQuiz } = data;
  const firstName = (user.fullName ?? "Learner").split(" ")[0];
  const inProgress = recommended.find((c) => c.progress > 0 && c.progress < 100);
  const continueHref = inProgress ? `/learning-materials/${inProgress.id}` : "/learning-materials";
  const dueSigns = vocab?.stats.due ?? 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Hero + Daily goal ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-8 text-white shadow-lg shadow-teal-900/10 lg:col-span-8">
          <div
            className="absolute inset-0 opacity-15 mix-blend-overlay"
            style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
          />
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8 sm:max-w-[60%]">
            <div>
              <p className="text-sm font-medium text-white/70">{todayLabel()}</p>
              <h1 className="mt-2 font-heading text-3xl font-bold leading-tight md:text-4xl">
                {greeting()}, {firstName}! 👋
              </h1>
              <p className="mt-3 max-w-md text-white/85">{goalMessage(stats.dailyGoal.percent)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={continueHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0B7077] shadow-md transition-transform hover:scale-[1.03]"
              >
                <PlayCircle className="h-4 w-4" />
                {inProgress ? "Continue learning" : "Start learning"}
              </Link>
              <Link
                href="/sign-practice"
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25"
              >
                <Hand className="h-4 w-4" /> Practice signs
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-4 hidden h-[260px] w-[240px] sm:block lg:right-10">
            <div className="absolute bottom-6 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-white/15" />
            <Image
              src="/landing/girl.webp"
              alt=""
              fill
              priority
              className="animate-float object-contain object-bottom"
            />
          </div>
          <div className="absolute right-6 top-6 z-10 hidden items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-amber-600 shadow-md sm:flex">
            <Coins className="h-4 w-4" /> {user.coins.toLocaleString()}
          </div>
        </div>

        {/* Daily goal */}
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Daily Goal</h2>
              <p className="text-xs text-slate-500">Minutes of learning today</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="relative mx-auto my-4 flex items-center justify-center">
            <ProgressRing percent={stats.dailyGoal.percent} />
            <div className="absolute text-center">
              <p className="font-heading text-3xl font-bold text-slate-800">
                {stats.dailyGoal.percent}%
              </p>
              <p className="text-xs text-slate-500">
                {stats.dailyGoal.current}/{stats.dailyGoal.target} min
              </p>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 p-3">
            <Flame className="h-8 w-8 shrink-0 fill-orange-400 text-orange-400" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">
                {stats.streak} day{stats.streak === 1 ? "" : "s"} streak
              </p>
              <p className="text-xs text-slate-500">
                {stats.streak > 0 ? "Learn today to keep it alive!" : "Start a streak today!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Flame} label="Streak" value={stats.streak} hint="days in a row" tone="bg-orange-100 text-orange-500" />
        <StatTile icon={Trophy} label="Rank" value={`#${stats.rank}`} hint="on the leaderboard" tone="bg-rose-100 text-rose-500" />
        <StatTile icon={Clock} label="Learning" value={`${stats.totalLearningHours}h`} hint="total time spent" tone="bg-violet-100 text-violet-600" />
        <StatTile icon={Coins} label="Coins" value={user.coins.toLocaleString()} hint="spend them in the shop" tone="bg-amber-100 text-amber-600" />
      </div>

      {/* ===== Quick actions ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction href="/live-translator" icon={Languages} title="Live Translator" desc="Text & video to sign language" tone="bg-teal-50 text-teal-600" />
        <QuickAction href="/sign-practice" icon={Hand} title="Sign Practice" desc="Get scored by your camera" tone="bg-orange-50 text-orange-500" />
        <QuickAction href="/quizzes" icon={ListChecks} title="Quizzes" desc="Test yourself, earn coins" tone="bg-violet-50 text-violet-600" />
        <QuickAction
          href="/my-signs"
          icon={BookMarked}
          title="My Signs"
          desc={dueSigns ? `${dueSigns} sign${dueSigns === 1 ? "" : "s"} to review` : "Your personal vocabulary"}
          tone="bg-sky-50 text-sky-600"
          badge={dueSigns ? String(dueSigns > 99 ? "99+" : dueSigns) : undefined}
        />
      </div>

      {/* ===== Recommended ===== */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-800">Recommended for you</h2>
            <p className="text-xs text-slate-500">Picked from your goals and progress</p>
          </div>
          <Link
            href="/learning-materials"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recommended.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No courses yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {recommended.map((course) => (
              <Link
                key={course.id}
                href={`/learning-materials/${course.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <Image
                    src={course.thumbnailUrl || CARD_IMAGE_FALLBACK}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B7077] backdrop-blur">
                    {course.category}
                  </span>
                  {course.progress >= 100 && (
                    <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Done
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-800 group-hover:text-[#0B7077]">
                    {course.title}
                  </h3>
                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {course.durationMinutes ? `${course.durationMinutes} min` : "Self-paced"}
                      </span>
                      <span className="font-semibold text-teal-600">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077]"
                        style={{ width: `${Math.min(100, course.progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== Activity + Daily quiz + Review ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2 lg:h-[400px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Recent Activity</h2>
              <p className="text-xs text-slate-500">Your latest learning moments</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-500">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="font-semibold text-slate-700">No activity yet</p>
              <p className="max-w-xs text-sm text-slate-500">
                Open a learning material or take a quiz — your progress will show up here.
              </p>
            </div>
          ) : (
            <ol className="relative min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {recentActivity.map((a, i) => {
                const style = ACTIVITY_STYLE[a.type] ?? ACTIVITY_STYLE.material;
                const Icon = style.icon;
                return (
                  <li key={a.id} className="relative flex gap-4 rounded-2xl p-2 transition-colors hover:bg-slate-50">
                    {i < recentActivity.length - 1 && (
                      <span className="absolute left-[27px] top-12 h-[calc(100%-2rem)] w-px bg-slate-100" />
                    )}
                    <div className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", style.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-500">
                        {style.label}
                        {a.durationSeconds > 0 && ` · ${Math.max(1, Math.round(a.durationSeconds / 60))} min`}
                      </p>
                    </div>
                    <span className="shrink-0 py-0.5 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:h-[400px]">
          {/* Daily quiz */}
          <Link
            href={dailyQuiz ? `/quizzes/${dailyQuiz.id}` : "/quizzes"}
            className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#6632FF] to-[#8B5CF6] p-6 text-white shadow-lg shadow-violet-900/15"
          >
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#FFC619]/40 blur-xl" />
            <div className="absolute -bottom-10 right-6 font-heading text-[140px] font-black leading-none text-white/10 transition-transform duration-500 group-hover:-rotate-12">
              ?
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> Daily Quiz
              </span>
              <h3 className="mt-3 font-heading text-xl font-bold leading-snug">
                {dailyQuiz?.title ?? "Pick a quiz for today"}
              </h3>
              <p className="mt-1 text-sm text-white/75">Do the daily quiz to gain extra coins!</p>
            </div>
            <span className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6632FF] transition-transform group-hover:scale-[1.03]">
              Take the quiz <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Review My Signs */}
          <Link
            href="/my-signs"
            className="group flex items-center gap-4 rounded-3xl bg-gradient-to-r from-[#C5FBF9] to-[#FDF5BF] p-5 shadow-sm ring-1 ring-teal-100 transition-shadow hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">
                {dueSigns ? `${dueSigns} sign${dueSigns === 1 ? "" : "s"} due for review` : "All signs reviewed"}
              </p>
              <p className="text-xs text-slate-600">
                {vocab ? `${vocab.stats.mastered} mastered · ${vocab.stats.total} total` : "Open My Signs"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
