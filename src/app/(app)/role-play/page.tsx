"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  Coffee,
  Hand,
  MessagesSquare,
  Stethoscope,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { RolePlaySession } from "@/components/roleplay/RolePlaySession";
import { useCachedGet } from "@/lib/cache";
import type { RolePlayLang, RolePlayScenario } from "@/lib/roleplay";
import { cn } from "@/lib/utils";

const ICONS: Record<RolePlayScenario["icon"], { icon: LucideIcon; tone: string }> = {
  coffee: { icon: Coffee, tone: "bg-amber-100 text-amber-700" },
  briefcase: { icon: Briefcase, tone: "bg-sky-100 text-sky-700" },
  users: { icon: Users, tone: "bg-violet-100 text-violet-700" },
  stethoscope: { icon: Stethoscope, tone: "bg-rose-100 text-rose-600" },
};

const LANGS: { value: RolePlayLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
];

const STEPS = [
  { icon: Volume2, title: "Signa starts", text: "Signa says and signs a line, like a real person in that situation." },
  { icon: MessagesSquare, title: "Pick your reply", text: "Choose a suggested reply or write your own, and watch how to sign it." },
  { icon: Hand, title: "Sign it", text: "Sign to your camera, get a score, and Signa answers what you said." },
];

export default function RolePlayPage() {
  const { data: scenarios, error } = useCachedGet<RolePlayScenario[]>("/api/roleplay/scenarios", "roleplay-scenarios");
  const [lang, setLang] = useState<RolePlayLang>("en");
  const [active, setActive] = useState<RolePlayScenario | null>(null);
  const [run, setRun] = useState(0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:px-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex items-center gap-4">
          {active ? (
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Back to situations"
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
            <h1 className="font-heading text-2xl font-bold md:text-3xl">
              {active ? active.title[lang] : "Role Play with Signa"}
            </h1>
            <p className="text-sm text-white/80">
              {active ? active.description[lang] : "Practice real conversations in sign language"}
            </p>
          </div>
        </div>
      </div>

      {active ? (
        <RolePlaySession
          key={`${active.id}-${run}`}
          scenario={active}
          lang={lang}
          onExit={() => setActive(null)}
          onRestart={() => setRun((r) => r + 1)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-xl font-bold text-slate-800">Choose a situation</h2>
            <div role="radiogroup" aria-label="Conversation language" className="inline-flex self-start rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
              {LANGS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  role="radio"
                  aria-checked={lang === l.value}
                  onClick={() => setLang(l.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                    lang === l.value ? "bg-[#0B7077] text-white" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
              Couldn&apos;t load the situations. Refresh the page to try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {scenarios
                ? scenarios.map((s) => {
                    const { icon: Icon, tone } = ICONS[s.icon] ?? ICONS.users;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActive(s)}
                        className="group flex flex-col rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-[#2DA5A2]/40"
                      >
                        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tone)}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className="mt-4 font-heading text-lg font-bold text-slate-800">{s.title[lang]}</span>
                        <span className="mt-1 flex-1 text-sm text-slate-500">{s.description[lang]}</span>
                        <span className="mt-5 flex items-center justify-between text-sm">
                          <span className="text-slate-400">{s.turns} replies</span>
                          <span className="flex items-center gap-1 font-semibold text-[#0B7077]">
                            Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </span>
                      </button>
                    );
                  })
                : Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-[220px] animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />
                  ))}
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-heading text-lg font-bold text-slate-800">How it works</h2>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F3F2] text-[#0B7077]">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {i + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
