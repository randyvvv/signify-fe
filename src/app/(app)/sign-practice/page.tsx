"use client";

import {
	ChevronLeft,
	Maximize2,
	Hand,
	Presentation,
	Briefcase,
	Building2,
	XCircle,
	Circle,
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

const categories = [
	{
		name: "Sign Language Basics",
		icon: Hand,
		description: "Everyday greetings & essential words",
	},
	{
		name: "School Presentations",
		icon: Presentation,
		description: "Phrases for presenting in class",
	},
	{
		name: "Job Interview",
		icon: Briefcase,
		description: "Introduce yourself & answer questions",
	},
	{
		name: "Bussiness Pitching",
		icon: Building2,
		description: "Pitch your idea with confidence",
	},
];

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

	return (
		<>
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex items-center gap-4 bg-white p-4 shadow-sm">
					{selectedCategory ? (
						<button
							onClick={backToModules}
							className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
						>
							<ChevronLeft className="h-6 w-6 text-black" />
						</button>
					) : (
						<Link
							href="/dashboard"
							className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
						>
							<ChevronLeft className="h-6 w-6 text-black" />
						</Link>
					)}
					<div>
						<h1 className="text-xl font-bold text-black">
							{selectedCategory ?? "Sign Practice"}
						</h1>
						<p className="text-sm text-grey">
							{selectedCategory
								? "Practice with real time AI feedback"
								: "Choose a topic to start practicing"}
						</p>
					</div>
				</div>

				{!selectedCategory ? (
					/* ===== Layar pilih modul: 4 kategori sebagai kartu ===== */
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-[25px]">
						{categories.map((category) => (
							<button
								key={category.name}
								onClick={() => openModule(category.name)}
								className="group flex flex-col gap-4 bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 text-left transition-all hover:border-quinary/40 hover:shadow-md hover:-translate-y-0.5"
							>
								<div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-quaternary">
									<category.icon className="w-7 h-7" />
								</div>
								<div className="flex flex-col gap-1">
									<h3 className="font-heading font-bold text-lg text-quaternary">
										{category.name}
									</h3>
									<p className="text-sm text-grey leading-relaxed">
										{category.description}
									</p>
								</div>
								<div className="mt-auto flex items-center justify-between pt-2">
									<span className="text-xs font-medium text-grey">
										{(WORDS[category.name] ?? []).length} signs
									</span>
									<span className="inline-flex items-center gap-1 text-sm font-semibold text-quinary cursor-pointer">
										Start practice
										<ChevronLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
									</span>
								</div>
							</button>
						))}
					</div>
				) : (
				/* ===== Layar latihan untuk modul terpilih ===== */
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-[25px]">
					{/* Left Section */}
					<div className="lg:col-span-2 flex flex-col gap-[25px]">
						{/* Practice Area */}
						<div className="relative aspect-[3/2] rounded-[20px] bg-senary/30 flex items-center justify-center group overflow-hidden">
							{!isPracticeActive ? (
								<>
									<Button
										onClick={startCamera}
										className="bg-quinary hover:bg-quinary/90 text-white px-8 py-6 text-lg rounded-xl font-semibold shadow-lg transition-transform hover:scale-105"
									>
										Start Sign Practice
									</Button>

									<button className="absolute bottom-6 right-6 p-2 rounded-lg hover:bg-black/5 transition-colors text-grey hover:text-quaternary">
										<Maximize2 className="w-6 h-6" />
									</button>
								</>
							) : (
								<div className="relative w-full h-full">
									{/* Video Feed */}
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										className="w-full h-full object-cover transform -scale-x-100"
									/>

									{/* Overlays */}
									{/* Top Left - Category Badge */}
									<div className="absolute top-6 left-6 flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg shadow-sm z-10">
										<Hand className="w-4 h-4 text-quaternary" />
										<span className="font-bold text-quaternary">
											{selectedCategory}
										</span>
									</div>

									{/* Top Right - Goal Badge */}
									<div className="absolute top-12 right-6 bg-tertiary px-6 py-3 rounded-xl shadow-sm z-10 animate-fade-in">
										<span className="font-heading font-bold text-quaternary text-lg tracking-wide">
											GOAL : {currentWord}
										</span>
									</div>

									{/* Dynamic Hand Boxes */}
									{detectedHands.map((hand, index) => (
										<div
											key={index}
											className="absolute border-2 border-red-400 rounded-lg bg-transparent z-10 transition-all duration-75 ease-linear"
											style={{
												left: `${(1 - hand.x - hand.width) * 100}%`,
												top: `${hand.y * 100}%`,
												width: `${hand.width * 100}%`,
												height: `${hand.height * 100}%`,
											}}
										>
											<div className="absolute -top-10 left-0 bg-white px-3 py-1 rounded-md shadow-sm flex items-center gap-2">
												<Hand className="w-4 h-4 text-grey" />
												<span className="text-sm font-medium text-grey">
													{hand.label} Hand
												</span>
											</div>
										</div>
									))}

									{/* Countdown / recording overlay */}
									{recordPhase === "countdown" && (
										<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
											<span className="font-heading text-8xl font-bold text-white drop-shadow-lg">
												{countdown}
											</span>
										</div>
									)}
									{recordPhase === "recording" && (
										<div className="absolute top-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
											<Circle className="h-3 w-3 animate-pulse fill-current" />
											Recording…
										</div>
									)}

									{/* Record Button */}
									<button
										onClick={startRecording}
										disabled={recordPhase !== "idle"}
										className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-lg bg-quinary px-4 py-2 font-medium text-white shadow-lg hover:bg-quinary/90 disabled:opacity-60"
									>
										<Circle className="h-4 w-4 fill-current" />
										<span>
											{currentScore != null ? "Try again" : "Record sign"}
										</span>
									</button>

									{/* End Button */}
									<button
										onClick={stopCamera}
										className="absolute bottom-6 left-6 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg z-20 flex items-center gap-2"
									>
										<span>End</span>
										<XCircle className="w-5 h-5" />
									</button>
								</div>
							)}
						</div>

						{/* Progress Card (di bawah video) */}
						<div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
							<h3 className="font-heading font-bold text-lg mb-6 text-quaternary">
								Progress
							</h3>

							<div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
								{/* Completion Progress */}
								<div className="space-y-2 flex-1">
									<div className="flex items-baseline gap-2">
										<span className="text-2xl font-bold text-quaternary">
											{doneCount}
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Completed
										</span>
									</div>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-tertiary rounded-full"
											style={{
												width: `${(doneCount / practiceWords.length) * 100}%`,
											}}
										/>
									</div>
								</div>

								{/* Good / Bad tally */}
								<div className="space-y-2 flex-1">
									<div className="flex items-baseline gap-2">
										<span className="text-2xl font-bold text-green-500">
											{goodCount}
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Good
										</span>
										<span className="ml-auto text-2xl font-bold text-red-400">
											{badCount}
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Bad
										</span>
									</div>
									<p className="text-xs text-grey">
										Average score {avgScore} · pass at {PASS_SCORE}
									</p>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
										<div
											className="h-full bg-green-400"
											style={{
												width: `${doneCount ? (goodCount / doneCount) * 100 : 0}%`,
											}}
										/>
										<div
											className="h-full bg-red-300"
											style={{
												width: `${doneCount ? (badCount / doneCount) * 100 : 0}%`,
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Section - Sidebar */}
					<div className="flex flex-col gap-[25px]">
						{/* Reference Sign Card */}
						<div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
							<h3 className="font-heading font-bold text-lg mb-1 text-quaternary">
								Reference Sign
							</h3>
							<p className="text-sm text-grey mb-4">
								Watch how to sign{" "}
								<span className="font-bold text-quaternary">
									{currentWord}
								</span>
							</p>
							<div className="aspect-square w-full rounded-xl bg-senary/30 overflow-hidden">
								<SignAvatarViewer
									frames={refClip ? refClip.frames : null}
									meta={refClip?.meta}
									loading={refLoading}
									vrmUrl={avatar.vrmUrl}
									hairColor={avatar.hairColor}
									eyeColor={avatar.eyeColor}
									accessory={avatar.accessory}
									className="w-full h-full"
									placeholder={`Sign for "${currentWord}"`}
								/>
							</div>

							{/* Navigasi kata latihan */}
							<div className="mt-4 flex items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-grey">
										Word {wordIndex + 1} / {practiceWords.length}
									</span>
									{currentScore != null && (
										<span
											className={cn(
												"px-2 py-0.5 rounded-full text-xs font-bold",
												currentScore >= PASS_SCORE
													? "bg-green-100 text-green-600"
													: "bg-red-100 text-red-500",
											)}
										>
											{currentScore >= PASS_SCORE ? "Good" : "Bad"} · {currentScore}
										</span>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										disabled={recordPhase !== "idle"}
										onClick={() =>
											setWordIndex(
												(i) =>
													(i - 1 + practiceWords.length) %
													practiceWords.length,
											)
										}
										className="h-9 px-3 rounded-lg"
									>
										Prev
									</Button>
									<Button
										disabled={recordPhase !== "idle"}
										onClick={() =>
											setWordIndex((i) => (i + 1) % practiceWords.length)
										}
										className="h-9 px-4 rounded-lg bg-quinary hover:bg-quinary/90 text-white"
									>
										Next word
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
				)}
			</div>
		</>
	);
}
