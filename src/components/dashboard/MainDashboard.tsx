"use client";

import React from "react";
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
  BookOpen
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MainDashboard() {
  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Banner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-teal-100 p-8 bg-gradient-to-r from-[#C5FBF9] to-[#FDF5BF]">
            <div className="relative z-10 flex flex-col justify-center h-full space-y-4">
                <div>
                   <h2 className="text-2xl font-semibold text-slate-800">Good afternoon,</h2>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2DA5A2] via-[#DF5D73] to-[#E799A3] bg-clip-text text-transparent">Thea Josephine!</h1>
                </div>
                <p className="text-slate-600 max-w-md font-semibold">
                    Ready to continue your learning journey today?
                </p>
                <div className="mt-8">
                    <Button className="bg-slate-800 hover:bg-slate-900 text-white rounded-full px-6 gap-2">
                        Start Now <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            {/* Abstract Background Shapes & Placeholder Image */}
             <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-end justify-center pointer-events-none">
                 <div className="absolute right-0 bottom-15 w-[224px] h-[224px] bg-[#DBCE584D] rounded-full " />
                 <div className="absolute left-1/2 top-5 -translate-x-1/2  w-[270px] h-[270px] bg-[#207D7B2E] rounded-full" />
                 <div className="absolute bottom-2 right-78 w-[121px] h-[121px] bg-[#DBCE584D] rounded-full " />
                 {/* This would be the user image from screenshot */}
                 <div className="relative h-[228px] w-[254px] bg-contain bg-no-repeat bg-bottom z-10" >
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
                <div className="text-5xl font-black text-rose-500 flex items-baseline gap-1" style={{ WebkitTextStroke: '1px white' }}>
                    22
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
                        <span className="text-teal-600 font-semibold text-xs">Finish today&apos;s goal to gain extra coins!</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">35</div>
                    <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: '45%' }}></div>
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
                        ⬆ #12
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
                     <div className="text-2xl font-bold text-slate-900">12.5hours</div>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[
              { id: 1, title: "Basic Sign Language Greetings", duration: "8 min", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop" },
              { id: 2, title: "Numbers and Counting in Sign Language", duration: "12 min", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop" },
              { id: 3, title: "Family Members Signs", duration: "10 min", image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop" },
              { id: 4, title: "Common Phrases for Daily Use", duration: "15 min", image: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=400&h=300&fit=crop" },
              { id: 5, title: "Sign Language Alphabet", duration: "11 min", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop" },
            ].map((course) => (
                <Link key={course.id} href="/learning-materials">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
                      <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative mb-3">
                           <Image
                             src={course.image}
                             alt={course.title}
                             fill
                             className="object-cover"
                           />
                      </div>
                      <div className="flex flex-col flex-1 space-y-2">
                           <div className="flex gap-2 items-center text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {course.duration}</span>
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 text-[10px] h-5">VOCATIONAL</Badge>
                           </div>
                           <h3 className="font-semibold text-sm leading-tight text-slate-900 line-clamp-2 min-h-[2.5rem]">
                               {course.title}
                           </h3>
                           <div className="h-1 w-20 bg-indigo-500 rounded-full mt-auto"></div>
                      </div>
                  </div>
                </Link>
            ))}
        </div>
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

                <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                    <BookOpen className="h-16 w-16 opacity-20" />
                    <p>No activity yet</p>
                </div>
             </CardContent>
        </Card>

        {/* Daily Quiz */}
        <Card className="relative overflow-hidden bg-yellow-100 border-yellow-200 shadow-sm">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent" style={{ backgroundSize: '20px 20px' }}></div>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
                 <div>
                    <div className="font-black text-3xl text-purple-900 mb-1" style={{ textShadow: '2px 2px 0px white' }}>DailyQuiz</div>
                    <p className="text-sm text-yellow-800">Do daily quiz to gain extra coins!</p>
                 </div>
                 
                 <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-purple-700 flex items-center justify-center text-white text-5xl font-bold shadow-xl ring-4 ring-yellow-200">
                        ?
                    </div>
                 </div>

                 <Link href="/quizzes" className="w-full max-w-[200px]">
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
