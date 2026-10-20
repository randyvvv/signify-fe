"use client";

import { useEffect, useRef } from "react";
import { Captions, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { formatOffset, transcriptText, type LiveClass, type LiveSegment } from "@/lib/live-class";
import { cn } from "@/lib/utils";

/**
 * Transkrip kelas: kalimat final + teks yang masih diucapkan. Otomatis menggulir
 * ke bawah selama pengguna tidak sedang membaca bagian atas.
 */
export function TranscriptPanel({
  cls,
  segments,
  partial,
  activeSeq,
  emptyText,
  className,
}: {
  cls: Pick<LiveClass, "title" | "code">;
  segments: LiveSegment[];
  partial?: string;
  /** Kalimat yang sedang diperagakan avatar. */
  activeSeq?: number | null;
  emptyText: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [segments.length, partial]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText(cls, segments));
      toast.success("Transcript copied");
    } catch {
      toast.error("Gagal menyalin transkrip");
    }
  };

  const download = () => {
    const blob = new Blob([transcriptText(cls, segments)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signify-live-class-${cls.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex min-h-0 flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-100", className)}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#0B7077]">
          <Captions className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-bold text-slate-800">Transcript</h2>
          <p className="text-xs text-slate-500">
            {segments.length} sentence{segments.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={!segments.length}
          aria-label="Copy transcript"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B7077] disabled:opacity-40"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!segments.length}
          aria-label="Download transcript"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B7077] disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3"
      >
        {segments.length === 0 && !partial ? (
          <p className="px-2 py-10 text-center text-sm text-slate-400">{emptyText}</p>
        ) : (
          segments.map((s) => (
            <div
              key={s.seq}
              className={cn(
                "flex gap-3 rounded-2xl px-3 py-2 transition-colors",
                s.seq === activeSeq ? "bg-teal-50 ring-1 ring-teal-100" : "hover:bg-slate-50",
              )}
            >
              <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-slate-400">
                {formatOffset(s.offsetMs)}
              </span>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  s.seq === activeSeq ? "font-semibold text-[#0F5A5A]" : "text-slate-700",
                )}
              >
                {s.text}
              </p>
            </div>
          ))
        )}
        {partial && (
          <div className="flex gap-3 px-3 py-2">
            <span className="mt-1.5 flex w-12 shrink-0 justify-start">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FD661F]" aria-hidden />
            </span>
            <p className="text-sm italic leading-relaxed text-slate-500">{partial}</p>
          </div>
        )}
      </div>
    </div>
  );
}
