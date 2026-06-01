"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  likesCount: number;
}

const LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"] as const;

const LEVEL_STYLE = "bg-yellow-100 text-yellow-700 border border-yellow-600";
const CATEGORY_STYLE = "bg-purple-100 text-purple-600 border border-purple-600";

function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <div
      className="group rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 shadow-sm flex flex-col"
      style={{ backgroundColor: "#F8F8FF" }}
    >
      <div className="p-3 pb-2">
        <div className="relative h-[120px] w-full overflow-hidden rounded-xl">
          <Image
            src={quiz.thumbnailUrl || "/learning-materials/vocational.png"}
            alt={quiz.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      <div className="p-3 pt-2 flex-1 flex flex-col">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Image src="/quizzes/like-filled.png" alt="" width={14} height={14} />
          <span>{quiz.likesCount.toLocaleString()} likes</span>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_STYLE}`}
          >
            {quiz.level}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLE}`}
          >
            {quiz.category}
          </span>
        </div>

        <h3 className="font-heading text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-quaternary transition-colors mb-1">
          {quiz.title}
        </h3>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
          {quiz.description}
        </p>

        <Link
          href={`/quizzes/${quiz.id}`}
          className="w-full py-2 rounded-full text-center text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#00B8A9" }}
        >
          Start Quiz
        </Link>
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [popular, setPopular] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Quiz[]>("/api/quizzes/popular").then(setPopular).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedLevel) params.set("level", selectedLevel);
      api
        .get<Quiz[]>(`/api/quizzes?${params.toString()}`)
        .then(setQuizzes)
        .catch(() => setQuizzes([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedLevel]);

  const toggleLevel = (level: string) =>
    setSelectedLevel((prev) => (prev === level ? null : level));

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
            <h1 className="text-xl font-bold">Quizzes</h1>
            <p className="text-sm text-grey">
              Practice to test your sign language skills and gain coins
            </p>
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
                placeholder="What topic you want to practice today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-body placeholder:text-gray-400 focus:border-quinary focus:outline-none focus:ring-2 focus:ring-quinary/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex gap-6 px-6 pb-6">
            <div className="flex-1">
              {/* Popular */}
              {popular.length > 0 && (
                <>
                  <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                    Popular Quizzes
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    {popular.map((quiz) => (
                      <QuizCard key={`popular-${quiz.id}`} quiz={quiz} />
                    ))}
                  </div>
                </>
              )}

              {/* All */}
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                All results
              </h2>
              {loading ? (
                <div className="py-12 text-center text-gray-400">Loading...</div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No quizzes found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
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
                <div className="rounded-lg p-3" style={{ backgroundColor: "#F0F1FF" }}>
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Level
                  </h4>
                  <div className="space-y-2">
                    {LEVELS.map((level) => (
                      <label
                        key={level}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLevel === level}
                          onChange={() => toggleLevel(level)}
                          className="h-4 w-4 rounded border-gray-300 text-quinary focus:ring-quinary/50"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-quaternary transition-colors capitalize">
                          {level.toLowerCase()}
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
