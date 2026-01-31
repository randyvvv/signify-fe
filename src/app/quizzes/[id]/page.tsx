"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import {
  ChevronLeft,
  Check,
  X,
  PartyPopper,
  Timer,
  CheckSquare,
  Coins,
  Filter,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
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
      type: "text", // Text-based options with sign image
      image: "/quizzes/hand.png",
      question: "What is the correct term for this sign?",
      options: ["Aljabar", "Kalkulus", "Trigonometri", "Geometri"],
      correctAnswer: 0, // Index of correct answer (Aljabar)
    },
    {
      id: 2,
      type: "image", // Image-based options with term text
      term: "Algebra",
      question: "What is the correct sign for this term?",
      options: [
        "/learning-materials/avatar.png",
        "/learning-materials/avatar.png",
        "/learning-materials/avatar.png",
        "/learning-materials/avatar.png",
      ],
      correctAnswer: 0, // Index of correct answer
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<
    {
      questionId: number;
      question: string;
      answerIndex: number;
      isCorrect: boolean;
      type: string;
      term?: string;
    }[]
  >([]);

  const currentQuestionData = quizData.questions[currentQuestionIndex];
  const optionLabels = ["A", "B", "C", "D"];

  const handleSelectAnswer = (index: number) => {
    if (!isSubmitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setIsSubmitted(true);
      const correct = selectedAnswer === currentQuestionData.correctAnswer;
      setIsCorrect(correct);

      // Save answer history
      setUserAnswers([
        ...userAnswers,
        {
          questionId: currentQuestionData.id,
          question: currentQuestionData.question,
          answerIndex: selectedAnswer,
          isCorrect: correct,
          type: currentQuestionData.type,
          term:
            "term" in currentQuestionData
              ? (currentQuestionData as any).term
              : undefined,
        },
      ]);
    }
  };

  const handleClear = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const handleNextQuestion = () => {
    // Move to next question if available
    if (currentQuestionIndex < quizData.questions.length - 1) {
      // Reset state for next question
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setIsCorrect(null);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const progressPercentage =
    (quizData.currentQuestion / quizData.totalQuestions) * 100;

  if (isQuizCompleted) {
    const totalQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    // SVG circle calculation
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (accuracy / 100) * circumference;

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

          {/* Results Area */}
          <div className="min-h-[calc(100vh-180px)] space-y-6">
            {/* Celebration Card */}
            <div className="relative bg-gradient-to-r from-[#E0F7FA] to-[#FFF9C4] p-12 text-center shadow-sm overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-10 left-20 w-4 h-4 rounded-full bg-red-200" />
              <div className="absolute top-20 left-[10%] w-6 h-6 rounded-full bg-orange-200 opacity-80" />
              <div className="absolute bottom-10 left-[30%] w-4 h-4 rounded-full bg-yellow-400 opacity-60" />
              <div className="absolute top-10 right-[20%] w-4 h-4 rounded-full bg-purple-400 opacity-60" />
              <div className="absolute top-20 right-10 w-4 h-4 rounded-full bg-blue-400 opacity-60" />
              <div className="absolute bottom-20 right-[15%] w-6 h-6 rounded-full bg-teal-300 opacity-60" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <PartyPopper className="w-10 h-10 text-purple-600 fill-purple-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                <h1 className="text-3xl font-bold mb-4">{quizData.title}</h1>
                <p className="text-gray-600">Great job for finishing the quiz!</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Accuracy */}
              <div className="bg-white p-8 shadow-sm flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#0F766E"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: "#0F766E" }}>
                      {accuracy}%
                    </span>
                    <span className="text-sm text-gray-500">Accuracy</span>
                  </div>
                </div>
                <div className="px-14 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold">
                  Great Job!
                </div>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-2 bg-white p-8 shadow-sm grid grid-cols-3">
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <CheckSquare className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">
                    Correct Answers
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {correctAnswers}
                    <span className="text-gray-400 text-lg font-medium">
                      /{totalQuestions}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                    <Coins className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">
                    Points Earned
                  </p>
                  <p className="text-3xl font-bold text-yellow-500">+50</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                    <Timer className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Time Taken</p>
                  <p className="text-3xl font-bold text-gray-900">04:12</p>
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div>
              <div className="flex items-center justify-between mb-4 mt-8">
                <h3 className="text-lg font-bold">Question Review</h3>
                <div className="relative">
                  <select
                    className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 border border-teal-500 bg-teal-50 rounded-lg text-sm text-gray-900 focus:outline-none cursor-pointer"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    <option value="all">Filter</option>
                    <option value="correct">Correct (Benar)</option>
                    <option value="incorrect">Incorrect (Salah)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-4">
                {userAnswers
                  .filter((ans) => {
                    if (activeFilter === "correct") return ans.isCorrect;
                    if (activeFilter === "incorrect") return !ans.isCorrect;
                    return true;
                  })
                  .map((ans, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 flex items-center justify-between bg-white ${ans.isCorrect
                        ? "border-quinary"
                        : "border-red-500"
                        }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-32 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          {ans.type === "text" ? (
                            <Image
                              src="/quizzes/hand.png"
                              alt="Quiz"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-quinary font-bold text-xl"
                              style={{ fontFamily: "'Raleway', sans-serif" }}
                            >
                              {ans.term}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-lg">
                            {quizData.title}
                          </h4>
                          <p className="text-sm">
                            <span className="text-gray-500">Your Answer: </span>
                            <span
                              className={
                                ans.isCorrect
                                  ? "text-teal-600 font-bold"
                                  : "text-red-600 font-bold"
                              }
                            >
                              {optionLabels[ans.answerIndex]}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="pr-4">
                        {ans.isCorrect ? (
                          <CheckCircle className="w-8 h-8 text-white fill-quinary" />
                        ) : (
                          <XCircle className="w-8 h-8 text-white fill-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

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
            <div className="flex-1 bg-white shadow-sm p-6">
              {/* Question Header - Sign Image or Term */}
              {currentQuestionData.type === "text" ? (
                /* Type 1: Show sign image for text-based options */
                <div className="relative w-full max-w-lg mx-auto h-[280px] rounded-2xl overflow-hidden border border-gray-200 mb-6">
                  <Image
                    src={currentQuestionData.image || "/quizzes/hand.png"}
                    alt="Sign language gesture"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                /* Type 2: Show question first, then term text */
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                    {currentQuestionData.question}
                  </h2>
                  <h3
                    className="text-5xl font-bold text-quinary mb-4"
                    style={{ fontFamily: "'Raleway', sans-serif" }}
                  >
                    {currentQuestionData.term}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose the best answer from these options below
                  </p>
                </div>
              )}

              {/* Question - only for text type */}
              {currentQuestionData.type === "text" && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Raleway', sans-serif" }}>
                    {currentQuestionData.question}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Choose the best answer from these options below
                  </p>
                </div>
              )}

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
                      {currentQuestionData.type === "text"
                        ? isCorrect
                          ? `Great job! ${currentQuestionData.options[
                          currentQuestionData.correctAnswer
                          ]
                          } is the correct term for this sign.`
                          : `The correct answer is ${currentQuestionData.options[
                          currentQuestionData.correctAnswer
                          ]
                          }, don't give up!`
                        : isCorrect
                          ? `Great job! Option ${optionLabels[currentQuestionData.correctAnswer]
                          } is the correct sign for this term.`
                          : `Option ${optionLabels[currentQuestionData.correctAnswer]
                          } is the correct sign for this term, don't give up!`}
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
                      className={`relative rounded-xl border-2 transition-all ${borderColor} ${bgColor} ${!isSubmitted
                        ? "hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer"
                        : "cursor-default"
                        } ${currentQuestionData.type === "image" ? "p-3" : "flex items-center justify-between py-4 px-4"}`}
                    >
                      {currentQuestionData.type === "text" ? (
                        /* Text option */
                        <>
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
                        </>
                      ) : (
                        /* Image option */
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className={`font-semibold text-lg ${textColor}`} style={textStyle}>
                              {optionLabels[index]}.
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
                          </div>
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={option}
                              alt={`Option ${optionLabels[index]}`}
                              fill
                              className="object-contain"
                            />
                          </div>
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
            <div className="hidden lg:flex flex-col w-72 shrink-0 bg-white shadow-sm p-4">
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
