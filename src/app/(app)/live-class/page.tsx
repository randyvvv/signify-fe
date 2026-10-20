"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, GraduationCap, Loader2, Plus, Radio, Settings } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  LIVE_LANGUAGES,
  languageLabel,
  liveApi,
  normalizeClassCode,
  type LiveClass,
} from "@/lib/live-class";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15";

const STATUS_STYLE: Record<LiveClass["status"], { label: string; tone: string }> = {
  waiting: { label: "Not started", tone: "bg-slate-100 text-slate-600" },
  live: { label: "Live", tone: "bg-orange-50 text-[#FD661F]" },
  ended: { label: "Ended", tone: "bg-slate-100 text-slate-500" },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

function JoinCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const normalized = normalizeClassCode(code);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (normalized.length === 6) router.push(`/live-class/${normalized}`);
      }}
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0B7077]">
          <Radio className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-800">Join a class</h2>
          <p className="text-sm text-slate-500">Enter the 6-character code from your teacher.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="class-code" className="sr-only">
          Class code
        </label>
        <input
          id="class-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="e.g. K7P2QX"
          autoComplete="off"
          className={cn(inputClass, "font-mono text-lg tracking-[0.3em] uppercase")}
        />
        <button
          type="submit"
          disabled={normalized.length !== 6}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 text-sm font-semibold text-white shadow-md shadow-teal-900/10 transition-opacity disabled:opacity-50"
        >
          Join <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

function CreateCard({ onCreated }: { onCreated: (cls: LiveClass) => void }) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState(0);
  const [saving, setSaving] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { spokenLanguage, signedLanguage } = LIVE_LANGUAGES[language]!;
      onCreated(await liveApi.create({ title: title.trim(), spokenLanguage, signedLanguage }));
    } catch (err) {
      toast.error("Gagal membuat kelas", { description: err instanceof ApiError ? err.message : undefined });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={create} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FD661F]">
          <Plus className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-800">Start a new class</h2>
          <p className="text-sm text-slate-500">Students get live captions and a signing avatar.</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="class-title" className="text-sm font-semibold text-slate-700">
            Class title
          </label>
          <input
            id="class-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Biology: How plants grow"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="class-language" className="text-sm font-semibold text-slate-700">
            Language
          </label>
          <select
            id="class-language"
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}
            className={inputClass}
          >
            {LIVE_LANGUAGES.map((l, i) => (
              <option key={l.label} value={i}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Your speech is transcribed in this language. BISINDO signs are limited to words in the Signify
            dictionary.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD661F] to-[#DF5D73] text-sm font-semibold text-white shadow-md shadow-orange-900/10 transition-opacity disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? "Creating…" : "Create class"}
        </button>
      </div>
    </form>
  );
}

function MyClasses({ classes }: { classes: LiveClass[] | null }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="font-heading text-lg font-bold text-slate-800">Your classes</h2>
      {classes === null ? (
        <div className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No classes yet. Create one to get a join code.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {classes.map((cls) => (
            <li key={cls.id}>
              <Link
                href={`/live-class/${cls.code}`}
                className="group flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="w-24 shrink-0 font-mono text-sm font-bold tracking-widest text-[#0B7077]">
                  {cls.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{cls.title}</span>
                  <span className="block text-xs text-slate-500">
                    {languageLabel(cls)} · {formatDate(cls.createdAt)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    STATUS_STYLE[cls.status].tone,
                  )}
                >
                  {STATUS_STYLE[cls.status].label}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#0B7077]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LiveClassPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [classes, setClasses] = useState<LiveClass[] | null>(null);

  useEffect(() => {
    if (!isTeacher) return;
    liveApi
      .myClasses()
      .then(setClasses)
      .catch(() => {
        setClasses([]);
        toast.error("Gagal memuat daftar kelas");
      });
  }, [isTeacher]);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:px-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold md:text-3xl">Live Class</h1>
            <p className="text-sm text-white/80">
              The teacher speaks, and every student gets live captions and a signing avatar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <JoinCard />
        {isTeacher ? (
          <CreateCard onCreated={(cls) => router.push(`/live-class/${cls.code}`)} />
        ) : (
          <div className="flex flex-col justify-between gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-800">Teaching a class?</h2>
                <p className="text-sm text-slate-500">
                  Turn on Teacher Mode to create classes and broadcast your voice.
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl px-5 text-sm font-semibold text-[#0B7077] ring-1 ring-teal-200 transition-colors hover:bg-teal-50"
            >
              <Settings className="h-4 w-4" aria-hidden /> Open Settings
            </Link>
          </div>
        )}
      </div>

      {isTeacher && <MyClasses classes={classes} />}
    </div>
  );
}
