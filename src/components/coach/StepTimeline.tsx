"use client";

import { useState } from "react";
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  Captions,
  Check,
  ChevronDown,
  Hand,
  Library,
  ListChecks,
  Loader2,
  Search,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignaAvatar } from "./SignaAvatar";
import type { CoachStep } from "./types";

const TOOL_ICON: Record<string, LucideIcon> = {
  get_learner_profile: UserRound,
  search_materials: Search,
  get_material_content: BookOpen,
  get_video_transcript: Captions,
  create_sign_quiz: ListChecks,
  add_signs_to_vocabulary: BookMarked,
  demonstrate_signs: Hand,
  recommend_materials: Library,
  show_study_plan: CalendarDays,
};

/** Timeline langkah tool agent. Otomatis ringkas setelah selesai (bisa dibuka). */
export function StepTimeline({ steps, running }: { steps: CoachStep[]; running: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (steps.length === 0) return null;

  const open = running || expanded;
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={running}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-500"
      >
        <SignaAvatar className="h-5 w-5 ring-1" />
        <span className="flex-1">
          {running ? "Signa is working on it…" : `Signa used ${doneCount} tool${doneCount === 1 ? "" : "s"}`}
        </span>
        {running && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6632FF]" />}
        {!running && (
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open && (
        <ol className="space-y-1 px-3 pb-3">
          {steps.map((step) => {
            const Icon = TOOL_ICON[step.tool] ?? Sparkles;
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    step.status === "error"
                      ? "bg-rose-50 text-rose-500"
                      : "bg-violet-50 text-[#6632FF]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{step.label}</p>
                  {step.summary && (
                    <p className="truncate text-xs text-slate-500">{step.summary}</p>
                  )}
                </div>
                <span className="mt-1 shrink-0">
                  {step.status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : step.status === "done" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-rose-500" />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
