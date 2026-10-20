"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MarkdownContent } from "@/components/shared/Markdown";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_LANGUAGES,
  parseYouTubeId,
  teacherApi,
  type MaterialCategory,
} from "@/lib/teacher";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15";

const ARTICLE_PLACEHOLDER = `## What is photosynthesis?

Plants use **sunlight**, water and air to make their own food.

## Key words
- **Chlorophyll**: the green part of a leaf that catches sunlight.`;

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function NewMaterialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [type, setType] = useState<"video" | "article">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("K-12");
  const [language, setLanguage] = useState("en");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const videoId = parseYouTubeId(videoUrl);
  const ready =
    title.trim().length > 0 && (type === "video" ? !!videoId : content.trim().length >= 20) && !saving;

  if (user && user.role !== "teacher") {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
        <p className="font-heading text-lg font-bold text-slate-800">Only teacher accounts can add materials</p>
        <Link href="/settings" className="mt-4 inline-block text-sm font-semibold text-[#0B7077] hover:underline">
          Switch to a teacher account in Settings
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fields = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        language,
      };
      const created = await teacherApi.createMaterial(
        type === "video" ? { type, videoUrl: videoUrl.trim(), ...fields } : { type, content: content.trim(), ...fields },
      );
      toast.success("Material published", { description: "Students can find it in Learning Materials." });
      router.push(`/learning-materials/${created.id}`);
    } catch (err) {
      toast.error("Gagal menyimpan materi", { description: err instanceof ApiError ? err.message : undefined });
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/teacher"
          aria-label="Back to Teacher Dashboard"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 transition-colors hover:text-[#0B7077]"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800">Add material</h1>
          <p className="text-sm text-slate-500">
            Published materials appear in Learning Materials with the signing avatar and AI chat.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "video", label: "YouTube video", desc: "Captions become the transcript", icon: Video },
              { value: "article", label: "Article", desc: "Write in Markdown", icon: FileText },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              aria-pressed={type === option.value}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                type === option.value ? "border-[#2DA5A2] bg-teal-50/60" : "border-slate-100 hover:border-slate-200",
              )}
            >
              <option.icon className={cn("h-6 w-6 shrink-0", type === option.value ? "text-[#0B7077]" : "text-slate-400")} aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                <span className="block text-xs text-slate-500">{option.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {type === "video" ? (
          <Field id="video-url" label="YouTube link" hint="Videos with captions get a transcript for the AI chat and signing avatar.">
            <input
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className={cn(inputClass, "h-12")}
            />
            {videoId && (
              /* eslint-disable-next-line @next/next/no-img-element -- thumbnail YouTube */
              <img
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video thumbnail"
                className="mt-3 aspect-video w-full max-w-sm rounded-2xl object-cover ring-1 ring-slate-100"
              />
            )}
            {videoUrl.trim() && !videoId && <p className="text-xs font-medium text-rose-600">That doesn&apos;t look like a YouTube link.</p>}
          </Field>
        ) : (
          <Field id="article-content" label="Article" hint="Markdown: ## for headings, **bold**, - for lists.">
            <div className="mb-2 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {[false, true].map((p) => (
                <button
                  key={String(p)}
                  type="button"
                  onClick={() => setPreview(p)}
                  className={cn("rounded-lg px-3 py-1.5", preview === p ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500")}
                >
                  {p ? "Preview" : "Write"}
                </button>
              ))}
            </div>
            {preview ? (
              <div className="min-h-[280px] rounded-xl border border-slate-200 p-4">
                {content.trim() ? <MarkdownContent content={content} /> : <p className="text-sm text-slate-400">Nothing to preview yet.</p>}
              </div>
            ) : (
              <textarea
                id="article-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder={ARTICLE_PLACEHOLDER}
                className={cn(inputClass, "py-3 font-mono leading-relaxed")}
              />
            )}
          </Field>
        )}

        <Field id="material-title" label="Title">
          <input
            id="material-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            placeholder="e.g. How plants make food"
            className={cn(inputClass, "h-12")}
          />
        </Field>

        <Field id="material-description" label="Short description (optional)">
          <textarea
            id="material-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="What will students learn?"
            className={cn(inputClass, "py-3")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="material-category" label="Category">
            <select
              id="material-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              className={cn(inputClass, "h-12")}
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="material-language" label="Language">
            <select
              id="material-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={cn(inputClass, "h-12")}
            >
              {MATERIAL_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-sm font-semibold text-white shadow-md shadow-teal-900/10 transition-opacity disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? (type === "video" ? "Fetching captions…" : "Publishing…") : "Publish material"}
        </button>
      </form>
    </div>
  );
}
