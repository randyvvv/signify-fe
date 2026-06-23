"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Link as LinkIcon, Play, Video, Hand } from "lucide-react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { SignPoseViewer } from "@/components/shared";

interface TranslatorSession {
  id: string;
  sourceUrl: string;
  status: "pending" | "processing" | "done" | "error";
  transcript: string[] | null;
}

export default function LiveTranslatorPage() {
  const [url, setUrl] = useState("");
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<TranslatorSession | null>(null);

  // Teks -> animasi pose isyarat (SignGPT). `signText` = isi input,
  // `committedSign` = teks yang sedang dirender oleh avatar.
  const [signText, setSignText] = useState("");
  const [committedSign, setCommittedSign] = useState("");

  const handleSign = () => {
    if (!signText.trim()) {
      toast.error("Masukkan teks untuk diterjemahkan");
      return;
    }
    setCommittedSign(signText.trim());
  };

  const handleStart = async () => {
    if (!url.trim()) {
      toast.error("Masukkan URL livestream dulu");
      return;
    }
    setStarting(true);
    try {
      const s = await api.post<TranslatorSession>("/api/translator/sessions", {
        sourceUrl: url.trim(),
      });
      setSession(s);
      toast.success("Sesi dibuat", {
        description: "Terjemahan akan muncul saat model AI siap.",
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal membuat sesi";
      toast.error("Gagal", { description: msg });
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-[30px]">
        {/* Header */}
        <div className="flex items-center gap-6 bg-white px-[50px] p-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Live Translator</h1>
            <p className="text-base text-gray-500">
              Translate livestreams to sign language in real-time
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4 bg-white px-[57px] py-[20px] rounded-[10px]">
          <h2 className="font-heading text-2xl font-bold text-black">
            Enter Livestream URL
          </h2>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/"
                className="w-full h-12 rounded-[10px] border border-gray-300 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={starting}
              className="h-12 bg-quinary hover:bg-quinary/90 text-white px-8 rounded-[10px] font-semibold flex items-center gap-2"
            >
              {starting ? "Starting..." : "Start"}{" "}
              <Play className="w-4 h-4 fill-current" />
            </Button>
          </div>
          <p className="text-base text-grey">
            Supports YouTube Live, YouTube videos, Zoom, Google Meet, and other
            livestream platforms
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-[30px] gap-x-[20px]">
          {/* Video Player */}
          <div className="lg:col-span-2 bg-white pt-[35px] px-[30px] rounded-[10px]">
            <div className="bg-senary/30 rounded-[10px] aspect-video relative flex items-center justify-center group overflow-hidden shadow-sm">
              {session && (
                <div className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-black capitalize">
                    {session.status}
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 text-grey/70 px-6 text-center">
                <Video className="w-12 h-12" />
                <p className="font-medium break-all">
                  {session
                    ? session.sourceUrl
                    : "Enter a URL to begin translation"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex bg-white py-[45px] px-[30px] rounded-[10px] flex-col gap-[30px]">
            {/* Translator Avatar */}
            <div className="flex flex-col gap-4">
              <h3 className="font-heading text-2xl font-bold text-black">
                Translator Avatar
              </h3>
              <div className="bg-senary/30 rounded-[10px] shadow-sm aspect-video lg:aspect-square">
                <SignPoseViewer
                  text={committedSign}
                  className="w-full h-full"
                  placeholder="Ketik teks lalu tekan Translate untuk melihat bahasa isyarat"
                />
              </div>

              {/* Input teks -> bahasa isyarat */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signText}
                  onChange={(e) => setSignText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSign()}
                  placeholder="e.g. HELLO"
                  className="flex-1 h-11 rounded-[10px] border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
                />
                <Button
                  onClick={handleSign}
                  className="h-11 bg-quinary hover:bg-quinary/90 text-white px-5 rounded-[10px] font-semibold flex items-center gap-2"
                >
                  <Hand className="w-4 h-4" /> Sign
                </Button>
              </div>
            </div>

            {/* Transcript */}
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-[#C5FBF9] to-secondary p-4 rounded-t-[10px] flex justify-between items-center">
                <span className="font-bold text-black">Video Transcript</span>
              </div>
              <div className="bg-white border-x border-b border-gray-100 rounded-b-[10px] py-[45px] px-[30px] shadow-sm">
                <div className="flex flex-col gap-4 text-sm text-grey leading-relaxed">
                  {session?.transcript && session.transcript.length > 0 ? (
                    session.transcript.map((line, i) => <p key={i}>{line}</p>)
                  ) : session ? (
                    <p className="text-center text-grey/70">
                      Translation in progress — the transcript will appear here
                      once the AI model is ready (status: {session.status}).
                    </p>
                  ) : (
                    <p className="text-center text-grey/70">
                      Start a session to generate a transcript.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
