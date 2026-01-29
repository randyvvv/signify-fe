"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Sample quiz data
const quizzes = [
  {
    id: 1,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 2,
    title: "Job Interview Phrases",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 3,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 4,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 5,
    title: "Job Interview Phrases",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 6,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 7,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 8,
    title: "Job Interview Phrases",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
  {
    id: 9,
    title: "Scientific & Technical Terms",
    description: "Practice less-common academic & technical vocabulary through quick quizzes.",
    thumbnail: "/learning-materials/vocational.png",
    likes: 743,
    level: "BEGINNER",
    levelColor: "bg-yellow-100 text-yellow-700 border border-yellow-600",
    category: "VOCATIONAL",
    categoryColor: "bg-purple-100 text-purple-600 border border-purple-600",
  },
];

const subjectFilters = [
  { name: "K-12", count: 3844 },
  { name: "Vocational", count: 3844 },
  { name: "University", count: 3844 },
  { name: "Career", count: 3844 },
  { name: "Sign Language", count: 3844 },
];

const levelFilters = [
  { name: "Beginner", count: 3844 },
  { name: "Intermediate", count: 3844 },
  { name: "Expert", count: 3844 },
];

// Quiz Card Component
function QuizCard({ quiz }: { quiz: typeof quizzes[0] }) {
  return (
    <div
      className="group rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 shadow-sm flex flex-col"
      style={{ backgroundColor: "#F8F8FF" }}
    >
      {/* Card content wrapper with padding */}
      <div className="p-3 pb-2">
        {/* Thumbnail with rounded corners */}
        <div className="relative h-[120px] w-full overflow-hidden rounded-xl">
          <Image
            src={quiz.thumbnail}
            alt={quiz.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pt-2 flex-1 flex flex-col">
        {/* Likes count */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Image src="/quizzes/like-filled.png" alt="" width={14} height={14} />
          <span>{quiz.likes.toLocaleString()} likes</span>
        </div>

        {/* Category badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quiz.levelColor}`}
          >
            {quiz.level}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${quiz.categoryColor}`}
          >
            {quiz.category === "VOCATIONAL" && (
              <Image src="/quizzes/quill.png" alt="" width={12} height={12} />
            )}
            {quiz.category === "CAREER" && (
              <Image src="/quizzes/career-icon.png" alt="" width={12} height={12} />
            )}
            {quiz.category === "K-12" && (
              <Image src="/quizzes/pencil-ruler.png" alt="" width={12} height={12} />
            )}
            {quiz.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-quaternary transition-colors mb-1">
          {quiz.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
          {quiz.description}
        </p>

        {/* Start Quiz Button */}
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [showMoreSubjects, setShowMoreSubjects] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };

  // Filter quizzes based on search query and selected filters
  const filteredQuizzes = quizzes.filter((quiz) => {
    // Search filter
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Subject filter
    const categoryToSubject: Record<string, string> = {
      VOCATIONAL: "Vocational",
      CAREER: "Career",
      "K-12": "K-12",
    };
    const quizSubject = categoryToSubject[quiz.category] || quiz.category;
    const matchesSubject =
      selectedSubjects.length === 0 || selectedSubjects.includes(quizSubject);

    // Level filter
    const levelToFilter: Record<string, string> = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      EXPERT: "Expert",
    };
    const quizLevel = levelToFilter[quiz.level] || quiz.level;
    const matchesLevel =
      selectedLevels.length === 0 || selectedLevels.includes(quizLevel);

    return matchesSearch && matchesSubject && matchesLevel;
  });

  // Get popular quizzes (first 3)
  const popularQuizzes = quizzes.slice(0, 3);

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

        {/* Search Bar, Filters, and Quiz List Container */}
        <div className="bg-white shadow-sm flex flex-col min-h-[calc(100vh-180px)]">
          {/* Search Bar - Sticky */}
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

          {/* Main Content Area */}
          <div className="flex gap-6 px-6 pb-6">
            {/* Quizzes Grid */}
            <div className="flex-1">
              {/* Popular Quizzes Section */}
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                Popular Quizzes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {popularQuizzes.map((quiz) => (
                  <QuizCard key={`popular-${quiz.id}`} quiz={quiz} />
                ))}
              </div>

              {/* All Results Section */}
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                All results
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQuizzes.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-lg">No quizzes found</p>
                    <p className="text-sm">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  filteredQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))
                )}
              </div>
            </div>

            {/* Filter Sidebar */}
            <div className="hidden lg:block w-64 shrink-0">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#F8F8FF" }}
              >
                <h3 className="font-heading text-base font-semibold text-gray-900 mb-4">
                  Filter by
                </h3>

                {/* Subject Filter */}
                <div
                  className="mb-4 rounded-lg p-3"
                  style={{ backgroundColor: "#F0F1FF" }}
                >
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

                {/* Level Filter */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: "#F0F1FF" }}
                >
                  <h4 className="font-heading text-sm font-semibold text-gray-900 mb-3">
                    Level
                  </h4>
                  <div className="space-y-2">
                    {levelFilters.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(filter.name)}
                          onChange={() => toggleLevel(filter.name)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
