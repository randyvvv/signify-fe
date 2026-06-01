"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Search, FileText, Globe, Video } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

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

const CATEGORY_STYLE: Record<string, string> = {
  VOCATIONAL: "bg-purple-100 text-purple-600 border border-purple-600",
  CAREER: "bg-teal-100 text-teal-600 border border-teal-600",
  "K-12": "bg-pink-100 text-pink-600 border border-pink-600",
  UNIVERSITY: "bg-blue-100 text-blue-600 border border-blue-600",
  "SIGN LANGUAGE": "bg-amber-100 text-amber-700 border border-amber-600",
};

function categoryStyle(cat: string) {
  return (
    CATEGORY_STYLE[cat.toUpperCase()] ??
    "bg-indigo-50 text-indigo-600 border border-indigo-300"
  );
}

export default function LearningMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [items, setItems] = useState<Material[]>([]);
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
        .then((res) => setItems(res.items))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedSubject, selectedLanguage]);

  const toggleSubject = (name: string) =>
    setSelectedSubject((prev) => (prev === name ? null : name));
  const toggleLanguage = (name: string) =>
    setSelectedLanguage((prev) => (prev === name ? null : name));

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Hero Section */}
        <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Learning Materials</h1>
            <p className="text-sm text-grey">Broaden your knowledge</p>
          </div>
        </div>

        <div className="bg-white shadow-sm flex flex-col min-h-[calc(100vh-180px)]">
          {/* Search Bar */}
          <div className="sticky top-0 z-10 bg-white p-6 pb-4 rounded-t-xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="What do you want to learn today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-body placeholder:text-gray-400 focus:border-quinary focus:outline-none focus:ring-2 focus:ring-quinary/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex gap-6 px-6 pb-6">
            {/* Materials Grid */}
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                All results
              </h2>

              {loading ? (
                <div className="py-12 text-center text-gray-400">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No materials found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((material) => (
                    <Link
                      key={material.id}
                      href={`/learning-materials/${material.id}`}
                      className="group rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 shadow-sm"
                      style={{ backgroundColor: "#F8F8FF" }}
                    >
                      <div className="p-3 pb-2">
                        <div className="relative h-[120px] w-full overflow-hidden rounded-xl">
                          <Image
                            src={material.thumbnailUrl || "/learning-materials/vocational.png"}
                            alt={material.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>

                      <div className="p-3 pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {material.type === "video" ? (
                              <>
                                <Video className="h-3.5 w-3.5" />
                                <span>{material.durationMinutes ?? "?"} min</span>
                              </>
                            ) : material.type === "article" ? (
                              <>
                                <Globe className="h-3.5 w-3.5" />
                                <span>{material.durationMinutes ?? "?"} min read</span>
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5" />
                                <span>{material.pages ?? "?"} pages</span>
                              </>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle(
                              material.category,
                            )}`}
                          >
                            {material.category}
                          </span>
                        </div>

                        <h3 className="font-heading text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-quaternary transition-colors">
                          {material.title}
                        </h3>
                      </div>

                      <div className="px-3 pb-3">
                        <div className="h-1.5 w-full flex rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${material.progress}%`,
                              backgroundColor: "#6E62E5",
                            }}
                          />
                          <div className="h-full bg-gray-200 flex-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Sidebar */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F8FF" }}>
                <h3 className="font-heading text-base font-semibold text-gray-900 mb-4">
                  Filter by
                </h3>

                {/* Subject Filter */}
                <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: "#F0F1FF" }}>
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Subject
                  </h4>
                  <div className="space-y-2">
                    {categories.length === 0 && (
                      <p className="text-xs text-gray-400">No categories</p>
                    )}
                    {categories.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubject === filter.name}
                          onChange={() => toggleSubject(filter.name)}
                          className="h-4 w-4 rounded border-gray-300 text-quinary focus:ring-quinary/50"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-quaternary transition-colors">
                          {filter.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          ({filter.count.toLocaleString()})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Language Filter */}
                <div className="rounded-lg p-3" style={{ backgroundColor: "#F0F1FF" }}>
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Language
                  </h4>
                  <div className="space-y-2">
                    {languages.length === 0 && (
                      <p className="text-xs text-gray-400">No languages</p>
                    )}
                    {languages.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLanguage === filter.name}
                          onChange={() => toggleLanguage(filter.name)}
                          className="h-4 w-4 rounded border-gray-300 text-quinary focus:ring-quinary/50"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-quaternary transition-colors uppercase">
                          {filter.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          ({filter.count.toLocaleString()})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
