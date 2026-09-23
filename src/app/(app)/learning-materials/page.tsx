"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Globe,
  Languages,
  PlayCircle,
  Search,
  SearchX,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  type: "video" | "document" | "article";
  category: string;
  language: string;
  durationMinutes: number | null;
  pages: number | null;
  progress: number;
}

interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Facet {
  name: string;
  count: number;
}

type TypeFilter = "all" | Material["type"];

const IMAGE_FALLBACK = "/learning-materials/image-not-found.png";

const CATEGORY_STYLE: Record<string, string> = {
  VOCATIONAL: "bg-purple-100 text-purple-700",
  CAREER: "bg-teal-100 text-teal-700",
  "K-12": "bg-pink-100 text-pink-700",
  UNIVERSITY: "bg-blue-100 text-blue-700",
  "SIGN LANGUAGE": "bg-amber-100 text-amber-700",
};

function categoryStyle(cat: string) {
  return CATEGORY_STYLE[cat.toUpperCase()] ?? "bg-indigo-100 text-indigo-700";
}

const TYPE_META: Record<Material["type"], { icon: LucideIcon; label: string }> = {
  video: { icon: Video, label: "Video" },
  article: { icon: Globe, label: "Article" },
  document: { icon: FileText, label: "Document" },
};

const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

function metaLabel(m: Material) {
  if (m.type === "document") return `${m.pages ?? "?"} pages`;
  if (m.type === "article") return `${m.durationMinutes ?? "?"} min read`;
  return `${m.durationMinutes ?? "?"} min`;
}

function MaterialCard({ material }: { material: Material }) {
  const type = TYPE_META[material.type];
  const done = material.progress >= 100;
  return (
    <Link
      href={`/learning-materials/${material.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-teal-200"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <Image
          src={material.thumbnailUrl || IMAGE_FALLBACK}
          alt={material.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          <type.icon className="h-3.5 w-3.5 text-[#0B7077]" />
          {type.label}
        </span>
        {done && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        )}
        {material.type === "video" && (
          <PlayCircle className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-75 text-white opacity-0 drop-shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("rounded-full px-2.5 py-0.5 font-semibold", categoryStyle(material.category))}>
            {material.category}
          </span>
          <span className="text-slate-500">{metaLabel(material)}</span>
          <span className="ml-auto font-semibold uppercase text-slate-400">{material.language}</span>
        </div>
        <h3 className="line-clamp-2 font-heading font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#0B7077]">
          {material.title}
        </h3>
        <div className="mt-auto space-y-1.5 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">
              {done ? "Completed" : material.progress > 0 ? "In progress" : "Not started"}
            </span>
            <span className="font-semibold text-[#0B7077]">{material.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full",
                done ? "bg-emerald-500" : "bg-gradient-to-r from-[#2DA5A2] to-[#0B7077]",
              )}
              style={{ width: `${Math.min(100, material.progress)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100">
      <div className="aspect-video animate-pulse bg-slate-200/70" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}

export default function LearningMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Facet[]>([]);
  const [languages, setLanguages] = useState<Facet[]>([]);

  // Facets (sekali saat mount).
  useEffect(() => {
    api.get<Facet[]>("/api/materials/categories").then(setCategories).catch(() => {});
    api.get<Facet[]>("/api/materials/languages").then(setLanguages).catch(() => {});
  }, []);

  // List + filter (debounce untuk search).
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedSubject) params.set("category", selectedSubject);
      if (selectedLanguage) params.set("language", selectedLanguage);
      params.set("limit", "24");
      api
        .get<Paginated<Material>>(`/api/materials?${params.toString()}`)
        .then((res) => {
          setItems(res.items);
          setTotal(res.total);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedSubject, selectedLanguage]);

  const hasFilters =
    !!searchQuery.trim() || !!selectedSubject || !!selectedLanguage || typeFilter !== "all";
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSubject(null);
    setSelectedLanguage(null);
    setTypeFilter("all");
  };

  // Filter tipe dilakukan di sisi klien (API belum punya parameter tipe).
  const visible = typeFilter === "all" ? items : items.filter((m) => m.type === typeFilter);
  const inProgress = hasFilters ? [] : items.filter((m) => m.progress > 0 && m.progress < 100).slice(0, 3);
  const totalMaterials = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Hero + search ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">Learning Materials</h1>
              <p className="text-sm text-white/80">
                {totalMaterials
                  ? `${totalMaterials} accessible lessons — videos, articles and documents`
                  : "Broaden your knowledge"}
              </p>
            </div>
          </div>
          <div className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="What do you want to learn today?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full rounded-2xl bg-white pl-14 pr-12 text-sm text-slate-800 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setSelectedSubject(null)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              !selectedSubject ? "bg-[#0B7077] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            All subjects
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedSubject((prev) => (prev === c.name ? null : c.name))}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                selectedSubject === c.name
                  ? "bg-[#0B7077] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {c.name}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  selectedSubject === c.name ? "bg-white/20" : "bg-white text-slate-500",
                )}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
            {(["all", "video", "article", "document"] as const).map((t) => {
              const Icon = t === "all" ? BookOpen : TYPE_META[t].icon;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold capitalize transition-all",
                    typeFilter === t ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t === "all" ? "All" : TYPE_META[t].label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:ml-auto sm:w-56">
            <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedLanguage ?? ""}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-[#2DA5A2] focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
            >
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l.name} value={l.name}>
                  {LANGUAGE_LABEL[l.name] ?? l.name.toUpperCase()} ({l.count})
                </option>
              ))}
            </select>
            <ChevronLeft className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 -rotate-90 text-slate-400" />
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm font-semibold text-[#DF5D73] hover:underline"
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ===== Continue learning ===== */}
      {!loading && inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-bold text-slate-800">Continue where you left off</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {inProgress.map((m) => (
              <Link
                key={m.id}
                href={`/learning-materials/${m.id}`}
                className="group flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-teal-200"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={m.thumbnailUrl || IMAGE_FALLBACK} alt="" fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800">{m.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077]"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#0B7077]">{m.progress}%</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-500" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Results ===== */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-bold text-slate-800">
            {hasFilters ? "Results" : "All materials"}
          </h2>
          {!loading && (
            <span className="text-sm text-slate-500">
              {typeFilter === "all" ? total : visible.length} material
              {(typeFilter === "all" ? total : visible.length) === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <SearchX className="h-8 w-8" />
            </div>
            <p className="font-heading text-lg font-bold text-slate-700">No materials found</p>
            <p className="max-w-sm text-sm text-slate-500">
              Try another keyword or remove some filters.
            </p>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
