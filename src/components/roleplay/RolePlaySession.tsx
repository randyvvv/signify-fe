"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Camera, Circle, Hand, Loader2, RefreshCw, RotateCcw, Send, Trophy, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignAvatarViewer } from "@/components/shared";
import { SignaAvatar } from "@/components/coach/SignaAvatar";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { translateToPose, type PoseClip } from "@/components/shared/avatar/translate";
import { PASS_SCORE, referenceFeatures, scoreSign } from "@/components/shared/avatar/signScore";
import { useSpeaker } from "@/components/translator/useSpeaker";
import { api, ApiError } from "@/lib/api";
import {
  roleplayApi,
  type RolePlayLang,
  type RolePlayMessage,
  type RolePlayReply,
  type RolePlayScenario,
  type RolePlayTurn,
} from "@/lib/roleplay";
import { cn } from "@/lib/utils";
import { useHandRecorder } from "./useHandRecorder";

// Durasi rekaman mengikuti panjang klip referensi (frasa bisa 2-3 isyarat), 2..8 detik.
function recordSeconds(clip: PoseClip | null): number {
  if (!clip || !clip.frames.length) return 3;
  const secs = clip.frames.length / (clip.meta.fps || 25) + 0.5;
  return Math.min(8, Math.max(2, secs));
}

/** Balasan buatan sendiri -> gloss: 3 kata pertama, huruf besar, tanpa tanda baca. */
function toGloss(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

type Message = RolePlayMessage & { id: string };
interface Attempt {
  score: number;
  coverage: number;
}

let messageSeq = 0;
const nextId = () => `rp${++messageSeq}`;

/**
 * Satu sesi role play: Signa membacakan & memperagakan kalimatnya, pelajar
 * memilih (atau menulis) balasan, melihat cara mengisyaratkannya, lalu merekam
 * isyaratnya untuk dinilai. Di akhir, hasilnya disimpan sebagai sesi latihan.
 */
export function RolePlaySession({
  scenario,
  lang,
  onExit,
  onRestart,
}: {
  scenario: RolePlayScenario;
  lang: RolePlayLang;
  onExit: () => void;
  onRestart: () => void;
}) {
  const avatar = useEquippedAvatar();
  const recorder = useHandRecorder();
  const { speak, stop: stopSpeaking } = useSpeaker({ voice: "female", lang });

  const [voiceOn, setVoiceOn] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turn, setTurn] = useState<RolePlayTurn | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<RolePlayReply | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<{ word: string; score: number }[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [custom, setCustom] = useState("");
  const [coins, setCoins] = useState<number | null>(null);
  const [clips, setClips] = useState<Record<string, PoseClip | null>>({});
  const inflight = useRef(new Set<string>());
  const opened = useRef(false);
  const startedAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const learnerTurns = messages.filter((m) => m.from === "learner").length;
  const busy = recorder.phase !== "idle";
  const done = !!turn?.done;

  // Avatar: kalimat Signa, atau contoh isyarat balasan yang dipilih.
  const avatarText = showDemo && target ? target.gloss : (turn?.line ?? null);
  const clip = avatarText ? clips[avatarText] : undefined;
  const refClip = target ? clips[target.gloss] : undefined;

  useEffect(() => {
    if (!avatarText || avatarText in clips || inflight.current.has(avatarText)) return;
    const text = avatarText;
    inflight.current.add(text);
    // Penyedia pose (sign.mt) kadang gagal sesaat: coba sekali lagi, kecuali memang tidak ada isyaratnya (404).
    translateToPose(text, undefined, lang)
      .catch(async (err) => {
        if (err instanceof ApiError && err.status === 404) throw err;
        await new Promise((r) => setTimeout(r, 1500));
        return translateToPose(text, undefined, lang);
      })
      .then((c) => setClips((prev) => ({ ...prev, [text]: c })))
      .catch(() => setClips((prev) => ({ ...prev, [text]: null })));
  }, [avatarText, clips, lang]);

  useEffect(() => {
    const list = listRef.current;
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, waiting]);

  const saveSession = useCallback(
    (list: { word: string; score: number }[]) => {
      api
        .post<{ pointsEarned?: number }>("/api/sign-practice/sessions", {
          category: `Role play · ${scenario.title.en}`,
          totalCount: scenario.turns,
          attempts: list,
          durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        })
        .then((res) => setCoins(res?.pointsEarned ?? 0))
        .catch(() => toast.error("Couldn't save this practice"));
    },
    [scenario],
  );

  const applyTurn = useCallback(
    (next: RolePlayTurn) => {
      const id = nextId();
      setTurn(next);
      setMessages((m) => [...m, { id, from: "signa", text: next.line }]);
      setTarget(null);
      setAttempt(null);
      setShowDemo(false);
      setCustom("");
      if (voiceOn) void speak(id, next.line);
    },
    [voiceOn, speak],
  );

  // Kalimat pembuka (sekali per sesi).
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    startedAt.current = Date.now();
    roleplayApi
      .turn(scenario.id, lang, [])
      .then(applyTurn)
      .catch(() => setFailed(true))
      .finally(() => setWaiting(false));
  }, [scenario.id, lang, applyTurn]);

  const requestTurn = async (history: Message[], list: { word: string; score: number }[]) => {
    setWaiting(true);
    setFailed(false);
    try {
      const next = await roleplayApi.turn(
        scenario.id,
        lang,
        history.map(({ from, text, score }) => ({ from, text, score })),
      );
      applyTurn(next);
      if (next.done) saveSession(list);
    } catch {
      setFailed(true);
    } finally {
      setWaiting(false);
    }
  };

  const choose = (reply: RolePlayReply) => {
    setTarget(reply);
    setAttempt(null);
    setShowDemo(true);
  };

  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
    const text = custom.trim();
    const gloss = toGloss(text);
    if (text && gloss) choose({ text, gloss });
  };

  const startCamera = async () => {
    try {
      await recorder.startCamera();
    } catch {
      toast.error("Could not access camera", {
        description: "Please allow camera permissions in your browser settings.",
      });
    }
  };

  const recordAttempt = async () => {
    if (!target || busy) return;
    const reference = refClip ?? null;
    setShowDemo(true);
    const recorded = await recorder.record(recordSeconds(reference));
    const result = scoreSign(recorded, reference ? referenceFeatures(reference) : []);
    setAttempt({ score: result.score, coverage: result.coverage });
  };

  const sendReply = (signed: boolean) => {
    if (!target || waiting || busy) return;
    const score = signed && attempt ? attempt.score : null;
    const history: Message[] = [...messages, { id: nextId(), from: "learner", text: target.text, score }];
    const list = score != null ? [...attempts, { word: target.gloss, score }] : attempts;
    setMessages(history);
    setAttempts(list);
    setTarget(null);
    setAttempt(null);
    setShowDemo(false);
    stopSpeaking();
    void requestTurn(history, list);
  };

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn(!voiceOn);
  };

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ===== Signa ===== */}
      <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 lg:col-span-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <SignaAvatar className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-heading font-bold text-slate-800">Signa</p>
              <p className="truncate text-xs text-slate-500">{scenario.title[lang]}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {done ? "Finished" : `Reply ${Math.min(learnerTurns + 1, scenario.turns)} of ${scenario.turns}`}
            </span>
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceOn ? "Mute Signa's voice" : "Turn on Signa's voice"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition-colors hover:text-[#0B7077]"
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <SignAvatarViewer
          frames={clip?.frames ?? null}
          meta={clip?.meta}
          loading={!!avatarText && clip === undefined}
          playing={!!clip}
          vrmUrl={avatar.vrmUrl}
          hairColor={avatar.hairColor}
          eyeColor={avatar.eyeColor}
          accessory={avatar.accessory}
          placeholder=""
          className="h-[320px] w-full bg-gradient-to-b from-[#E7F3F2] to-white md:h-[400px]"
        />

        <div className="border-t border-slate-100 px-5 py-4">
          {target && !done && (
            <div role="tablist" aria-label="What the avatar shows" className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
              {[
                { demo: false, label: "Signa's line" },
                { demo: true, label: "How to sign your reply" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={showDemo === tab.demo}
                  onClick={() => setShowDemo(tab.demo)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                    showDemo === tab.demo ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {showDemo && target ? (
            <>
              <p className="text-xs font-semibold text-slate-500">Sign this</p>
              <p className="mt-1 font-heading text-2xl font-bold text-[#0F5A5A]">{target.gloss}</p>
              <p className="text-sm text-slate-500">&ldquo;{target.text}&rdquo;</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-500">Signa says</p>
              <p className="mt-1 text-lg font-semibold leading-snug text-slate-800">
                {turn?.line ?? (failed ? "Signa couldn't start the conversation." : "…")}
              </p>
            </>
          )}
          {clip === null && (
            <p className="mt-2 text-xs text-amber-700">There&apos;s no sign animation for this yet.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-7">
        {/* ===== Percakapan ===== */}
        <div
          ref={listRef}
          aria-live="polite"
          className="flex max-h-[340px] min-h-[200px] flex-col gap-3 overflow-y-auto rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          {messages.map((m) =>
            m.from === "signa" ? (
              <div key={m.id} className="flex max-w-[85%] items-end gap-2 self-start">
                <SignaAvatar className="h-7 w-7 shrink-0" />
                <div className="rounded-2xl rounded-bl-md bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 ring-1 ring-slate-100">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex max-w-[85%] flex-col items-end self-end">
                <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] px-4 py-2.5 text-sm font-semibold text-white">
                  {m.text}
                </div>
                <span
                  className={cn(
                    "mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    m.score == null
                      ? "bg-slate-100 text-slate-500"
                      : m.score >= PASS_SCORE
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                  )}
                >
                  {m.score == null ? "Not signed" : `Signed · ${m.score}`}
                </span>
              </div>
            ),
          )}
          {waiting && (
            <div className="flex items-center gap-2 self-start text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Signa is thinking…
            </div>
          )}
        </div>

        {done && turn ? (
          /* ===== Ringkasan ===== */
          <div className="rounded-3xl bg-gradient-to-br from-[#C5FBF9] to-[#FDF5BF] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FD661F] shadow-sm">
                <Trophy className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900">Conversation complete!</h2>
            </div>
            {turn.summary && <p className="mt-3 leading-relaxed text-slate-700">{turn.summary}</p>}

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Replies signed", value: `${attempts.length}/${scenario.turns}` },
                { label: "Average score", value: avgScore == null ? "–" : String(avgScore) },
                { label: "Coins earned", value: coins == null ? "…" : `+${coins}` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/70 px-3 py-3 text-center">
                  <p className="font-heading text-2xl font-bold text-[#0F5A5A]">{stat.value}</p>
                  <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {attempts.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-600">Signs you practiced</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {attempts.map((a, i) => (
                    <li
                      key={`${a.word}-${i}`}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      {a.word}
                      <span className={a.score >= PASS_SCORE ? "text-emerald-600" : "text-amber-600"}>{a.score}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-600">They were added to My Signs so you can review them later.</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                onClick={onRestart}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 font-semibold text-white hover:opacity-95"
              >
                <RotateCcw className="h-4 w-4" /> Practice again
              </Button>
              <Button variant="outline" onClick={onExit} className="h-11 rounded-xl bg-white/70 px-5 font-semibold">
                Choose another situation
              </Button>
              <Button asChild variant="ghost" className="h-11 rounded-xl px-4 font-semibold text-[#0B7077]">
                <Link href="/my-signs">Review in My Signs</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* ===== Giliran pelajar ===== */
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-heading text-lg font-bold text-slate-800">Your turn</h2>
            <p className="text-xs text-slate-500">
              Pick a reply, watch how to sign it, then sign it to the camera.
            </p>

            {failed ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Signa couldn&apos;t answer. Check your connection and try again.
                <Button
                  variant="outline"
                  onClick={() => (turn ? requestTurn(messages, attempts) : onRestart())}
                  className="h-9 rounded-xl bg-white"
                >
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(turn?.replies ?? []).map((r) => {
                    const selected = target?.text === r.text;
                    return (
                      <button
                        key={r.text}
                        type="button"
                        onClick={() => choose(r)}
                        disabled={waiting || busy}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-left ring-1 transition-colors disabled:opacity-50",
                          selected
                            ? "bg-[#0B7077] text-white ring-[#0B7077]"
                            : "bg-white text-slate-700 ring-slate-200 hover:ring-[#2DA5A2]",
                        )}
                      >
                        <span className="block text-sm font-semibold">{r.text}</span>
                        <span className={cn("block text-xs", selected ? "text-white/75" : "text-slate-500")}>
                          {r.gloss}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={submitCustom} className="mt-3 flex gap-2">
                  <label htmlFor="roleplay-custom" className="sr-only">
                    Write your own reply
                  </label>
                  <input
                    id="roleplay-custom"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    maxLength={120}
                    disabled={waiting || busy || !turn}
                    placeholder="Or write your own reply"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2DA5A2]/20"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!toGloss(custom) || waiting || busy}
                    className="h-10 rounded-xl px-4 font-semibold"
                  >
                    Use
                  </Button>
                </form>
              </>
            )}

            {/* Kamera selalu terpasang supaya stream tidak terputus antar giliran. */}
            <div className={cn("mt-5 grid gap-4 md:grid-cols-2", failed && "hidden")}>
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {recorder.cameraOn ? (
                  <video
                    ref={recorder.videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 object-cover"
                  />
                ) : (
                  <Button
                    onClick={startCamera}
                    className="h-10 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-4 font-semibold text-white hover:opacity-95"
                  >
                    <Camera className="h-4 w-4" /> Start camera
                  </Button>
                )}
                {recorder.phase === "countdown" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="font-heading text-6xl font-bold text-white drop-shadow-lg">{recorder.countdown}</span>
                  </div>
                )}
                {recorder.phase === "recording" && (
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#DF5D73] px-3 py-1 text-xs font-semibold text-white">
                    <Circle className="h-2.5 w-2.5 animate-pulse fill-current" /> Recording
                  </span>
                )}
                {recorder.cameraOn && recorder.phase === "idle" && (
                  <span
                    className={cn(
                      "absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      recorder.handsVisible ? "bg-emerald-100 text-emerald-700" : "bg-white/90 text-slate-600",
                    )}
                  >
                    <Hand className="h-3.5 w-3.5" /> {recorder.handsVisible ? "Hands visible" : "Show your hands"}
                  </span>
                )}
              </div>

              <div className="flex flex-col justify-between gap-3">
                <div>
                  {target ? (
                    <p className="text-sm text-slate-600">
                      Sign <span className="font-heading font-bold text-[#0F5A5A]">{target.gloss}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Pick a reply first.</p>
                  )}
                  {attempt ? (
                    <p
                      className={cn(
                        "mt-2 rounded-xl px-3 py-2 text-sm font-medium",
                        attempt.coverage < 0.3
                          ? "bg-rose-50 text-rose-700"
                          : attempt.score >= PASS_SCORE
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800",
                      )}
                    >
                      {attempt.coverage < 0.3
                        ? "We couldn't see your hands. Keep them inside the frame and try again."
                        : attempt.score >= PASS_SCORE
                          ? `Clear sign! Score ${attempt.score}.`
                          : `Score ${attempt.score}. Watch the sign again and retry, or send it anyway.`}
                    </p>
                  ) : (
                    target && (
                      <p className="mt-2 text-xs text-slate-500">
                        {recorder.loadFailed
                          ? "Hand tracking couldn't load, so you can send your reply without signing."
                          : "Press Record, wait for the countdown, then sign."}
                      </p>
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={recordAttempt}
                    disabled={!target || !recorder.cameraOn || !recorder.ready || busy || refClip === undefined}
                    className="h-10 rounded-xl px-4 font-semibold"
                  >
                    {busy || (target && refClip === undefined) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Circle className="h-4 w-4 fill-[#DF5D73] text-[#DF5D73]" />
                    )}
                    {busy ? "Recording…" : attempt ? "Try again" : "Record"}
                  </Button>
                  <Button
                    onClick={() => sendReply(true)}
                    disabled={!attempt || waiting || busy}
                    className="h-10 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-4 font-semibold text-white hover:opacity-95"
                  >
                    <Send className="h-4 w-4" /> Send reply
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => sendReply(false)}
                  disabled={!target || waiting || busy}
                  className="self-start text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:opacity-40"
                >
                  Send without signing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
