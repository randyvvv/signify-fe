"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Search, FileText, Globe, Video, Link2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Sample material data
const materials = [
  {
    id: 1,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
  {
    id: 2,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
  {
    id: 3,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
  {
    id: 4,
    title: "Beginner's guide to become a Professional Front-end developer",
    thumbnail: "/learning-materials/career.png",
    pages: 11,
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    progressColor: "bg-emerald-400",
    progress: 50,
  },
  {
    id: 5,
    title: "Beginner's guide to become a Professional Front-end developer",
    thumbnail: "/learning-materials/career.png",
    pages: 11,
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    progressColor: "bg-emerald-400",
    progress: 50,
  },
  {
    id: 6,
    title: "Beginner's guide to become a Professional Front-end developer",
    thumbnail: "/learning-materials/career.png",
    pages: 11,
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    progressColor: "bg-emerald-400",
    progress: 50,
  },
  {
    id: 7,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/k-12.png",
    duration: "11 min read",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    progressColor: "bg-violet-400",
    progress: 50,
  },
  {
    id: 8,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/k-12.png",
    duration: "11 min read",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    progressColor: "bg-violet-400",
    progress: 50,
  },
  {
    id: 9,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/k-12.png",
    duration: "11 min read",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    progressColor: "bg-violet-400",
    progress: 50,
  },
  {
    id: 10,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
  {
    id: 11,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
  {
    id: 12,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    duration: "11 min",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    progressColor: "bg-teal-400",
    progress: 50,
  },
];

const subjectFilters = [
  { name: "K-12", count: 3844 },
  { name: "Vocational", count: 3844 },
  { name: "University", count: 3844 },
  { name: "Career", count: 3844 },
  { name: "Sign Language", count: 3844 },
];

const languageFilters = [
  { name: "English", count: 3844 },
  { name: "Japanese", count: 3844 },
  { name: "Korean", count: 3844 },
  { name: "Chinese", count: 3844 },
  { name: "Bahasa Indonesia", count: 3844 },
];

export default function LearningMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showMoreSubjects, setShowMoreSubjects] = useState(false);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  // Filter materials based on search query and selected filters
  const filteredMaterials = materials.filter((material) => {
    // Search filter - check if title contains search query
    const matchesSearch = material.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Subject filter - check if category matches any selected subject
    // Map category names to filter names (e.g., "VOCATIONAL" -> "Vocational")
    const categoryToSubject: Record<string, string> = {
      "VOCATIONAL": "Vocational",
      "CAREER": "Career",
      "K-12": "K-12",
    };
    const materialSubject = categoryToSubject[material.category] || material.category;
    const matchesSubject =
      selectedSubjects.length === 0 ||
      selectedSubjects.includes(materialSubject);

    return matchesSearch && matchesSubject;
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Hero Section */}
        <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-quaternary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-quaternary">
              Learning Materials
            </h1>
            <p className="text-sm text-grey">Broaden your knowledge</p>
          </div>
        </div>

        {/* Search Bar, Filters, and Material List Container */}
        <div className="bg-white shadow-sm flex flex-col min-h-[calc(100vh-180px)]">
          {/* Search Bar - Sticky */}
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

          {/* Main Content Area */}
          <div className="flex gap-6 px-6 pb-6">
            {/* Materials Grid */}
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                All results
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMaterials.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-lg">No materials found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                ) : filteredMaterials.map((material) => (
                  <Link
                    key={material.id}
                    href={`/learning-materials/${material.id}`}
                    className="group rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 shadow-sm"
                    style={{ backgroundColor: '#F8F8FF' }}
                  >
                    {/* Card content wrapper with padding */}
                    <div className="p-3 pb-2">
                      {/* Thumbnail with rounded corners */}
                      <div className="relative h-[120px] w-full overflow-hidden rounded-xl">
                        <Image
                          src={material.thumbnail}
                          alt={material.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 pt-2">
                      {/* Meta info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {material.type === "video" ? (
                            <>
                              <Video className="h-3.5 w-3.5" />
                              <span>{material.duration}</span>
                            </>
                          ) : material.type === "article" ? (
                            <>
                              <Globe className="h-3.5 w-3.5" />
                              <span>{material.duration}</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3.5 w-3.5" />
                              <span>{material.pages} pages</span>
                            </>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${material.categoryColor}`}
                        >
                          <Link2 className="h-3 w-3" />
                          {material.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-quaternary transition-colors">
                        {material.title}
                      </h3>
                    </div>

                    {/* Progress bar */}
                    <div className="px-3 pb-3">
                      <div className="h-1.5 w-full flex rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${material.progress}%`, backgroundColor: '#6E62E5' }}
                        />
                        <div className="h-full bg-gray-200 flex-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Filter Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#F8F8FF' }}>
                <h3 className="font-heading text-base font-semibold text-gray-900 mb-4">
                  Filter by
                </h3>

                {/* Subject Filter */}
                <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: '#F0F1FF' }}>
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Subject
                  </h4>
                  <div className="space-y-2">
                    {subjectFilters.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(filter.name)}
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
                  <button
                    onClick={() => setShowMoreSubjects(!showMoreSubjects)}
                    className="text-sm font-medium mt-2 transition-colors underline"
                  >
                    {showMoreSubjects ? "Show less" : "Show 7 more"}
                  </button>
                </div>

                {/* Language Filter */}
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F0F1FF' }}>
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Language
                  </h4>
                  <div className="space-y-2">
                    {languageFilters.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(filter.name)}
                          onChange={() => toggleLanguage(filter.name)}
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
                  <button
                    onClick={() => setShowMoreLanguages(!showMoreLanguages)}
                    className="text-sm font-medium mt-2 transition-colors underline"
                  >
                    {showMoreLanguages ? "Show less" : "Show 7 more"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
