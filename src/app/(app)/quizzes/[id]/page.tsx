"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Check,
  PartyPopper,
  Timer,
  CheckSquare,
  Coins,
  CircleDollarSign,
  CheckCircle,
  XCircle,
  X,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";

interface Question {
  id: string;
  ordering: number;
  type: "text" | "image" | "sign";
  question: string;
  promptImageUrl: string | null;
  term: string | null;
  options: string[];
  correctIndex: number;
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  level: string;
  category: string;
  likesCount: number;
  totalQuestions: number;
  questions: Question[];
}

interface ResultItem {
  questionId: string;
  question: string;
  type: "text" | "image" | "sign";
  term: string | null;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

interface AttemptResult {
  correctCount: number;
  totalCount: number;
  accuracy: number;
  pointsEarned: number;
  timeTakenSeconds: number;
  results: ResultItem[];
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCurrentSubmitted, setIsCurrentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"All" | "Correct" | "Wrong">("All");
  const startRef = useRef<number>(Date.now());
  const avatar = useEquippedAvatar();

  useEffect(() => {
    setLoading(true);
    api
      .get<QuizDetail>(`/api/quizzes/${id}`)
      .then((q) => {
        setQuiz(q);
        startRef.current = Date.now();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
          Loading...
        </div>
      </>
    );
  }
  if (notFound || !quiz) {
    return (
      <>
        <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
          Quiz not found
        </div>
      </>
    );
  }

  const questions = quiz.questions;
  const current = questions[index];
  const isLast = index === questions.length - 1;

  const select = (i: number) => {
    if (!current || isCurrentSubmitted) return;
    setSelectedOption(i);
  };

  const clear = () => {
    if (!current || isCurrentSubmitted) return;
    setSelectedOption(null);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setSelectedOption(null);
    setIsCurrentSubmitted(false);
  };

  const submitLocal = () => {
    if (selectedOption === null || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selectedOption }));
    setIsCurrentSubmitted(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: questions
          .filter((q) => answers[q.id] !== undefined)
          .map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] })),
        timeTakenSeconds: Math.round((Date.now() - startRef.current) / 1000),
      };
      const res = await api.post<AttemptResult>(
        `/api/quizzes/${id}/attempts`,
        payload,
      );
      setResult(res);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengirim jawaban";
      toast.error("Gagal", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Results screen ---------------- */
  if (result) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (result.accuracy / 100) * circumference;

    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
            <Link
              href="/quizzes"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Quizzes</h1>
              <p className="text-sm text-grey">{quiz.title}</p>
            </div>
          </div>

          <div className="min-h-[calc(100vh-180px)] space-y-6">
            {/* Celebration */}
            <div className="relative bg-gradient-to-r from-[#E0F7FA] to-[#FFF9C4] p-12 text-center shadow-sm overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <PartyPopper className="w-10 h-10 text-purple-600 fill-purple-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
                <p className="text-gray-600">Great job for finishing the quiz!</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-8 shadow-sm flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r={radius} stroke="#E5E7EB" strokeWidth="12" fill="transparent" />
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#0F766E"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: "#0F766E" }}>
                      {result.accuracy}%
                    </span>
                    <span className="text-sm text-gray-500">Accuracy</span>
                  </div>
                </div>
                <div className="px-14 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold">
                  {result.accuracy >= 70 ? "Great Job!" : "Keep practicing!"}
                </div>
              </div>

              <div className="md:col-span-2 bg-white p-8 shadow-sm grid grid-cols-3">
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <CheckSquare className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Correct Answers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.correctCount}
                    <span className="text-gray-400 text-lg font-medium">
                      /{result.totalCount}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                    <Coins className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Points Earned</p>
                  <p className="text-3xl font-bold text-yellow-500">+{result.pointsEarned}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                    <Timer className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Time Taken</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {fmtTime(result.timeTakenSeconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Review */}
            <div>
              <div className="flex items-center justify-between mb-4 mt-8">
                <h3 className="text-lg font-bold">Question Review</h3>
                <div className="relative">
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value as any)}
                    className="appearance-none bg-[#F8F8FF] border border-teal-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-quinary/20 cursor-pointer"
                  >
                    <option value="All">Filter</option>
                    <option value="Correct">Correct</option>
                    <option value="Wrong">Wrong</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {result.results
                  .filter((ans) => {
                    if (reviewFilter === "Correct") return ans.isCorrect;
                    if (reviewFilter === "Wrong") return !ans.isCorrect;
                    return true;
                  })
                  .map((ans, idx) => {
                    const originalQuestion = quiz.questions.find((q) => q.id === ans.questionId);
                    const selectedOptionString = originalQuestion?.options[ans.selectedIndex];
                    const correctOptionString = originalQuestion?.options[ans.correctIndex];

                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl p-4 flex items-center justify-between bg-white ${
                          ans.isCorrect ? "border-teal-400" : "border-rose-400"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-32 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {ans.type === "text" ? (
                              <Image src={originalQuestion?.promptImageUrl || "/quizzes/hand.png"} alt="Quiz" fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-quinary font-bold text-xl">
                                {ans.term}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">{ans.question}</h4>
                            <p className="text-sm mt-1">
                              <span className="text-gray-500 mr-2">Your Answer:</span>
                              <span className={ans.isCorrect ? "text-teal-600 font-medium" : "text-rose-600 font-medium"}>
                                {ans.type !== "image" ? selectedOptionString : LABELS[ans.selectedIndex]}
                              </span>
                              {!ans.isCorrect && (
                                <>
                                  <span className="text-gray-300 mx-2">|</span>
                                  <span className="text-gray-500 mr-1">Correct Answer:</span>
                                  <span className="text-teal-600 font-medium">
                                    {ans.type !== "image" ? correctOptionString : LABELS[ans.correctIndex]}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="pr-4">
                          {ans.isCorrect ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 shrink-0">
                              <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 shrink-0">
                              <X className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------------- Quiz screen ---------------- */
  const submittedQuestionsCount = Object.keys(answers).length;
  let correctAnswersCount = 0;
  for (const [qId, selIdx] of Object.entries(answers)) {
    const q = questions.find((q) => q.id === qId);
    if (q && q.correctIndex === selIdx) correctAnswersCount++;
  }
  const accuracy = submittedQuestionsCount === 0 ? 0 : Math.round((correctAnswersCount / submittedQuestionsCount) * 100);

  const progressPct = ((index + (isCurrentSubmitted ? 1 : 0)) / questions.length) * 100;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
          <Link
            href="/quizzes"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Quizzes</h1>
            <p className="text-sm text-grey">{quiz.title}</p>
          </div>
        </div>

        <div className="min-h-[calc(100vh-180px)]">
          <div className="flex gap-6">
            {/* Quiz Content */}
            <div className="flex-1 bg-white shadow-sm p-6">
              {!current ? (
                <p className="text-gray-500">This quiz has no questions yet.</p>
              ) : (
                <>
                  {current.type === "sign" ? (
                    <div className="text-center mb-8">
                      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-senary/30 mb-6">
                        <SignAvatarViewer
                          key={current.id}
                          text={current.term ?? ""}
                          vrmUrl={avatar.vrmUrl}
                          hairColor={avatar.hairColor}
                          eyeColor={avatar.eyeColor}
                          accessory={avatar.accessory}
                          className="w-full h-full"
                          placeholder="Watch the avatar sign"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{current.question}</h2>
                      <p className="text-sm text-gray-500">
                        The sign loops — watch it as many times as you need
                      </p>
                    </div>
                  ) : current.type === "text" ? (
                    <div className="relative w-full max-w-lg mx-auto h-[280px] rounded-2xl overflow-hidden border border-gray-200 mb-6">
                      <Image
                        src={current.promptImageUrl || "/quizzes/hand.png"}
                        alt="Sign language gesture"
                        fill
                        className="object-contain"
                        unoptimized={true}
                        quality={100}
                      />
                    </div>
                  ) : (
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{current.question}</h2>
                      <h3 className="text-5xl font-bold text-quinary mb-4">{current.term}</h3>
                    </div>
                  )}

                  {current.type === "text" && (
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{current.question}</h2>
                      <p className="text-sm text-gray-500">
                        Choose the best answer from these options below
                      </p>
                    </div>
                  )}

                  {isCurrentSubmitted && (
                    <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-xl border-2 flex gap-3 ${
                      selectedOption === current.correctIndex 
                        ? "bg-teal-50 border-teal-500 text-teal-700" 
                        : "bg-rose-50 border-rose-500 text-rose-700"
                    }`}>
                      <div className="shrink-0 flex items-center justify-center pt-1">
                        {selectedOption === current.correctIndex 
                          ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 shrink-0">
                              <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          )
                          : (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 shrink-0">
                              <X className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          )
                        }
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-base">
                          {selectedOption === current.correctIndex ? "Correct Answer!" : "Wrong Answer"}
                        </h4>
                        <p className="text-sm opacity-90">
                          {selectedOption === current.correctIndex 
                            ? `Great job! Option ${LABELS[current.correctIndex]} is the correct answer.`
                            : `The correct answer is Option ${LABELS[current.correctIndex]}, don't give up!`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {current.options.map((option, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = current.correctIndex === i;
                      
                      let buttonClass = "border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50/50";
                      let icon = null;

                      const checkIcon = (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 shrink-0">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                      );

                      const xIcon = (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 shrink-0">
                          <X className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                      );

                      if (isCurrentSubmitted) {
                        if (isSelected && isCorrect) {
                          buttonClass = "border-teal-500 bg-teal-50 text-teal-800";
                          icon = checkIcon;
                        } else if (isSelected && !isCorrect) {
                          buttonClass = "border-rose-500 bg-rose-50 text-rose-800";
                          icon = xIcon;
                        } else if (isCorrect) {
                          buttonClass = "border-teal-500 bg-teal-50 text-teal-800";
                          icon = checkIcon;
                        } else {
                          buttonClass = "border-gray-200 bg-white opacity-50 cursor-not-allowed";
                        }
                      } else {
                        if (isSelected) {
                          buttonClass = "border-teal-500 bg-teal-50 text-teal-800";
                          icon = checkIcon;
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => select(i)}
                          disabled={isCurrentSubmitted}
                          className={`relative rounded-xl border-2 transition-all ${buttonClass} ${
                            current.type === "image" ? "p-3" : "flex items-center justify-between py-4 px-4"
                          } cursor-pointer`}
                        >
                          {current.type !== "image" ? (
                            <>
                              <span className="font-semibold text-lg">
                                {LABELS[i]}. {option}
                              </span>
                              {icon}
                            </>
                          ) : (
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center justify-between w-full mb-2">
                                <span className="font-semibold text-lg">{LABELS[i]}.</span>
                                {icon}
                              </div>
                              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                                <Image src={option} alt={`Option ${LABELS[i]}`} fill className="object-contain" unoptimized={true} quality={100} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between max-w-2xl mx-auto mt-10">
                    <button
                      onClick={clear}
                      disabled={isCurrentSubmitted}
                      className={`w-32 py-3 rounded-xl border-2 font-medium ${isCurrentSubmitted ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-quinary text-quinary hover:bg-teal-50'}`}
                    >
                      Clear
                    </button>
                    {!isCurrentSubmitted ? (
                      <button
                        onClick={submitLocal}
                        disabled={selectedOption === null}
                        className={`w-48 py-3 rounded-xl font-medium transition-colors ${
                          selectedOption !== null
                            ? "bg-quinary text-white hover:opacity-90"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Submit Answer
                      </button>
                    ) : isLast ? (
                      <button
                        onClick={submit}
                        disabled={submitting}
                        className={`w-48 py-3 rounded-xl font-medium transition-colors bg-quinary text-white hover:opacity-90`}
                      >
                        {submitting ? "Submitting..." : "Finish Quiz"}
                      </button>
                    ) : (
                      <button
                        onClick={next}
                        className={`w-48 py-3 rounded-xl font-medium transition-colors bg-quinary text-white hover:opacity-90`}
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:flex flex-col w-72 shrink-0 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">{quiz.description}</p>

              <div className="rounded-xl p-4 mb-4 bg-white border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold" style={{ color: "#2B3674" }}>
                    {index + (isCurrentSubmitted ? 1 : 0)}/{questions.length}
                  </span>
                  <span className="text-sm text-gray-500">questions</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden mb-6" style={{ backgroundColor: "#EFF4FB" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progressPct}%`, backgroundColor: "#F1C9FF" }}
                  />
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-3">
                  <span className="text-2xl font-bold" style={{ color: "#2B3674" }}>{accuracy}%</span> Accuracy
                </h3>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#EFF4FB" }}>
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
