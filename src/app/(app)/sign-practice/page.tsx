"use client";

import {
	ChevronLeft,
	Maximize2,
	Hand,
	Presentation,
	Briefcase,
	Building2,
	X,
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

interface PracticeProgress {
	avgAccuracy: number;
	totalCompleted: number;
	sessions: number;
}

// Kata target yang harus diperagakan user pada sesi latihan.
const GOAL_WORD = "WELCOME";

// di luar komponen supaya tidak kena aturan purity React (dipakai di event handler)
const nowMs = () => Date.now();

const categories = [
	{ name: "Sign Language Basics", icon: Hand },
	{ name: "School Presentations", icon: Presentation },
	{ name: "Job Interview", icon: Briefcase },
	{ name: "Bussiness Pitching", icon: Building2 },
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

	// Progres latihan (agregat dari API) + waktu mulai sesi.
	const practiceStartRef = useRef<number>(0);
	const [progress, setProgress] = useState<PracticeProgress | null>(null);

	// Avatar VRM + kustomisasi user (sama dengan shop & live-translator).
	const avatar = useEquippedAvatar();

	const loadProgress = () => {
		api
			.get<PracticeProgress>("/api/sign-practice")
			.then(setProgress)
			.catch(() => {});
	};

	useEffect(() => {
		loadProgress();
	}, []);

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
				goalWord: GOAL_WORD,
				completedCount: 1,
				totalCount: 1,
				accuracy: 80,
				durationSeconds,
			})
			.then(() => {
				toast.success("Practice session saved");
				loadProgress();
			})
			.catch(() => {});
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
	const [showTutorial, setShowTutorial] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState(
		categories[0].name,
	);

	return (
		<>
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex items-center gap-4 bg-white p-4 shadow-sm">
					<Link
						href="/dashboard"
						className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
					>
						<ChevronLeft className="h-6 w-6 text-black" />
					</Link>
					<div>
						<h1 className="text-xl font-bold text-black">
							Sign Practice
						</h1>
						<p className="text-sm text-grey">
							Practice with real time AI feedback{" "}
						</p>
					</div>
				</div>

				{/* Content */}
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
											GOAL : {GOAL_WORD}
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

									{/* Bottom - Feedback Card */}
									<div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white w-[80%] rounded-xl p-4 shadow-lg flex items-center justify-between z-10">
										<div className="flex items-center gap-4">
											<div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center">
												<span className="text-xl">✏️</span>
											</div>
											<div>
												<h4 className="font-bold text-quaternary">
													Improving...
												</h4>
												<p className="text-sm text-grey">
													Adjust your left and right hand
													to be slightly higher
												</p>
											</div>
										</div>
										<div className="h-6 w-11 bg-quaternary rounded-full relative cursor-pointer">
											<div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
										</div>
									</div>

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
											{progress?.totalCompleted ?? 0}
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Completed
										</span>
									</div>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-tertiary rounded-full"
											style={{
												width: `${Math.min(100, (progress?.totalCompleted ?? 0) * 10)}%`,
											}}
										/>
									</div>
								</div>

								{/* Accuracy Progress */}
								<div className="space-y-2 flex-1">
									<div className="flex items-baseline gap-2">
										<span className="text-2xl font-bold text-quaternary">
											{progress?.avgAccuracy ?? 0}%
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Accuracy
										</span>
									</div>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-orange-400 rounded-full"
											style={{ width: `${progress?.avgAccuracy ?? 0}%` }}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Section - Sidebar */}
					<div className="flex flex-col gap-[25px]">
						{/* Select Category Card */}
						<div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 mt-2 relative">
							{/* Tutorial Overlay */}
							{showTutorial && (
								<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full -mt-4 w-max z-50 animate-bounce-slow">
									<div className="bg-tertiary px-[12px] py-[6px] rounded-[6.3px] shadow-lg relative max-w-[370px]">
										<p className="text-sm font-medium text-quaternary text-center leading-relaxed">
											Select a scenario to practice
											real-life sign language
											conversations.
										</p>
										{/* Arrow */}
										<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-tertiary rotate-45"></div>

										<button
											onClick={() =>
												setShowTutorial(false)
											}
											className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm hover:bg-slate-50"
										>
											<X className="w-3 h-3 text-quaternary" />
										</button>
									</div>
								</div>
							)}

							<h3 className="font-heading font-bold text-lg mb-4 text-quaternary">
								Select Category
							</h3>
							<div className="flex flex-col gap-3">
								{categories.map((category) => {
									const isActive =
										selectedCategory === category.name;
									return (
										<button
											key={category.name}
											onClick={() =>
												setSelectedCategory(
													category.name,
												)
											}
											className={cn(
												"flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full border",
												isActive
													? "bg-secondary border-secondary shadow-sm"
													: "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100",
											)}
										>
											<div
												className={cn(
													"w-10 h-10 rounded-lg flex items-center justify-center",
													isActive
														? "text-quaternary bg-white/50"
														: "text-grey bg-slate-100",
												)}
											>
												<category.icon className="w-5 h-5" />
											</div>
											<span
												className={cn(
													"font-medium",
													isActive
														? "text-quaternary font-bold"
														: "text-grey",
												)}
											>
												{category.name}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						{/* Reference Sign Card */}
						<div className="order-first bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
							<h3 className="font-heading font-bold text-lg mb-1 text-quaternary">
								Reference Sign
							</h3>
							<p className="text-sm text-grey mb-4">
								Watch how to sign{" "}
								<span className="font-bold text-quaternary">
									{GOAL_WORD}
								</span>
							</p>
							<div className="aspect-square w-full rounded-xl bg-senary/30 overflow-hidden">
								<SignAvatarViewer
									text={GOAL_WORD}
									vrmUrl={avatar.vrmUrl}
									hairColor={avatar.hairColor}
									eyeColor={avatar.eyeColor}
									accessory={avatar.accessory}
									className="w-full h-full"
									placeholder={`Sign for "${GOAL_WORD}"`}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
