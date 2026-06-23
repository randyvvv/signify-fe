"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, FileText, Link2, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Draggable from "react-draggable";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Material {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  type: "video" | "document" | "article";
  category: string;
  durationMinutes: number | null;
  pages: number | null;
  content: string | null;
  articleUrl: string | null;
  videoUrl: string | null;
  transcript: string[] | null;
  progress: number;
}

interface RecMaterial {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  pages: number | null;
  durationMinutes: number | null;
}

export default function MaterialDetailPage() {
  const params = useParams();
  const materialId = params.id as string;

  const [material, setMaterial] = useState<Material | null>(null);
  const [recs, setRecs] = useState<RecMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Material>(`/api/materials/${materialId}`)
      .then(setMaterial)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
    api
      .get<RecMaterial[]>(`/api/materials/${materialId}/recommended`)
      .then(setRecs)
      .catch(() => {});
  }, [materialId]);

  const markComplete = async () => {
    if (!material) return;
    setMarking(true);
    try {
      await api.put(`/api/materials/${material.id}/progress`, {
        progress: 100,
        durationSeconds: (material.durationMinutes ?? 1) * 60,
      });
      setMaterial({ ...material, progress: 100 });
      toast.success("Marked as complete! Coins/streak updated.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memperbarui progres";
      toast.error("Gagal", { description: msg });
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400">
          Loading...
        </div>
      </>
    );
  }

  if (notFound || !material) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">Material not found</p>
        </div>
      </>
    );
  }

  return (
    <>
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

        <div className="bg-white shadow-sm mb-4 p-6">
          <div className="flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0">
              {/* Progress / complete */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Progress</span>
                  <div className="h-2 w-40 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-quinary"
                      style={{ width: `${material.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {material.progress}%
                  </span>
                </div>
                {material.progress >= 100 ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-teal-600">
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </span>
                ) : (
                  <Button
                    onClick={markComplete}
                    disabled={marking}
                    className="bg-quinary text-white hover:bg-quinary/90"
                  >
                    {marking ? "Saving..." : "Mark as complete"}
                  </Button>
                )}
              </div>

              {material.type === "video" && <VideoLayout material={material} />}
              {material.type === "document" && <DocumentLayout material={material} />}
              {material.type === "article" && <ArticleLayout material={material} />}
            </div>

            {/* Right Column - Sidebar */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
              <ChatWidget materialId={material.id} />
              <RecommendedMaterials recs={recs} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function VideoLayout({ material }: { material: Material }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const src = material.videoUrl || "https://www.youtube.com/embed/v1desDduz5M";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{material.title}</h2>

      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
        <iframe
          src={src}
          title={material.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
        <Draggable bounds="parent" defaultPosition={{ x: 0, y: 0 }} nodeRef={nodeRef}>
          <div
            ref={nodeRef}
            className="absolute top-4 right-4 w-36 h-44 rounded-xl overflow-hidden shadow-lg bg-gray-100 cursor-move z-10 border-2 border-white/50"
          >
            <Image
              src="/learning-materials/avatar.png"
              alt="Sign Language Interpreter"
              fill
              className="object-cover pointer-events-none"
            />
          </div>
        </Draggable>
      </div>

      {material.transcript && material.transcript.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: "linear-gradient(90deg, #C5FBF9 0%, #FDF5BF 100%)" }}
          >
            <h3 className="font-semibold text-gray-800">Video Transcript</h3>
          </div>
          <div className="px-6 py-4 space-y-4 text-gray-700 leading-relaxed">
            {material.transcript.map((text, idx) => (
              <p key={idx}>{text}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentLayout({ material }: { material: Material }) {
  return (
    <div className="space-y-4">
      <div className="relative h-56 rounded-2xl overflow-hidden">
        <Image
          src={material.thumbnailUrl || "/learning-materials/microphone.png"}
          alt={material.title}
          fill
          className="object-cover"
        />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{material.title}</h2>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            <span>{material.pages ?? "?"} pages</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-600">
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

function ArticleLayout({ material }: { material: Material }) {
  return (
    <div className="space-y-4">
      {material.articleUrl && (
        <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm">
          <Link2 className="h-5 w-5 shrink-0 text-gray-400" />
          <span className="text-gray-600 text-sm truncate">{material.articleUrl}</span>
        </div>
      )}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="relative h-56">
          <Image
            src={material.thumbnailUrl || "/learning-materials/microphone.png"}
            alt={material.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{material.title}</h2>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{material.durationMinutes ?? "?"} min read</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
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

// AI chatbot — POST /api/chat. Handles 503 (model not ready) gracefully.
function ChatWidget({ materialId }: { materialId: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/api/chat", {
        materialId,
        message: msg,
      });
      setMessages((m) => [...m, { role: "bot", text: res.reply }]);
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 503
          ? "AI assistant is coming soon — the model is still in development."
          : "Sorry, something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "bot", text }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(180deg, #C5FBF9 0%, #FDF5BF 100%)" }}
      >
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
      </div>

      <div className="p-3 space-y-3 h-[280px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 pt-8">
            Ask Signify anything about this material.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
                m.role === "user" ? "text-white" : "bg-gray-100 text-gray-700"
              }`}
              style={m.role === "user" ? { backgroundColor: "#2DA5A2" } : undefined}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-gray-400">Signify is typing…</p>}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message here..."
            className="flex-1 text-sm border-none bg-transparent focus:outline-none text-gray-600"
          />
          <button onClick={send} disabled={sending} className="hover:opacity-80 transition-opacity">
            <Image src="/learning-materials/send.png" alt="Send" width={20} height={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RecommendedMaterials({ recs }: { recs: RecMaterial[] }) {
  if (recs.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">Recommended Materials</h3>
      <div className="space-y-4">
        {recs.map((rec) => (
          <Link
            key={rec.id}
            href={`/learning-materials/${rec.id}`}
            className="flex gap-3 group"
          >
            <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-900">
              <Image
                src={rec.thumbnailUrl || "/learning-materials/vocational.png"}
                alt={rec.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-600">
                <Link2 className="h-2.5 w-2.5" />
                {rec.category}
              </span>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-quaternary transition-colors">
                {rec.title}
              </h4>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                <span>
                  {rec.pages ? `${rec.pages} pages` : `${rec.durationMinutes ?? "?"} min`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
