"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Sample quiz data
const quizData = {
  id: 1,
  title: "Scientific & Technical Terms",
  description:
    "Test your ability to understand basic mathematical symbols and terms, from algebra to trigonometry, through gesture demonstrations by an AI assistant.",
  totalQuestions: 10,
  currentQuestion: 7,
  accuracy: 78,
  questions: [
    {
      id: 1,
      image: "/quizzes/hand.png",
      question: "What is the correct term for this sign?",
      options: ["Aljabar", "Kalkulus", "Trigonometri", "Geometri"],
      correctAnswer: 0, // Index of correct answer (Aljabar)
    },
  ],
};

// Recommended quizzes data
const recommendedQuizzes = [
  {
    id: 2,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    likes: 11,
    category: "VOCATIONAL",
  },
  {
    id: 3,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    likes: 11,
    category: "VOCATIONAL",
  },
  {
    id: 4,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    likes: 11,
    category: "VOCATIONAL",
  },
  {
    id: 5,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/vocational.png",
    likes: 11,
    category: "VOCATIONAL",
  },
];

export default function QuizPage() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestionData = quizData.questions[0];
  const optionLabels = ["A", "B", "C", "D"];

  const handleSelectAnswer = (index: number) => {
    if (!isSubmitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setIsSubmitted(true);
      setIsCorrect(selectedAnswer === currentQuestionData.correctAnswer);
    }
  };

  const handleClear = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const handleNextQuestion = () => {
    // Reset state for next question
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(null);
    // In a real app, this would load the next question
  };

  const progressPercentage =
    (quizData.currentQuestion / quizData.totalQuestions) * 100;

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
          <Link
            href="/quizzes"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Quizzes</h1>
            <p className="text-sm text-grey">{quizData.title}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[calc(100vh-180px)] ">
          <div className="flex gap-6">
            {/* Left Column - Quiz Content */}
            <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
              {/* Sign Image */}
              <div className="relative w-full max-w-lg mx-auto h-[280px] rounded-2xl overflow-hidden border border-gray-200 mb-6">
                <Image
                  src={currentQuestionData.image}
                  alt="Sign language gesture"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Raleway', sans-serif" }}>
                  {currentQuestionData.question}
                </h2>
                <p className="text-sm text-gray-500">
                  Choose the best answer from these options below
                </p>
              </div>

              {/* Feedback Banner */}
              {isSubmitted && (
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl mb-6 max-w-2xl mx-auto ${isCorrect
                      ? "bg-teal-50 border-2 border-teal-400"
                      : "bg-red-50 border-2 border-red-400"
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${isCorrect ? "bg-teal-500" : "bg-red-500"
                      }`}
                  >
                    {isCorrect ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <X className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${isCorrect ? "text-teal-700" : "text-red-700"
                        }`}
                    >
                      {isCorrect ? "Correct Answer!" : "Wrong Answer"}
                    </p>
                    <p
                      className={`text-sm ${isCorrect ? "text-teal-600" : "text-red-600"
                        }`}
                    >
                      {isCorrect
                        ? `Great job! ${currentQuestionData.options[
                        currentQuestionData.correctAnswer
                        ]
                        } is the correct term for this sign.`
                        : `The correct answer is ${currentQuestionData.options[
                        currentQuestionData.correctAnswer
                        ]
                        }, don't give up!`}
                    </p>
                  </div>
                </div>
              )}

              {/* Answer Options Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentQuestionData.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption =
                    index === currentQuestionData.correctAnswer;
                  const showCorrectHighlight = isSubmitted && isCorrectOption;
                  const showWrongHighlight =
                    isSubmitted && isSelected && !isCorrectOption;

                  let borderColor = "border-gray-200";
                  let bgColor = "bg-white";
                  let textColor = "";
                  let textStyle: { color?: string } = { color: "#6D6263" };

                  if (showCorrectHighlight) {
                    borderColor = "border-teal-500";
                    bgColor = "bg-teal-50";
                    textColor = "text-teal-700";
                    textStyle = {};
                  } else if (showWrongHighlight) {
                    borderColor = "border-red-500";
                    bgColor = "bg-red-50";
                    textColor = "text-red-700";
                    textStyle = {};
                  } else if (isSelected && !isSubmitted) {
                    borderColor = "border-teal-500";
                    bgColor = "bg-teal-50";
                    textColor = "text-teal-700";
                    textStyle = {};
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={isSubmitted}
                      className={`relative flex items-center justify-between py-4 px-4 rounded-xl border-2 transition-all ${borderColor} ${bgColor} ${!isSubmitted
                        ? "hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer"
                        : "cursor-default"
                        }`}
                    >
                      <span className={`font-semibold text-lg ${textColor}`} style={textStyle}>
                        {optionLabels[index]}. {option}
                      </span>
                      {/* Show check icon for selected/correct */}
                      {((isSelected && !isSubmitted) || showCorrectHighlight) && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {/* Show X icon for wrong answer */}
                      {showWrongHighlight && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between max-w-2xl mx-auto mt-10">
                <button
                  onClick={handleClear}
                  disabled={isSubmitted}
                  className={`w-32 py-3 rounded-xl border-2 font-medium transition-colors ${isSubmitted
                    ? "border-gray-300 text-gray-300 cursor-not-allowed"
                    : "border-quinary text-quinary hover:bg-teal-50"
                    }`}
                >
                  Clear
                </button>
                {isSubmitted ? (
                  <button
                    onClick={handleNextQuestion}
                    className="w-48 py-3 rounded-xl bg-quinary text-white font-medium hover:opacity-90 transition-colors"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className={`w-48 py-3 rounded-xl font-medium transition-colors ${selectedAnswer !== null
                      ? "bg-quinary text-white hover:opacity-90"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="hidden lg:flex flex-col w-72 shrink-0 bg-white rounded-xl shadow-sm p-4">
              {/* Quiz Info */}
              <h2 className="text-2xl font-bold mb-2">
                {quizData.title.split(" & ")[0]} &
                <br />
                {quizData.title.split(" & ")[1]}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {quizData.description}
              </p>

              {/* Progress Section */}
              <div className="rounded-xl p-4 mb-4 bg-white border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>

                {/* Questions Progress */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold" style={{ color: "#2B3674" }}>
                      {quizData.currentQuestion}/{quizData.totalQuestions}
                    </span>
                    <span className="text-sm text-gray-500">questions</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#EFF4FB" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: "#F1C9FF",
                      }}
                    />
                  </div>
                </div>

                {/* Accuracy */}
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold" style={{ color: "#2B3674" }}>
                      {quizData.accuracy}%
                    </span>
                    <span className="text-sm text-gray-500">Accuracy</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#EFF4FB" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${quizData.accuracy}%`, backgroundColor: "#FFB800" }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommended Quizzes */}
              <h3 className="font-semibold text-gray-900 mb-3">
                Recommended Quizzes
              </h3>
              <div className="space-y-3">
                {recommendedQuizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/quizzes/${quiz.id}`}
                    className="flex gap-3 group"
                  >
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-900">
                      <Image
                        src={quiz.thumbnail}
                        alt={quiz.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-600 border border-purple-600 rounded mb-1">
                        {quiz.category === "VOCATIONAL" && (
                          <Image src="/quizzes/quill.png" alt="" width={10} height={10} />
                        )}
                        {quiz.category === "CAREER" && (
                          <Image src="/quizzes/career-icon.png" alt="" width={10} height={10} />
                        )}
                        {quiz.category === "K-12" && (
                          <Image src="/quizzes/pencil-ruler.png" alt="" width={10} height={10} />
                        )}
                        {quiz.category}
                      </span>
                      <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-quaternary transition-colors">
                        {quiz.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <Image
                          src="/quizzes/like-filled.png"
                          alt=""
                          width={10}
                          height={10}
                        />
                        <span>{quiz.likes} likes</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
