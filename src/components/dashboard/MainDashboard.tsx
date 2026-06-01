"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Trophy,
  Clock,
  Video,
  Calendar,
  ChevronRight,
  Flame,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

interface DashboardData {
  user: { id: string; fullName: string | null; avatarUrl: string | null; coins: number };
  stats: {
    streak: number;
    rank: number;
    totalLearningHours: number;
    dailyGoal: { target: number; current: number; percent: number };
  };
  recommended: {
    id: string;
    title: string;
    durationMinutes: number | null;
    thumbnailUrl: string | null;
    category: string;
    progress: number;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    durationSeconds: number;
    createdAt: string;
  }[];
  dailyQuiz: { id: string; title: string } | null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="p-6 text-slate-500">Gagal memuat dashboard. Coba refresh.</div>
    );
  }
  if (!data) {
    return <div className="p-6 text-slate-500">Loading dashboard...</div>;
  }

  const { user, stats, recommended, recentActivity, dailyQuiz } = data;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Banner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-teal-100 p-8 bg-gradient-to-r from-[#C5FBF9] to-[#FDF5BF]">
          <div className="relative z-10 flex flex-col justify-center h-full space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">{greeting()},</h2>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2DA5A2] via-[#DF5D73] to-[#E799A3] bg-clip-text text-transparent">
                {user.fullName ?? "Learner"}!
              </h1>
            </div>
            <p className="text-slate-600 max-w-md font-semibold">
              Ready to continue your learning journey today?
            </p>
            <div className="mt-8">
              <Link href="/learning-materials">
                <Button className="bg-slate-800 hover:bg-slate-900 text-white rounded-full px-6 gap-2">
                  Start Now <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-end justify-center pointer-events-none">
            <div className="absolute right-0 bottom-15 w-[224px] h-[224px] bg-[#DBCE584D] rounded-full " />
            <div className="absolute left-1/2 top-5 -translate-x-1/2  w-[270px] h-[270px] bg-[#207D7B2E] rounded-full" />
            <div className="absolute bottom-2 right-78 w-[121px] h-[121px] bg-[#DBCE584D] rounded-full " />
            <div className="relative h-[228px] w-[254px] bg-contain bg-no-repeat bg-bottom z-10">
              <Image
                src="/dashboard/girl.png"
                alt="Learning Sign Language"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="relative rounded-2xl bg-gradient-to-b from-pink-50 to-rose-50 border border-pink-100 p-6 flex items-center justify-between">
          <div className="z-10 space-y-1">
            <h3 className="text-rose-500 font-semibold mb-2">Your current streak is</h3>
            <div
              className="text-5xl font-black text-rose-500 flex items-baseline gap-1"
              style={{ WebkitTextStroke: "1px white" }}
            >
              {stats.streak}
            </div>
            <p className="text-rose-600 font-medium">Keep it up!</p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Flame className="h-28 w-28 text-orange-400 fill-orange-400 drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-white ring-1 ring-slate-100 rounded-xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-500">Daily Goal</span>
                <span className="text-teal-600 font-semibold text-xs">
                  {stats.dailyGoal.current}/{stats.dailyGoal.target} min
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {stats.dailyGoal.percent}%
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${stats.dailyGoal.percent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white ring-1 ring-slate-100 rounded-xl relative overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4 relative">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 z-10">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="z-10">
              <span className="text-sm font-medium text-slate-500">Rank</span>
              <div className="text-xl font-bold text-teal-500 flex items-center gap-1">
                #{stats.rank}
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0" />
        </Card>

        <Card className="border-0 shadow-sm bg-white ring-1 ring-slate-100 rounded-xl relative overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4 relative">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 z-10">
              <Clock className="h-6 w-6" />
            </div>
            <div className="z-10">
              <span className="text-sm font-medium text-slate-500">Total Learning</span>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalLearningHours} hours
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-0" />
        </Card>
      </div>

      {/* Recommended Course */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Recommended Course For You</h2>
          <Link href="/learning-materials">
            <Button variant="link" className="text-teal-600">See all courses</Button>
          </Link>
        </div>

        {recommended.length === 0 ? (
          <p className="text-slate-400">No courses yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommended.map((course) => (
              <Link key={course.id} href={`/learning-materials/${course.id}`}>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
                  <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative mb-3">
                    <Image
                      src={course.thumbnailUrl || "/learning-materials/vocational.png"}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1 space-y-2">
                    <div className="flex gap-2 items-center text-xs text-slate-500">
                      {course.durationMinutes ? (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" /> {course.durationMinutes} min
                        </span>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 text-[10px] h-5"
                      >
                        {course.category.toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight text-slate-900 line-clamp-2 min-h-[2.5rem]">
                      {course.title}
                    </h3>
                    <div className="h-1 w-20 bg-indigo-500 rounded-full mt-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Activity & Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-semibold text-lg text-slate-900">Recent Activity</h3>
              <Button variant="outline" size="sm" className="gap-2 text-slate-600">
                <Calendar className="h-4 w-4" /> Last 30 days
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                <BookOpen className="h-16 w-16 opacity-20" />
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-400 capitalize">{a.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Quiz */}
        <Card className="relative overflow-hidden bg-yellow-100 border-yellow-200 shadow-sm">
          <div
            className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent"
            style={{ backgroundSize: "20px 20px" }}
          />
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            <div>
              <div
                className="font-black text-3xl text-purple-900 mb-1"
                style={{ textShadow: "2px 2px 0px white" }}
              >
                DailyQuiz
              </div>
              <p className="text-sm text-yellow-800">Do daily quiz to gain extra coins!</p>
            </div>

            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-purple-700 flex items-center justify-center text-white text-5xl font-bold shadow-xl ring-4 ring-yellow-200">
                ?
              </div>
            </div>

            <Link
              href={dailyQuiz ? `/quizzes/${dailyQuiz.id}` : "/quizzes"}
              className="w-full max-w-[200px]"
            >
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full w-full mb-4">
                Take the quiz <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
