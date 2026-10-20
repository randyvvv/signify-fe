"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Loader2, Users, WifiOff } from "lucide-react";
import { languageLabel, type LiveClass, type LiveStatus } from "@/lib/live-class";
import { cn } from "@/lib/utils";
import type { Connection } from "./useLiveClassSocket";

export function StatusChip({ status, broadcasting }: { status: LiveStatus; broadcasting: boolean }) {
  const view =
    status === "ended"
      ? { label: "Ended", tone: "bg-white/20 text-white" }
      : broadcasting
        ? { label: "Live", tone: "bg-[#FD661F] text-white" }
        : status === "live"
          ? { label: "Paused", tone: "bg-[#FFE75C] text-[#5A4A00]" }
          : { label: "Waiting", tone: "bg-white/20 text-white" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", view.tone)}>
      {broadcasting && status !== "ended" && <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />}
      {view.label}
    </span>
  );
}

/** Header gradasi halaman kelas (gaya sama dengan Live Translator). */
export function ClassHeader({
  cls,
  status,
  broadcasting,
  viewers,
  children,
}: {
  cls: LiveClass;
  status: LiveStatus;
  broadcasting: boolean;
  viewers: number;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:px-8">
      <div
        className="absolute inset-0 opacity-15 mix-blend-overlay"
        style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
      />
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/live-class"
            aria-label="Back to Live Class"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={status} broadcasting={broadcasting} />
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white/80">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {viewers} watching
              </span>
            </div>
            <h1 className="mt-1.5 truncate font-heading text-2xl font-bold md:text-3xl">{cls.title}</h1>
            <p className="text-sm text-white/80">
              {cls.teacherName ? `${cls.teacherName} · ` : ""}
              {languageLabel(cls)}
            </p>
          </div>
        </div>
        {children && <div className="md:ml-auto">{children}</div>}
      </div>
    </div>
  );
}

export function ConnectionNotice({ connection }: { connection: Connection }) {
  if (connection === "open") return null;
  const view =
    connection === "connecting"
      ? { icon: Loader2, text: "Connecting to the class…", spin: true }
      : connection === "reconnecting"
        ? { icon: Loader2, text: "Connection lost. Reconnecting…", spin: true }
        : { icon: WifiOff, text: "Disconnected from the class. Refresh the page to reconnect.", spin: false };
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100">
      <view.icon className={cn("h-4 w-4 shrink-0", view.spin && "animate-spin")} aria-hidden />
      {view.text}
    </div>
  );
}

export function FatalState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold text-slate-800">{message}</p>
      <Link
        href="/live-class"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 text-sm font-semibold text-white shadow-md shadow-teal-900/10"
      >
        Back to Live Class
      </Link>
    </div>
  );
}
