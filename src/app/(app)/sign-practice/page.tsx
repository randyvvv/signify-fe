"use client";

import {
	ArrowRight,
	Briefcase,
	Building2,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	Circle,
	Eye,
	Hand,
	Layers,
	Lightbulb,
	Presentation,
	Target,
	Video,
	X,
	XCircle,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { translateToPose, type PoseClip } from "@/components/shared/avatar/translate";
import {
	PASS_SCORE,
	referenceFeatures,
	scoreSign,
	type Point2,
} from "@/components/shared/avatar/signScore";

// Durasi rekaman: ikuti panjang klip referensi, dibatasi 2..6 detik.
const COUNTDOWN_SECONDS = 3;
function recordSeconds(clip: PoseClip | null): number {
	if (!clip || !clip.frames.length) return 3;
	const secs = clip.frames.length / (clip.meta.fps || 25) + 0.5;
	return Math.min(6, Math.max(2, secs));
}

// Kata-kata yang diperagakan avatar per kategori (FE-only, untuk demo).
const WORDS: Record<string, string[]> = {
	"Sign Language Basics": ["HELLO", "THANK YOU", "YES", "NO", "PLEASE", "SORRY", "GOOD", "LOVE"],
	"School Presentations": ["HELLO", "TODAY", "LEARN", "QUESTION", "THANK YOU", "FINISH"],
	"Job Interview": ["HELLO", "NAME", "WORK", "EXPERIENCE", "THANK YOU", "YES"],
	"Bussiness Pitching": ["HELLO", "MONEY", "IDEA", "GROW", "TEAM", "THANK YOU"],
};

// Acak urutan kata (Fisher–Yates).
function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// di luar komponen supaya tidak kena aturan purity React (dipakai di event handler)
const nowMs = () => Date.now();

// `name` dikirim ke backend sebagai kategori sesi (jangan diubah); `label` hanya tampilan.
const categories: {
	name: string;
	label: string;
	icon: LucideIcon;
	description: string;
	tone: string;
}[] = [
	{
		name: "Sign Language Basics",
		label: "Sign Language Basics",
		icon: Hand,
		description: "Everyday greetings & essential words",
		tone: "bg-teal-50 text-teal-600",
	},
	{
		name: "School Presentations",
		label: "School Presentations",
		icon: Presentation,
		description: "Phrases for presenting in class",
		tone: "bg-violet-50 text-violet-600",
	},
	{
		name: "Job Interview",
		label: "Job Interview",
		icon: Briefcase,
		description: "Introduce yourself & answer questions",
		tone: "bg-rose-50 text-rose-500",
	},
	{
		name: "Bussiness Pitching",
		label: "Business Pitching",
		icon: Building2,
		description: "Pitch your idea with confidence",
		tone: "bg-amber-50 text-amber-600",
	},
];

const HOW_IT_WORKS: { icon: LucideIcon; title: string; desc: string }[] = [
	{ icon: Eye, title: "Watch", desc: "The avatar shows each sign" },
	{ icon: Video, title: "Record", desc: "Copy it in front of your camera" },
	{ icon: Target, title: "Get scored", desc: `Score ${PASS_SCORE}+ to pass a word` },
];

// Cincin skor rata-rata (versi kecil ProgressRing di dashboard).
function ScoreRing({ value, tone }: { value: number; tone: string }) {
	const r = 42;
	const c = 2 * Math.PI * r;
	const v = Math.min(100, Math.max(0, value));
	return (
		<svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
			<circle cx="50" cy="50" r={r} strokeWidth="10" className="fill-none stroke-slate-100" />
			{v > 0 && (
				<circle
					cx="50"
					cy="50"
					r={r}
					strokeWidth="10"
					strokeLinecap="round"
					strokeDasharray={c}
					strokeDashoffset={c - (v / 100) * c}
					className={cn("fill-none transition-[stroke-dashoffset] duration-700 ease-out", tone)}
				/>
			)}
		</svg>
	);
}

export default function SignPracticePage() {
	// Camera State
	const [isPracticeActive, setIsPracticeActive] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	// MediaPipe State
	const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
		null,
	);
	const [detectedHands, setDetectedHands] = useState<
		{ x: number; y: number; width: number; height: number; label: string }[]
	>([]);

	// Waktu mulai sesi (untuk durasi).
	const practiceStartRef = useRef<number>(0);

	// Rekaman tangan untuk kata aktif: per frame, daftar tangan (21 titik).
	const recordingRef = useRef(false);
	const recordedRef = useRef<Point2[][][]>([]);
	const [recordPhase, setRecordPhase] = useState<"idle" | "countdown" | "recording">("idle");
	const [countdown, setCountdown] = useState(0);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const clearTimers = () => {
		timersRef.current.forEach((t) => clearTimeout(t));
		timersRef.current = [];
	};

	// Avatar VRM + kustomisasi user (sama dengan shop & live-translator).
	const avatar = useEquippedAvatar();

	useEffect(() => {
		const initMediaPipe = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
			);
			const landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
					delegate: "GPU",
				},
				runningMode: "VIDEO",
				numHands: 2,
			});
			setHandLandmarker(landmarker);
		};
		initMediaPipe();
	}, []);

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});
			setStream(mediaStream);
			setIsPracticeActive(true);
			practiceStartRef.current = nowMs();
			toast.success("Camera started successfully!");
		} catch (err) {
			console.error("Error accessing camera:", err);
			toast.error("Could not access camera", {
				description: "Please allow camera permissions in your browser settings."
			});
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setIsPracticeActive(false);

		clearTimers();
		recordingRef.current = false;
		setRecordPhase("idle");

		// Simpan hasil sesi: skor per kata yang sudah direkam.
		const durationSeconds = practiceStartRef.current
			? Math.round((nowMs() - practiceStartRef.current) / 1000)
			: 0;
		api
			.post("/api/sign-practice/sessions", {
				category: selectedCategory,
				goalWord: currentWord,
				totalCount: practiceWords.length,
				attempts: Object.entries(scores).map(([i, score]) => ({
					word: practiceWords[Number(i)],
					score,
				})),
				durationSeconds,
			})
			.then((res) => {
				const coins = (res as { pointsEarned?: number } | null)?.pointsEarned;
				toast.success("Practice session saved", {
					description: coins ? `+${coins} coins earned` : undefined,
				});
			})
			.catch(() => {});
	};

	// Buka modul: siapkan daftar kata (diacak) lalu masuk ke layar latihan.
	const openModule = (name: string) => {
		setPracticeWords(shuffle(WORDS[name] ?? ["HELLO"]));
		setWordIndex(0);
		setScores({});
		setSelectedCategory(name);
	};

	// Kembali ke layar pilih modul (hentikan kamera jika sedang aktif).
	const backToModules = () => {
		if (isPracticeActive) stopCamera();
		setSelectedCategory(null);
	};

	useEffect(() => {
		if (isPracticeActive && stream && videoRef.current) {
			videoRef.current.srcObject = stream;
		}
	}, [isPracticeActive, stream]);

	useEffect(() => {
		let animationFrameId: number;

		const predictWebcam = () => {
			if (
				handLandmarker &&
				videoRef.current &&
				videoRef.current.videoWidth > 0
			) {
				const startTimeMs = performance.now();
				const results = handLandmarker.detectForVideo(
					videoRef.current,
					startTimeMs,
				);

				if (results.landmarks) {
					const newHands = results.landmarks.map(
						(landmarks, index) => {
							const xList = landmarks.map((l) => l.x);
							const yList = landmarks.map((l) => l.y);

							const minX = Math.min(...xList);
							const maxX = Math.max(...xList);
							const minY = Math.min(...yList);
							const maxY = Math.max(...yList);

							return {
								x: minX,
								y: minY,
								width: maxX - minX,
								height: maxY - minY,
								label: results.handedness[index][0]
									.categoryName,
							};
						},
					);
					setDetectedHands(newHands);
					// Saat merekam: simpan titik tangan (x dikali aspect agar skala x = y).
					if (recordingRef.current) {
						const v = videoRef.current;
						const aspect = v.videoWidth / (v.videoHeight || 1);
						recordedRef.current.push(
							results.landmarks.map((hand) =>
								hand.map((l) => ({ x: l.x * aspect, y: l.y })),
							),
						);
					}
				}
			}
			if (isPracticeActive) {
				animationFrameId = requestAnimationFrame(predictWebcam);
			}
		};

		if (isPracticeActive && handLandmarker) {
			predictWebcam();
		}

		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	}, [isPracticeActive, handLandmarker]);

	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [stream]);
	// Modul aktif. null = tampilkan layar pilih modul (4 kategori) dulu;
	// setelah diklik barulah masuk ke layar latihan untuk topik tsb.
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	// Daftar kata latihan (diacak) untuk kategori terpilih + indeks kata aktif.
	const [practiceWords, setPracticeWords] = useState<string[]>([]);
	const [wordIndex, setWordIndex] = useState(0);
	const currentWord = practiceWords[wordIndex] ?? "HELLO";

	// Skor 0..100 per indeks kata, dari pencocokan rekaman tangan dengan pose
	// referensi avatar. Good = skor >= PASS_SCORE.
	const [scores, setScores] = useState<Record<number, number>>({});
	const doneCount = Object.keys(scores).length;
	const goodCount = Object.values(scores).filter((v) => v >= PASS_SCORE).length;
	const badCount = doneCount - goodCount;
	const avgScore = doneCount
		? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / doneCount)
		: 0;
	const currentScore = scores[wordIndex];

	// Klip referensi kata aktif (di-cache per kata): diputar avatar & dipakai menilai.
	// null = gagal diterjemahkan (skor lalu hanya dari deteksi tangan).
	const [clips, setClips] = useState<Record<string, PoseClip | null>>({});
	const refClip = clips[currentWord] ?? null;
	const refLoading = !!selectedCategory && !(currentWord in clips);

	const inflight = useRef(new Set<string>());

	useEffect(() => {
		if (!selectedCategory || currentWord in clips) return;
		const word = currentWord;
		if (inflight.current.has(word)) return;
		inflight.current.add(word);
		translateToPose(word)
			.then((clip) => setClips((prev) => ({ ...prev, [word]: clip })))
			.catch(() => setClips((prev) => ({ ...prev, [word]: null })));
	}, [selectedCategory, currentWord, clips]);

	// Hitung mundur -> rekam selama durasi klip referensi -> nilai.
	const startRecording = () => {
		if (recordPhase !== "idle" || !isPracticeActive) return;
		const idx = wordIndex;
		const clip = refClip;
		setRecordPhase("countdown");
		setCountdown(COUNTDOWN_SECONDS);

		const later = (fn: () => void, ms: number) => {
			timersRef.current.push(setTimeout(fn, ms));
		};
		for (let s = 1; s < COUNTDOWN_SECONDS; s++) {
			later(() => setCountdown(COUNTDOWN_SECONDS - s), s * 1000);
		}

		later(() => {
			recordedRef.current = [];
			recordingRef.current = true;
			setRecordPhase("recording");
			later(() => {
				timersRef.current = [];
				recordingRef.current = false;
				setRecordPhase("idle");

				const result = scoreSign(
					recordedRef.current,
					clip ? referenceFeatures(clip) : [],
				);
				setScores((prev) => ({ ...prev, [idx]: result.score }));
				if (result.score >= PASS_SCORE) {
					toast.success(`Good sign! Score ${result.score} 👍`);
				} else if (result.coverage < 0.3) {
					toast.error("We couldn't see your hands", {
						description: "Keep your hands inside the camera frame and try again.",
					});
				} else {
					toast.error(`Score ${result.score} — keep practicing 💪`, {
						description: "Watch the reference sign and try again.",
					});
				}
			}, recordSeconds(clip) * 1000);
		}, COUNTDOWN_SECONDS * 1000);
	};

	// Batalkan timer rekaman saat halaman ditutup.
	useEffect(() => () => clearTimers(), []);

	// ===== Nilai turunan untuk tampilan =====
	const busy = recordPhase !== "idle";
	const totalWords = practiceWords.length;
	const completion = totalWords ? Math.round((doneCount / totalWords) * 100) : 0;
	const recordSecs = Math.round(recordSeconds(refClip));
	const activeModule = categories.find((c) => c.name === selectedCategory);
	const ModuleIcon = activeModule?.icon ?? Hand;
	const currentPassed = currentScore != null && currentScore >= PASS_SCORE;

	const cameraStatus: { label: string; tone: string; pulse?: boolean } = !handLandmarker
		? { label: "Loading tracker", tone: "bg-amber-100 text-amber-700" }
		: recordPhase === "countdown"
			? { label: "Get ready", tone: "bg-amber-100 text-amber-700" }
			: recordPhase === "recording"
				? { label: "Recording", tone: "bg-rose-100 text-rose-600", pulse: true }
				: isPracticeActive
					? { label: "Camera on", tone: "bg-emerald-100 text-emerald-700" }
					: { label: "Camera off", tone: "bg-slate-100 text-slate-600" };

	const refStatus: { label: string; tone: string } = refLoading
		? { label: "Loading", tone: "bg-amber-100 text-amber-700" }
		: refClip
			? { label: "Ready", tone: "bg-teal-100 text-teal-700" }
			: { label: "Unavailable", tone: "bg-slate-100 text-slate-600" };

	const tips = [
		"Watch the reference sign a couple of times first",
		"Keep your hands inside the frame and in good light",
		`Hold the sign for the whole ~${recordSecs}s recording`,
		"Either hand works — mirrored signs count too",
	];

	const goPrev = () =>
		setWordIndex((i) => (i - 1 + practiceWords.length) % practiceWords.length);
	const goNext = () => setWordIndex((i) => (i + 1) % practiceWords.length);

	return (
		<div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			{!selectedCategory ? (
				/* ===== Layar pilih modul: 4 kategori sebagai kartu ===== */
				<>
					<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
						<div
							className="absolute inset-0 opacity-15 mix-blend-overlay"
							style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
						/>
						<div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
						<div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
						<div className="relative flex flex-col gap-6">
							<div className="flex items-center gap-4">
								<Link
									href="/dashboard"
									aria-label="Back to dashboard"
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
								>
									<ChevronLeft className="h-6 w-6" />
								</Link>
								<div>
									<h1 className="font-heading text-2xl font-bold md:text-3xl">Sign Practice</h1>
									<p className="text-sm text-white/80">
										Sign in front of your camera and get scored against the avatar&apos;s
										reference sign.
									</p>
								</div>
							</div>
							<ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{HOW_IT_WORKS.map((step, i) => (
									<li
										key={step.title}
										className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur"
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
											<step.icon className="h-5 w-5" />
										</div>
										<div className="min-w-0">
											<p className="text-sm font-semibold">
												{i + 1}. {step.title}
											</p>
											<p className="text-xs text-white/75">{step.desc}</p>
										</div>
									</li>
								))}
							</ol>
						</div>
					</div>

					<section>
						<div className="mb-3 flex items-baseline justify-between">
							<h2 className="font-heading text-lg font-bold text-slate-800">Choose a module</h2>
							<span className="text-sm text-slate-500">{categories.length} modules</span>
						</div>
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
							{categories.map((category) => {
								const words = WORDS[category.name] ?? [];
								return (
									<button
										key={category.name}
										onClick={() => openModule(category.name)}
										className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DA5A2]"
									>
										<div
											className={cn(
												"absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-125",
												category.tone,
											)}
										/>
										<div
											className={cn(
												"relative flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
												category.tone,
											)}
										>
											<category.icon className="h-7 w-7" />
										</div>
										<div className="relative flex flex-col gap-1">
											<h3 className="font-heading text-lg font-bold text-slate-800 transition-colors group-hover:text-[#0B7077]">
												{category.label}
											</h3>
											<p className="text-sm leading-relaxed text-slate-500">
												{category.description}
											</p>
										</div>
										<div className="relative flex flex-wrap gap-1.5">
											{words.slice(0, 4).map((w) => (
												<span
													key={w}
													className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
												>
													{w}
												</span>
											))}
											{words.length > 4 && (
												<span className="rounded-full px-1.5 py-1 text-[11px] font-semibold text-slate-400">
													+{words.length - 4} more
												</span>
											)}
										</div>
										<div className="relative mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
											<span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
												<Layers className="h-4 w-4" />
												{words.length} signs
											</span>
											<span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-900/10 transition-transform group-hover:scale-[1.03]">
												Start
												<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
											</span>
										</div>
									</button>
								);
							})}
						</div>
					</section>
				</>
			) : (
				/* ===== Layar latihan untuk modul terpilih ===== */
				<>
					<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-5 text-white shadow-lg shadow-teal-900/10 md:px-8 md:py-6">
						<div
							className="absolute inset-0 opacity-15 mix-blend-overlay"
							style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
						/>
						<div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
						<div className="relative flex flex-col gap-5 md:flex-row md:items-center">
							<div className="flex min-w-0 items-center gap-4">
								<button
									onClick={backToModules}
									aria-label="Back to modules"
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
								>
									<ChevronLeft className="h-6 w-6" />
								</button>
								<div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 sm:flex">
									<ModuleIcon className="h-6 w-6" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-white/70">
										Sign Practice
									</p>
									<h1 className="truncate font-heading text-2xl font-bold md:text-3xl">
										{activeModule?.label ?? selectedCategory}
									</h1>
									<p className="text-sm text-white/80">
										Watch the avatar, then copy the sign on camera
									</p>
								</div>
							</div>
							<div className="w-full rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur md:ml-auto md:w-64">
								<div className="flex items-center justify-between text-xs font-semibold">
									<span>
										Word {wordIndex + 1} of {totalWords}
									</span>
									<span className="text-white/75">{doneCount} signed</span>
								</div>
								<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
									<div
										className="h-full rounded-full bg-[#FFE75C] transition-all duration-500"
										style={{ width: `${completion}%` }}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
						{/* Kolom kiri (di mobile di-"contents" supaya urutan kartu bisa diatur) */}
						<div className="contents lg:col-span-8 lg:flex lg:flex-col lg:gap-6">
							{/* ===== Kamera ===== */}
							<div className="order-1 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none">
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<h2 className="font-heading text-lg font-bold text-slate-800">Your camera</h2>
										<p className="text-xs text-slate-500">
											{COUNTDOWN_SECONDS}s countdown, then ~{recordSecs}s of recording
										</p>
									</div>
									<span
										className={cn(
											"flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
											cameraStatus.tone,
										)}
									>
										<span
											className={cn(
												"h-1.5 w-1.5 rounded-full bg-current",
												cameraStatus.pulse && "animate-pulse",
											)}
										/>
										{cameraStatus.label}
									</span>
								</div>

								<div
									className={cn(
										"relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl sm:aspect-[3/2]",
										isPracticeActive
											? "bg-slate-900"
											: "bg-gradient-to-br from-[#C5FBF9]/50 via-slate-50 to-[#FDF5BF]/60",
									)}
								>
									{!isPracticeActive ? (
										<div className="flex flex-col items-center gap-4 px-6 text-center">
											<div className="relative">
												<div className="absolute -inset-3 rounded-[28px] bg-[#2DA5A2]/10" />
												<div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#2DA5A2] shadow-sm">
													<Camera className="h-8 w-8" />
												</div>
											</div>
											<div>
												<p className="font-heading text-lg font-bold text-slate-800">
													Ready to practice?
												</p>
												<p className="mt-1 max-w-sm text-sm text-slate-500">
													Turn on your camera to sign{" "}
													<span className="font-semibold text-[#0B7077]">{currentWord}</span>.
													Your video stays in your browser.
												</p>
											</div>
											<Button
												onClick={startCamera}
												className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
											>
												<Camera className="h-4 w-4" /> Start camera
											</Button>
										</div>
									) : (
										<div className="relative h-full w-full">
											{/* Video Feed */}
											<video
												ref={videoRef}
												autoPlay
												playsInline
												muted
												className="h-full w-full -scale-x-100 transform object-cover"
											/>

											{/* Goal badge */}
											<div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-2xl bg-[#FFE75C] px-3 py-2 shadow-lg sm:right-4 sm:top-4 sm:px-4">
												<Target className="h-4 w-4 text-[#0B7077]" />
												<span className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:inline">
													Goal
												</span>
												<span className="font-heading text-sm font-bold text-slate-900 sm:text-lg">
													{currentWord}
												</span>
											</div>

											{/* Dynamic Hand Boxes */}
											{detectedHands.map((hand, index) => (
												<div
													key={index}
													className="absolute z-10 rounded-xl border-2 border-[#FFE75C] bg-transparent transition-all duration-75 ease-linear"
													style={{
														left: `${(1 - hand.x - hand.width) * 100}%`,
														top: `${hand.y * 100}%`,
														width: `${hand.width * 100}%`,
														height: `${hand.height * 100}%`,
													}}
												>
													<div className="absolute -top-8 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
														<Hand className="h-3.5 w-3.5 text-[#0B7077]" />
														<span className="text-xs font-semibold text-slate-700">
															{hand.label} Hand
														</span>
													</div>
												</div>
											))}

											{/* Recording pill / hasil skor terakhir */}
											{recordPhase === "recording" ? (
												<div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-[#DF5D73] px-4 py-1.5 text-sm font-semibold text-white shadow-lg sm:left-4 sm:top-4">
													<Circle className="h-3 w-3 animate-pulse fill-current" />
													Recording…
												</div>
											) : (
												currentScore != null &&
												recordPhase === "idle" && (
													<div
														className={cn(
															"absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-in fade-in zoom-in-95 sm:left-4 sm:top-4",
															currentPassed ? "bg-emerald-500" : "bg-[#DF5D73]",
														)}
													>
														{currentPassed ? (
															<Check className="h-3.5 w-3.5" />
														) : (
															<X className="h-3.5 w-3.5" />
														)}
														{currentPassed ? "Good" : "Try again"} · {currentScore}
													</div>
												)
											)}

											{/* Countdown overlay */}
											{recordPhase === "countdown" && (
												<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/35">
													<span
														key={countdown}
														className="font-heading text-8xl font-bold text-white drop-shadow-lg animate-in fade-in zoom-in-50 duration-300"
													>
														{countdown}
													</span>
													<span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur">
														Get ready to sign {currentWord}
													</span>
												</div>
											)}

											{/* Bottom bar: End + Record */}
											<div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gradient-to-t from-black/60 via-black/25 to-transparent p-3 pt-12 sm:p-4 sm:pt-14">
												<Button
													onClick={stopCamera}
													className="h-11 justify-self-start rounded-full bg-white/15 px-4 font-semibold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25 sm:h-12 sm:px-5"
												>
													<XCircle className="h-4 w-4" /> End
												</Button>
												<Button
													onClick={startRecording}
													disabled={busy}
													className="h-11 rounded-full bg-white px-5 font-semibold text-[#0B7077] shadow-lg hover:bg-white/90 sm:h-12 sm:px-6"
												>
													<Circle
														className={cn(
															"h-4 w-4 fill-[#DF5D73] text-[#DF5D73]",
															recordPhase === "recording" && "animate-pulse",
														)}
													/>
													{recordPhase === "countdown"
														? "Get ready…"
														: recordPhase === "recording"
															? "Recording…"
															: currentScore != null
																? "Try again"
																: "Record sign"}
												</Button>
												<span />
											</div>
										</div>
									)}
								</div>
							</div>

							{/* ===== Progres + navigator kata ===== */}
							<div className="order-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none">
								<div className="mb-5 flex items-center justify-between gap-3">
									<div>
										<h2 className="font-heading text-lg font-bold text-slate-800">Session progress</h2>
										<p className="text-xs text-slate-500">
											A score of {PASS_SCORE}+ counts as a good sign
										</p>
									</div>
									<span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
										{doneCount}/{totalWords} signed
									</span>
								</div>

								<div className="flex flex-col gap-6 sm:flex-row sm:items-center">
									<div className="relative mx-auto flex shrink-0 items-center justify-center sm:mx-0">
										<ScoreRing
											value={avgScore}
											tone={avgScore >= PASS_SCORE ? "stroke-emerald-500" : "stroke-[#DF5D73]"}
										/>
										<div className="absolute text-center">
											<p className="font-heading text-2xl font-bold text-slate-800">
												{doneCount ? avgScore : "–"}
											</p>
											<p className="text-[11px] text-slate-500">avg score</p>
										</div>
									</div>

									<div className="flex flex-1 flex-col gap-4">
										<div className="grid grid-cols-3 gap-3">
											{[
												{ label: "Completed", value: `${completion}%`, tone: "bg-teal-50 text-teal-700" },
												{ label: "Good", value: goodCount, tone: "bg-emerald-50 text-emerald-600" },
												{ label: "Needs work", value: badCount, tone: "bg-rose-50 text-rose-500" },
											].map((s) => (
												<div key={s.label} className={cn("rounded-2xl px-3 py-2.5", s.tone)}>
													<p className="font-heading text-xl font-bold">{s.value}</p>
													<p className="text-[11px] font-medium opacity-80">{s.label}</p>
												</div>
											))}
										</div>

										<div>
											<div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
												<span className="flex items-center gap-1.5">
													<span className="h-2 w-2 rounded-full bg-emerald-400" /> Good {goodCount}
												</span>
												<span className="flex items-center gap-1.5">
													Needs work {badCount} <span className="h-2 w-2 rounded-full bg-rose-300" />
												</span>
											</div>
											<div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
												<div
													className="h-full bg-emerald-400 transition-all duration-500"
													style={{
														width: `${doneCount ? (goodCount / doneCount) * 100 : 0}%`,
													}}
												/>
												<div
													className="h-full bg-rose-300 transition-all duration-500"
													style={{
														width: `${doneCount ? (badCount / doneCount) * 100 : 0}%`,
													}}
												/>
											</div>
										</div>
									</div>
								</div>

								<div className="mt-6 border-t border-slate-100 pt-5">
									<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
											Words in this module
										</p>
										<div className="flex items-center gap-3 text-[11px] text-slate-400">
											<span className="flex items-center gap-1">
												<span className="h-2 w-2 rounded-full bg-slate-300" /> Not tried
											</span>
											<span className="flex items-center gap-1">
												<span className="h-2 w-2 rounded-full bg-emerald-500" /> Pass
											</span>
											<span className="flex items-center gap-1">
												<span className="h-2 w-2 rounded-full bg-[#DF5D73]" /> Retry
											</span>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										{practiceWords.map((w, i) => {
											const s = scores[i];
											const state = s == null ? "todo" : s >= PASS_SCORE ? "pass" : "fail";
											return (
												<button
													key={`${w}-${i}`}
													onClick={() => setWordIndex(i)}
													disabled={busy}
													aria-current={i === wordIndex ? "step" : undefined}
													className={cn(
														"flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-semibold transition-all disabled:cursor-not-allowed",
														state === "todo" && "bg-slate-100 text-slate-600 hover:bg-slate-200",
														state === "pass" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
														state === "fail" && "bg-rose-50 text-rose-600 hover:bg-rose-100",
														i === wordIndex && "ring-2 ring-[#2DA5A2] ring-offset-2",
													)}
												>
													<span
														className={cn(
															"flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
															state === "todo" && "bg-white text-slate-500",
															state === "pass" && "bg-emerald-500 text-white",
															state === "fail" && "bg-[#DF5D73] text-white",
														)}
													>
														{state === "pass" ? (
															<Check className="h-3 w-3" />
														) : state === "fail" ? (
															<X className="h-3 w-3" />
														) : (
															i + 1
														)}
													</span>
													{w}
													{s != null && <span className="opacity-70">· {s}</span>}
												</button>
											);
										})}
									</div>
								</div>
							</div>
						</div>

						{/* Kolom kanan */}
						<div className="contents lg:col-span-4 lg:flex lg:flex-col lg:gap-6">
							{/* ===== Reference sign ===== */}
							<div className="order-2 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none">
								<div className="flex items-center justify-between gap-3">
									<div>
										<h2 className="font-heading text-lg font-bold text-slate-800">Reference sign</h2>
										<p className="text-xs text-slate-500">Watch closely, then copy it</p>
									</div>
									<span
										className={cn(
											"flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
											refStatus.tone,
										)}
									>
										<span
											className={cn(
												"h-1.5 w-1.5 rounded-full bg-current",
												refLoading && "animate-pulse",
											)}
										/>
										{refStatus.label}
									</span>
								</div>

								<div className="aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#C5FBF9]/60 to-[#FDF5BF]/60">
									<SignAvatarViewer
										frames={refClip ? refClip.frames : null}
										meta={refClip?.meta}
										loading={refLoading}
										vrmUrl={avatar.vrmUrl}
										hairColor={avatar.hairColor}
										eyeColor={avatar.eyeColor}
										accessory={avatar.accessory}
										className="h-full w-full"
										placeholder={`Sign for "${currentWord}"`}
									/>
								</div>

								<div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
									<div className="min-w-0">
										<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
											Sign this word
										</p>
										<p className="truncate font-heading text-3xl font-bold text-[#0B7077]">
											{currentWord}
										</p>
									</div>
									{currentScore != null && (
										<div
											className={cn(
												"shrink-0 rounded-2xl px-3 py-2 text-center",
												currentPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500",
											)}
										>
											<p className="font-heading text-xl font-bold leading-none">{currentScore}</p>
											<p className="mt-1 text-[10px] font-bold uppercase tracking-wide">
												{currentPassed ? "Good" : "Retry"}
											</p>
										</div>
									)}
								</div>

								<div className="flex items-center gap-3">
									<Button
										variant="outline"
										disabled={busy}
										onClick={goPrev}
										className="h-11 flex-1 rounded-xl border-slate-200 font-semibold text-slate-700"
									>
										<ChevronLeft className="h-4 w-4" /> Prev
									</Button>
									<Button
										disabled={busy}
										onClick={goNext}
										className="h-11 flex-[2] rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
									>
										Next word <ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* ===== Tips ===== */}
							<div className="order-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:order-none">
								<h3 className="flex items-center gap-2 font-heading font-bold text-slate-800">
									<Lightbulb className="h-5 w-5 text-amber-500" /> Tips for a better score
								</h3>
								<ul className="mt-3 space-y-2.5 text-sm text-slate-600">
									{tips.map((tip) => (
										<li key={tip} className="flex gap-2">
											<Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2DA5A2]" />
											{tip}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
