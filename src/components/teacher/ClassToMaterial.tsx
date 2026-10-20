"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ListChecks, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { MATERIAL_CATEGORIES, teacherApi, type MaterialCategory } from "@/lib/teacher";
import { cn } from "@/lib/utils";

// Transkrip sesingkat ini belum cukup untuk artikel (sama dengan batas server).
const MIN_SENTENCES = 3;

/**
 * Transkrip Kelas Live -> artikel belajar + kuis (Gemini). Setelah dibuat,
 * tampil link ke materi & kuisnya.
 */
export function ClassToMaterial({
  code,
  segmentCount,
  materialId,
  quizId,
  className,
}: {
  code: string;
  segmentCount: number;
  materialId: string | null;
  quizId: string | null;
  className?: string;
}) {
  const [category, setCategory] = useState<MaterialCategory>("K-12");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ materialId: string; quizId: string | null } | null>(
    materialId ? { materialId, quizId } : null,
  );

  if (result) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Link
          href={`/learning-materials/${result.materialId}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-50 px-3 text-xs font-semibold text-[#0B7077] ring-1 ring-teal-100 transition-colors hover:bg-teal-100"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden /> Open article
        </Link>
        {result.quizId && (
          <Link
            href={`/quizzes/${result.quizId}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-50 px-3 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 transition-colors hover:bg-violet-100"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden /> Open quiz
          </Link>
        )}
      </div>
    );
  }

  if (segmentCount < MIN_SENTENCES) {
    return <p className={cn("text-xs text-slate-400", className)}>Transcript too short to turn into material.</p>;
  }

  const generate = async () => {
    setBusy(true);
    try {
      const res = await teacherApi.classToMaterial(code, category);
      setResult({ materialId: res.materialId, quizId: res.quizId });
      toast.success("Material and quiz created", { description: `${res.title} · ${res.questions} questions` });
    } catch (err) {
      toast.error("Gagal membuat materi", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <label htmlFor={`category-${code}`} className="sr-only">
        Category
      </label>
      <select
        id={`category-${code}`}
        value={category}
        onChange={(e) => setCategory(e.target.value as MaterialCategory)}
        disabled={busy}
        className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#2DA5A2] focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
      >
        {MATERIAL_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FD661F] to-[#DF5D73] px-3 text-xs font-semibold text-white shadow-sm transition-opacity disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
        {busy ? "Writing article & quiz… (~30 s)" : "Turn into material"}
      </button>
    </div>
  );
}
