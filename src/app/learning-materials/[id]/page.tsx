"use client";

import { useRef } from "react";
import { MainLayout } from "@/components/layout";
import { ChevronLeft, Download, FileText, Link2, Send, Play, Volume2, Maximize2, MoreVertical, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Draggable from "react-draggable";

// Mock data for materials
const materialsData: Record<string, {
  id: number;
  title: string;
  thumbnail: string;
  type: "video" | "document" | "article";
  category: string;
  categoryColor: string;
  duration?: string;
  pages?: number;
  articleUrl?: string;
  content: string;
  transcript?: string[];
}> = {
  "1": {
    id: 1,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: [
      "1. Adherence is King TB bacteria are tough, which is why the treatment takes months. Even if you start feeling better after a few weeks, the bacteria might still be hiding. Skipping doses can lead to drug resistance, making the journey much harder",
      "2. Listen to Your Body Your body communicates through symptoms. Feeling extra tired or losing your appetite? These are important signals.",
      "Fact: Side effects like nausea or a slight change in urine color can happen.",
      "Action: Don't ignore them. Log them in your Daily Log so your Health Provider can adjust your r..."
    ],
  },
  "2": {
    id: 2,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: [
      "1. Adherence is King TB bacteria are tough, which is why the treatment takes months. Even if you start feeling better after a few weeks, the bacteria might still be hiding. Skipping doses can lead to drug resistance, making the journey much harder",
      "2. Listen to Your Body Your body communicates through symptoms. Feeling extra tired or losing your appetite? These are important signals.",
    ],
  },
  "3": {
    id: 3,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: [
      "1. Adherence is King TB bacteria are tough, which is why the treatment takes months.",
    ],
  },
  "4": {
    id: 4,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/career.png",
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    pages: 11,
    content: "One hundred and nineteen public speaking students were videotaped while giving speeches and filled out questionnaires concerning preparation time, past experience speaking, anxiety about the speech just performed, general anxiety about communication, and grade point average. Researchers rated the content and delivery of the speeches and compared the ratings with the questionnaire responses. The quality of speech performance correlated positively with cumulative grade point average, total preparation time, time spent preparing a visual aid, number of rehearsals for an audience, time rehearsing silently, time rehearsing out loud, number of rehearsals out loud, research outside the library (interviews, phone calls, surveys, etc.), and preparation of speaking notes. Anxiety about the speech just delivered correlated negatively with quality of performance. Past experience with public speaking instruction had a mixed relation to speech quality. Significant predictors of the quality of speech performance were grade point average, total preparation time, number of rehearsals for an audience, and st...",
  },
  "5": {
    id: 5,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/career.png",
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    pages: 11,
    content: "One hundred and nineteen public speaking students were videotaped while giving speeches...",
  },
  "6": {
    id: 6,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/career.png",
    type: "document",
    category: "CAREER",
    categoryColor: "bg-teal-100 text-teal-600",
    pages: 11,
    content: "One hundred and nineteen public speaking students were videotaped...",
  },
  "7": {
    id: 7,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/k-12.png",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    duration: "11 min read",
    articleUrl: "https://www.tandfonline.com/doi/abs/10.1080/03634529409378958",
    content: "One hundred and nineteen public speaking students were videotaped while giving speeches and filled out questionnaires concerning preparation time, past experience speaking, anxiety about the speech just performed, general anxiety about communication, and grade point average. Researchers rated the content and delivery of the speeches and compared the ratings with the questionnaire responses. The quality of speech performance correlated positively with cumulative grade point average, total preparation time, time spent preparing a visual aid, number of rehearsals for an audience, time rehearsing silently, time rehearsing out loud, number of rehearsals out loud, research outside the library (interviews, phone calls, surveys, etc.), and preparation of speaking notes. Anxiety about the speech just delivered correlated negatively with quality of performance. Past experience with public speaking instruction had a mixed relation to speech quality. Significant predictors of the quality of speech performance were grade point average, total preparation time, number of rehearsals for an audience, and st...",
  },
  "8": {
    id: 8,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/k-12.png",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    duration: "11 min read",
    articleUrl: "https://www.tandfonline.com/doi/abs/10.1080/03634529409378958",
    content: "One hundred and nineteen public speaking students were videotaped...",
  },
  "9": {
    id: 9,
    title: "Effective Presentation Techniques",
    thumbnail: "/learning-materials/k-12.png",
    type: "article",
    category: "K-12",
    categoryColor: "bg-purple-100 text-purple-600",
    duration: "11 min read",
    articleUrl: "https://www.tandfonline.com/doi/abs/10.1080/03634529409378958",
    content: "One hundred and nineteen public speaking students...",
  },
  "10": {
    id: 10,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: ["1. Adherence is King TB bacteria are tough..."],
  },
  "11": {
    id: 11,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: ["1. Adherence is King..."],
  },
  "12": {
    id: 12,
    title: "Basic Mathematics: Linear Equations",
    thumbnail: "/learning-materials/vocational.png",
    type: "video",
    category: "VOCATIONAL",
    categoryColor: "bg-pink-100 text-pink-600",
    duration: "11 min",
    content: "Learn effective presentation techniques...",
    transcript: ["1. Introduction to presentations..."],
  },
};

// Recommended materials by category
const recommendedMaterialsByCategory: Record<string, Array<{ id: number; title: string; thumbnail: string; category: string; categoryColor: string; pages: number }>> = {
  "VOCATIONAL": [
    { id: 1, title: "Basic Mathematics: Linear Equations", thumbnail: "/learning-materials/vocational.png", category: "VOCATIONAL", categoryColor: "bg-pink-100 text-pink-600", pages: 11 },
    { id: 2, title: "Basic Mathematics: Linear Equations", thumbnail: "/learning-materials/vocational.png", category: "VOCATIONAL", categoryColor: "bg-pink-100 text-pink-600", pages: 11 },
    { id: 3, title: "Basic Mathematics: Linear Equations", thumbnail: "/learning-materials/vocational.png", category: "VOCATIONAL", categoryColor: "bg-pink-100 text-pink-600", pages: 11 },
  ],
  "CAREER": [
    { id: 4, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/career.png", category: "CAREER", categoryColor: "bg-teal-100 text-teal-600", pages: 11 },
    { id: 5, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/career.png", category: "CAREER", categoryColor: "bg-teal-100 text-teal-600", pages: 11 },
    { id: 6, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/career.png", category: "CAREER", categoryColor: "bg-teal-100 text-teal-600", pages: 11 },
  ],
  "K-12": [
    { id: 7, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/k-12.png", category: "K-12", categoryColor: "bg-purple-100 text-purple-600", pages: 11 },
    { id: 8, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/k-12.png", category: "K-12", categoryColor: "bg-purple-100 text-purple-600", pages: 11 },
    { id: 9, title: "Effective Presentation Techniques", thumbnail: "/learning-materials/k-12.png", category: "K-12", categoryColor: "bg-purple-100 text-purple-600", pages: 11 },
  ],
};

export default function MaterialDetailPage() {
  const params = useParams();
  const materialId = params.id as string;
  const material = materialsData[materialId];

  if (!material) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">Material not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-4 shadow-sm mb-4">
          <Link
            href="/learning-materials"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-quaternary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-quaternary">Learning Materials</h1>
            <p className="text-sm text-grey">{material.title}</p>
          </div>
        </div>

        {/* Main Content - Wrapped with shadow */}
        <div className="bg-white shadow-sm mb-4 p-6">
          <div className="flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0">
              {material.type === "video" && <VideoLayout material={material} />}
              {material.type === "document" && <DocumentLayout material={material} />}
              {material.type === "article" && <ArticleLayout material={material} />}
            </div>

            {/* Right Column - Sidebar */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
              {/* Chat Widget */}
              <ChatWidget />

              {/* Recommended Materials */}
              <RecommendedMaterials currentCategory={material.category} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Video Layout Component
function VideoLayout({ material }: { material: typeof materialsData[string] }) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">{material.title}</h2>

      {/* YouTube Video Player */}
      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
        <iframe
          src="https://www.youtube.com/embed/v1desDduz5M"
          title={material.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />

        {/* Draggable Sign Language Avatar */}
        <Draggable bounds="parent" defaultPosition={{ x: 0, y: 0 }} nodeRef={nodeRef}>
          <div ref={nodeRef} className="absolute top-4 right-4 w-36 h-44 rounded-xl overflow-hidden shadow-lg bg-gray-100 cursor-move z-10 border-2 border-white/50">
            <Image
              src="/learning-materials/avatar.png"
              alt="Sign Language Interpreter"
              fill
              className="object-cover pointer-events-none"
            />
            {/* Resize/drag indicator */}
            <div className="absolute bottom-2 right-2 bg-black/30 rounded p-1">
              <Maximize2 className="h-3 w-3 text-white" />
            </div>
          </div>
        </Draggable>
      </div>

      {/* Video Transcript */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(90deg, #C5FBF9 0%, #FDF5BF 100%)' }}>
          <h3 className="font-semibold text-gray-800">Video Transcript</h3>
          <button className="hover:opacity-80 transition-opacity">
            <Image src="/learning-materials/download.png" alt="Download" width={20} height={20} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4 text-gray-700 leading-relaxed">
          {material.transcript?.map((text, idx) => (
            <p key={idx}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Document Layout Component
function DocumentLayout({ material }: { material: typeof materialsData[string] }) {
  return (
    <div className="space-y-4">
      {/* Document Image */}
      <div className="relative h-56 rounded-2xl overflow-hidden">
        <Image
          src="/learning-materials/microphone.png"
          alt={material.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Document Content */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{material.title}</h2>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            <span>{material.pages} pages</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${material.categoryColor}`}>
            <Link2 className="h-3 w-3" />
            {material.category}
          </span>
        </div>

        <div className="text-gray-700 leading-relaxed">
          <p>{material.content}</p>
        </div>
      </div>
    </div>
  );
}

// Article Layout Component
function ArticleLayout({ material }: { material: typeof materialsData[string] }) {
  return (
    <div className="space-y-4">
      {/* URL Bar */}
      <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm">
        <Image
          src="/learning-materials/solar-link-linear.png"
          alt="Link"
          width={20}
          height={20}
          className="shrink-0"
        />
        <span className="text-gray-600 text-sm truncate">{material.articleUrl}</span>
      </div>

      {/* Article Image - Inside card */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="relative h-56">
          <Image
            src="/learning-materials/microphone.png"
            alt={material.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{material.title}</h2>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{material.duration}</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${material.categoryColor}`}>
              <Link2 className="h-3 w-3" />
              {material.category}
            </span>
          </div>

          <div className="text-gray-700 leading-relaxed">
            <p>{material.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Widget Component - Updated to match reference
function ChatWidget() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header with gradient */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #C5FBF9 0%, #FDF5BF 100%)' }}>
        <div className="flex items-center gap-2">
          <Image
            src="/learning-materials/chatbot.png"
            alt="Signify"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-semibold text-gray-800">Signify</span>
        </div>
        {/* Close button - white outline only */}
        <button className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-colors">
          <span className="text-white text-lg font-light leading-none">−</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="p-3 space-y-3 h-[320px] overflow-y-auto">
        {/* Timestamp */}
        <div className="text-xs text-gray-400 text-right">7:20</div>

        {/* User message - teal color #2DA5A2 */}
        <div className="flex justify-end">
          <div className="rounded-2xl px-4 py-2.5 text-sm max-w-[85%] text-white" style={{ backgroundColor: '#2DA5A2' }}>
            Minimum text check, Hide check icon
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 text-right">7:20</div>

        {/* Bot message - light gray */}
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm max-w-[85%] text-gray-700">
            Rapidly build stunning Web Apps with Frest 🎉 Developer friendly, Highly customizable & Carefully crafted HTML Admin Dashboard Template.
          </div>
        </div>

        {/* Bot message with avatar - purple bg on avatar */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1 p-1">
            <Image
              src="/learning-materials/chatbot.png"
              alt="Signify"
              width={20}
              height={20}
              className="rounded-full"
            />
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">7:20</div>
            <div className="rounded-2xl px-4 py-2.5 text-sm text-white" style={{ backgroundColor: '#2DA5A2' }}>
              More no. of lines text and showing complete list of features like time stamp + check icon READ
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Type your message here..."
            className="flex-1 text-sm border-none bg-transparent focus:outline-none text-gray-600"
          />
          {/* Send button */}
          <button className="hover:opacity-80 transition-opacity">
            <Image src="/learning-materials/send.png" alt="Send" width={20} height={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Recommended Materials Component
function RecommendedMaterials({ currentCategory }: { currentCategory: string }) {
  const materials = recommendedMaterialsByCategory[currentCategory] || recommendedMaterialsByCategory["CAREER"];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">Recommended Materials</h3>
      <div className="space-y-4">
        {materials.map((rec, idx) => (
          <Link key={idx} href={`/learning-materials/${rec.id}`} className="flex gap-3 group">
            <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-900">
              <Image
                src={rec.thumbnail}
                alt={rec.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rec.categoryColor}`}>
                <Link2 className="h-2.5 w-2.5" />
                {rec.category}
              </span>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-quaternary transition-colors">
                {rec.title}
              </h4>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                <span>{rec.pages} pages</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
