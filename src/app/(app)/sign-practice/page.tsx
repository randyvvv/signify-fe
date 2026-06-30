"use client";

import {
	ChevronLeft,
	Maximize2,
	Hand,
	Presentation,
	Briefcase,
	Building2,
	XCircle,
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

		// Simpan hasil sesi (placeholder skor — scoring real menyusul).
		const durationSeconds = practiceStartRef.current
			? Math.round((nowMs() - practiceStartRef.current) / 1000)
			: 0;
		api
			.post("/api/sign-practice/sessions", {
				category: selectedCategory,
				goalWord: currentWord,
				completedCount: doneCount,
				totalCount: practiceWords.length,
				accuracy,
				durationSeconds,
			})
			.then(() => {
				toast.success("Practice session saved");
			})
			.catch(() => {});
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
					// Tandai kata aktif "diperagakan" begitu ada tangan terdeteksi.
					if (newHands.length > 0) handSeenRef.current = true;
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

	// Progres sesi (FE-only): hasil Good/Bad per kata yang sudah dilewati.
	// Good/Bad ditentukan dari apakah tangan user terdeteksi saat memperagakan
	// kata (placeholder klasifikasi isyarat) — bukan angka acak seperti dulu.
	const [done, setDone] = useState<Record<number, "good" | "bad">>({});
	const doneCount = Object.keys(done).length;
	const goodCount = Object.values(done).filter((v) => v === "good").length;
	const badCount = doneCount - goodCount;
	// Disimpan ke API (kontrak lama pakai angka): persen Good yang nyata.
	const accuracy = doneCount ? Math.round((goodCount / doneCount) * 100) : 0;

	// Apakah tangan terdeteksi untuk kata yang sedang aktif? Direset tiap ganti kata.
	const handSeenRef = useRef(false);

	useEffect(() => {
		if (!selectedCategory) return;
		setPracticeWords(shuffle(WORDS[selectedCategory] ?? ["HELLO"]));
		setWordIndex(0);
		setDone({});
	}, [selectedCategory]);


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
								onClick={() => {
									handSeenRef.current = false;
									setSelectedCategory(category.name);
								}}
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
									text={currentWord}
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
									{done[wordIndex] && (
										<span
											className={cn(
												"px-2 py-0.5 rounded-full text-xs font-bold",
												done[wordIndex] === "good"
													? "bg-green-100 text-green-600"
													: "bg-red-100 text-red-500",
											)}
										>
											{done[wordIndex] === "good" ? "Good" : "Bad"}
										</span>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => {
											handSeenRef.current = false;
											setWordIndex(
												(i) =>
													(i - 1 + practiceWords.length) %
													practiceWords.length,
											);
										}}
										className="h-9 px-3 rounded-lg"
									>
										Prev
									</Button>
									<Button
										onClick={() => {
											// Good bila tangan terdeteksi saat kata ini aktif, Bad bila tidak.
											if (done[wordIndex] == null) {
												const result = handSeenRef.current
													? "good"
													: "bad";
												setDone((d) => ({
													...d,
													[wordIndex]: result,
												}));
												if (result === "good")
													toast.success("Good sign! 👍");
												else
													toast.error(
														"No hand detected — try the sign 👋",
													);
											}
											handSeenRef.current = false;
											setWordIndex(
												(i) => (i + 1) % practiceWords.length,
											);
										}}
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
