"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  Hand,
  ListChecks,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import type { CoachCard } from "./types";

const IMAGE_FALLBACK = "/learning-materials/image-not-found.png";
const CARD = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100";

const TASK_META: Record<string, { icon: LucideIcon; tone: string }> = {
  material: { icon: BookOpen, tone: "bg-teal-50 text-teal-600" },
  quiz: { icon: ListChecks, tone: "bg-violet-50 text-violet-600" },
  practice: { icon: Hand, tone: "bg-orange-50 text-orange-500" },
  review: { icon: BookMarked, tone: "bg-sky-50 text-sky-600" },
};

function CardHeader({ icon: Icon, title, tone }: { icon: LucideIcon; title: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-heading text-sm font-bold text-slate-800">{title}</p>
    </div>
  );
}

function PlanCard({ card }: { card: Extract<CoachCard, { type: "plan" }> }) {
  return (
    <div className={CARD}>
      <CardHeader icon={CalendarDays} title={card.title} tone="bg-teal-50 text-[#0B7077]" />
      {card.summary && <p className="px-4 pt-3 text-sm text-slate-500">{card.summary}</p>}
      <ol className="space-y-3 p-4">
        {card.days.map((d) => (
          <li key={d.day} className="flex gap-3">
            <div className="flex w-12 shrink-0 flex-col items-center">
              <span className="rounded-lg bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] px-2 py-1 text-[11px] font-bold text-white">
                Day {d.day}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{d.title}</p>
              <ul className="mt-1.5 space-y-1">
                {d.tasks.map((t, i) => {
                  const meta = TASK_META[t.kind] ?? TASK_META.material;
                  const Icon = meta.icon;
                  const inner = (
                    <>
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", meta.tone)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-sm text-slate-600">{t.label}</span>
                      {t.href && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />}
                    </>
                  );
                  return (
                    <li key={i}>
                      {t.href ? (
                        <Link href={t.href} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50">
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 px-1.5 py-1">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuizCard({ card }: { card: Extract<CoachCard, { type: "quiz" }> }) {
  return (
    <Link
      href={`/quizzes/${card.quizId}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#6632FF] to-[#8B5CF6] p-4 text-white shadow-md shadow-violet-900/15"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC619]/40 blur-xl" />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
        <ListChecks className="h-6 w-6" />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Quiz made for you</p>
        <p className="truncate font-heading font-bold">{card.title}</p>
        <p className="text-xs text-white/75">
          {card.questionCount} questions · {card.level.toLowerCase()}
        </p>
      </div>
      <span className="relative flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#6632FF] transition-transform group-hover:scale-105">
        Start <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function VocabularyCard({ card }: { card: Extract<CoachCard, { type: "vocabulary" }> }) {
  return (
    <div className={CARD}>
      <CardHeader icon={BookMarked} title="Added to My Signs" tone="bg-sky-50 text-sky-600" />
      <div className="flex flex-wrap gap-2 p-4">
        {card.words.map((w) => (
          <span key={w} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold capitalize text-sky-700">
            {w}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs">
        <span className="text-slate-500">
          {card.added} new · {card.words.length - card.added} already saved
        </span>
        <Link href="/my-signs" className="flex items-center gap-1 font-semibold text-sky-600 hover:underline">
          Review now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function SignsCard({ card }: { card: Extract<CoachCard, { type: "signs" }> }) {
  const avatar = useEquippedAvatar();
  const [active, setActive] = useState(0);
  const [replay, setReplay] = useState(0);
  const phrase = card.phrases[active] ?? "";

  return (
    <div className={CARD}>
      <CardHeader icon={Hand} title="Watch the signs" tone="bg-orange-50 text-orange-500" />
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-b from-[#C5FBF9]/70 to-[#FDF5BF]/70">
          <SignAvatarViewer
            key={`${active}-${replay}`}
            text={phrase}
            vrmUrl={avatar.vrmUrl}
            hairColor={avatar.hairColor}
            eyeColor={avatar.eyeColor}
            accessory={avatar.accessory}
            className="h-full w-full"
            placeholder=""
          />
          <button
            onClick={() => setReplay((r) => r + 1)}
            aria-label="Replay"
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:text-[#0B7077]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Now signing</p>
          <p className="font-heading text-lg font-bold capitalize text-slate-800">{phrase}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            {card.phrases.map((p, i) => (
              <button
                key={p}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  i === active ? "bg-[#0B7077] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialsCard({ card }: { card: Extract<CoachCard, { type: "materials" }> }) {
  return (
    <div className={CARD}>
      <CardHeader icon={BookOpen} title="Recommended materials" tone="bg-teal-50 text-teal-600" />
      {card.note && <p className="px-4 pt-3 text-sm text-slate-500">{card.note}</p>}
      <div className="space-y-1 p-2">
        {card.items.map((m) => (
          <Link
            key={m.id}
            href={`/learning-materials/${m.id}`}
            className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
          >
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image src={m.thumbnailUrl || IMAGE_FALLBACK} alt="" fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-slate-800 group-hover:text-[#0B7077]">{m.title}</p>
              <p className="text-xs text-slate-500">
                {m.category} · {m.type === "document" ? `${m.pages ?? "?"} pages` : `${m.durationMinutes ?? "?"} min`}
                {m.progress > 0 && ` · ${m.progress}% done`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CoachCardView({ card }: { card: CoachCard }) {
  const view = (() => {
    switch (card.type) {
      case "plan":
        return <PlanCard card={card} />;
      case "quiz":
        return <QuizCard card={card} />;
      case "vocabulary":
        return <VocabularyCard card={card} />;
      case "signs":
        return <SignsCard card={card} />;
      case "materials":
        return <MaterialsCard card={card} />;
      default:
        return (
          <div className={cn(CARD, "flex items-center gap-2 p-4 text-sm text-slate-500")}>
            <Sparkles className="h-4 w-4" /> Result
          </div>
        );
    }
  })();
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{view}</div>;
}
