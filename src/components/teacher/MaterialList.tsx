"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Trash2, Video } from "lucide-react";
import type { TeacherMaterial } from "@/lib/teacher";
import { cn } from "@/lib/utils";

const MATERIAL_IMAGE_FALLBACK = "/learning-materials/image-not-found.png";

export function formatTeacherDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirming) {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 4000);
          return;
        }
        setBusy(true);
        await onConfirm();
        setBusy(false);
      }}
      aria-label="Delete material"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors disabled:opacity-50",
        confirming ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-rose-50 hover:text-rose-600",
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {confirming && "Tap again"}
    </button>
  );
}

/** Daftar materi buatan guru (null = sedang dimuat). */
export function MaterialList({
  materials,
  onDelete,
}: {
  materials: TeacherMaterial[] | null;
  onDelete: (id: string) => Promise<void>;
}) {
  if (materials === null) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }
  if (materials.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No materials yet. Add a YouTube video or an article, or turn a finished live class into one.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {materials.map((m) => (
        <li key={m.id} className="flex items-center gap-4 py-3">
          <Link href={`/learning-materials/${m.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail YouTube/aset lokal */}
            <img
              src={m.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
              alt=""
              className="h-14 w-24 shrink-0 rounded-xl bg-slate-100 object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-800 group-hover:text-[#0B7077]">{m.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                {m.type === "video" ? <Video className="h-3.5 w-3.5" aria-hidden /> : <FileText className="h-3.5 w-3.5" aria-hidden />}
                {m.type === "video" ? "Video" : "Article"} · {m.category}
                {m.durationMinutes ? ` · ${m.durationMinutes} min` : ""} · {formatTeacherDate(m.createdAt)}
              </span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#0B7077]" />
          </Link>
          <DeleteButton onConfirm={() => onDelete(m.id)} />
        </li>
      ))}
    </ul>
  );
}
