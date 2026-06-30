"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	ChevronLeft,
	ChevronRight,
	FileText,
	Link2,
	Clock,
	CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Draggable from "react-draggable";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";
import { useTranscriptSign } from "@/components/shared/avatar/useTranscriptSign";

// react-youtube pakai window -> klien saja (untuk deteksi play/pause video).
const YouTube = dynamic(() => import("react-youtube"), { ssr: false });

// Ekstrak videoId YouTube dari URL embed/watch/youtu.be.
function parseYouTubeId(input: string): string | null {
	try {
		const u = new URL(input);
		if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
		const v = u.searchParams.get("v");
		if (v) return v;
		const m = u.pathname.match(/\/(embed|live|shorts|v)\/([^/?]+)/);
		return m ? (m[2] ?? null) : null;
	} catch {
		return /^[\w-]{11}$/.test(input) ? input : null;
	}
}

interface Material {
	id: string;
	title: string;
	description: string | null;
	thumbnailUrl: string | null;
	type: "video" | "document" | "article";
	category: string;
	durationMinutes: number | null;
	pages: number | null;
	content: string[] | null;
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

const MATERIAL_IMAGE_FALLBACK = "/learning-materials/image-not-found.png";
const IMAGE_INNER_SHADOW =
	"pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_8px_rgba(0,0,0,0.25)]";

function renderInlineMarkdown(text: string): ReactNode[] {
	const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

	return parts.map((part, index) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong key={index} className="font-semibold text-gray-900">
					{part.slice(2, -2)}
				</strong>
			);
		}
		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code
					key={index}
					className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-quaternary"
				>
					{part.slice(1, -1)}
				</code>
			);
		}

		const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
		if (link) {
			return (
				<a
					key={index}
					href={link[2]}
					target="_blank"
					rel="noreferrer"
					className="font-medium text-quinary underline underline-offset-2"
				>
					{link[1]}
				</a>
			);
		}

		return part;
	});
}

function MarkdownContent({ content }: { content: string }) {
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const blocks: ReactNode[] = [];
	let index = 0;
	let key = 0;

	while (index < lines.length) {
		const line = lines[index]?.trim() ?? "";

		if (!line) {
			index += 1;
			continue;
		}

		const heading = line.match(/^(#{1,3})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length;
			const text = heading[2];
			const className =
				level === 1
					? "text-2xl font-bold text-gray-950"
					: level === 2
						? "text-xl font-bold text-gray-900"
						: "text-base font-semibold text-gray-900";

			blocks.push(
				level === 1 ? (
					<h1 key={key++} className={className}>
						{renderInlineMarkdown(text)}
					</h1>
				) : level === 2 ? (
					<h2 key={key++} className={className}>
						{renderInlineMarkdown(text)}
					</h2>
				) : (
					<h3 key={key++} className={className}>
						{renderInlineMarkdown(text)}
					</h3>
				),
			);
			index += 1;
			continue;
		}

		if (/^[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? "")) {
				items.push((lines[index]?.trim() ?? "").replace(/^[-*]\s+/, ""));
				index += 1;
			}
			blocks.push(
				<ul key={key++} className="list-disc space-y-2 pl-6">
					{items.map((item, itemIndex) => (
						<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
					))}
				</ul>,
			);
			continue;
		}

		if (/^\d+\.\s+/.test(line)) {
			const items: string[] = [];
			while (index < lines.length && /^\d+\.\s+/.test(lines[index]?.trim() ?? "")) {
				items.push((lines[index]?.trim() ?? "").replace(/^\d+\.\s+/, ""));
				index += 1;
			}
			blocks.push(
				<ol key={key++} className="list-decimal space-y-2 pl-6">
					{items.map((item, itemIndex) => (
						<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
					))}
				</ol>,
			);
			continue;
		}

		if (line.startsWith("> ")) {
			const quoteLines: string[] = [];
			while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("> ")) {
				quoteLines.push((lines[index]?.trim() ?? "").replace(/^>\s+/, ""));
				index += 1;
			}
			blocks.push(
				<blockquote
					key={key++}
					className="border-l-4 border-quinary bg-teal-50/70 py-3 pl-4 text-gray-700"
				>
					{quoteLines.map((quote, quoteIndex) => (
						<p key={quoteIndex}>{renderInlineMarkdown(quote)}</p>
					))}
				</blockquote>,
			);
			continue;
		}

		const paragraphLines = [line];
		index += 1;
		while (index < lines.length) {
			const nextLine = lines[index]?.trim() ?? "";
			if (
				!nextLine ||
				/^(#{1,3})\s+/.test(nextLine) ||
				/^[-*]\s+/.test(nextLine) ||
				/^\d+\.\s+/.test(nextLine) ||
				nextLine.startsWith("> ")
			) {
				break;
			}
			paragraphLines.push(nextLine);
			index += 1;
		}

		blocks.push(
			<p key={key++} className="leading-relaxed">
				{renderInlineMarkdown(paragraphLines.join(" "))}
			</p>,
		);
	}

	return <div className="space-y-5 text-gray-700">{blocks}</div>;
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
		api.get<Material>(`/api/materials/${materialId}`)
			.then(setMaterial)
			.catch((err) => {
				if (err instanceof ApiError && err.status === 404)
					setNotFound(true);
			})
			.finally(() => setLoading(false));
		api.get<RecMaterial[]>(`/api/materials/${materialId}/recommended`)
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
			const msg =
				err instanceof ApiError
					? err.message
					: "Gagal memperbarui progres";
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
						<h1 className="text-xl font-bold text-quaternary">
							Learning Materials
						</h1>
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
									<span className="text-sm text-gray-500">
										Progress
									</span>
									<div className="h-2 w-40 rounded-full bg-gray-200">
										<div
											className="h-full rounded-full bg-quinary"
											style={{
												width: `${material.progress}%`,
											}}
										/>
									</div>
									<span className="text-sm font-medium text-gray-700">
										{material.progress}%
									</span>
								</div>
								{material.progress >= 100 ? (
									<span className="flex items-center gap-1 text-sm font-medium text-teal-600">
										<CheckCircle2 className="h-4 w-4" />{" "}
										Completed
									</span>
								) : (
									<Button
										onClick={markComplete}
										disabled={marking}
										className="bg-quinary text-white hover:bg-quinary/90"
									>
										{marking
											? "Saving..."
											: "Mark as complete"}
									</Button>
								)}
							</div>

							{material.type === "video" && (
								<VideoLayout material={material} />
							)}
							{material.type === "document" && (
								<DocumentLayout material={material} />
							)}
							{material.type === "article" && (
								<ArticleLayout material={material} />
							)}
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
	const avatar = useEquippedAvatar();
	const rawSrc =
		material.videoUrl || "https://www.youtube.com/embed/v1desDduz5M";
	const videoId = parseYouTubeId(rawSrc);

	// Avatar berisyarat mengikuti transcript video; jika video tak punya caption,
	// fallback ke gerak acak. Keduanya berhenti saat video di-pause.
	const sign = useTranscriptSign(videoId ? rawSrc : null);

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold text-gray-900">
				{material.title}
			</h2>

			<div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
				{videoId ? (
					<YouTube
						videoId={videoId}
						className="w-full h-full"
						iframeClassName="w-full h-full"
						opts={{
							width: "100%",
							height: "100%",
							playerVars: { autoplay: 0 },
						}}
						onReady={sign.onReady}
						onStateChange={sign.onStateChange}
					/>
				) : (
					<iframe
						src={rawSrc}
						title={material.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
						className="w-full h-full"
					/>
				)}
				<Draggable
					bounds="parent"
					defaultPosition={{ x: 0, y: 0 }}
					nodeRef={nodeRef}
				>
					<div
						ref={nodeRef}
						className="absolute top-4 right-4 w-36 h-44 rounded-xl overflow-hidden shadow-lg bg-senary/30 cursor-move z-10 border-2 border-white/50"
					>
						{/* Avatar VRM: berisyarat mengikuti transcript video; bila video
						    tak punya caption -> gerak acak. Diam saat video di-pause. */}
						<SignAvatarViewer
							vrmUrl={avatar.vrmUrl}
							hairColor={avatar.hairColor}
							eyeColor={avatar.eyeColor}
							accessory={avatar.accessory}
							frames={sign.unavailable ? null : sign.activeClip?.frames ?? null}
							meta={sign.activeClip?.meta}
							playing={sign.videoPlaying}
							randomMotion={sign.unavailable}
							className="w-full h-full pointer-events-none"
							placeholder=""
						/>
					</div>
				</Draggable>
			</div>

			<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
				<div
					className="flex items-center justify-between px-5 py-4"
					style={{
						background:
							"linear-gradient(90deg, #C5FBF9 0%, #FDF5BF 100%)",
					}}
				>
					<h3 className="font-semibold text-gray-800">
						Video Transcript
					</h3>
					{sign.preparing && (
						<span className="text-xs font-medium text-gray-500">
							Loading…
						</span>
					)}
				</div>
				<div className="px-6 py-4 space-y-2 text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
					{sign.cues && sign.cues.length > 0 ? (
						sign.cues.map((c, idx) => (
							<p
								key={idx}
								className={
									idx === sign.activeIdx
										? "rounded bg-quinary/10 px-1 font-semibold text-black"
										: ""
								}
							>
								{c.text}
							</p>
						))
					) : sign.preparing ? (
						<p className="text-gray-400">Loading transcript…</p>
					) : (
						<p className="text-gray-400">
							Transcript is not available for this video.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function DocumentLayout({ material }: { material: Material }) {
	const [currentPage, setCurrentPage] = useState(0);
	const contentPages = material.content?.filter((page) => page.trim()) ?? [];
	const pageCount = contentPages.length;
	const pageContent = contentPages[currentPage] ?? "";

	useEffect(() => {
		setCurrentPage(0);
	}, [material.id]);

	return (
		<div className="space-y-4">
			<div className="relative h-56 rounded-2xl overflow-hidden">
				<Image
					src={material.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
					alt={material.title}
					fill
					className="object-cover"
				/>
				<div className={`${IMAGE_INNER_SHADOW} rounded-2xl`} />
			</div>
			<div>
				<h2 className="text-xl font-bold text-gray-900 mb-3">
					{material.title}
				</h2>
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
				<div className="rounded-2xl border border-gray-100 bg-white p-6">
					{pageCount > 0 ? (
						<>
							<div className="min-h-40">
								<MarkdownContent content={pageContent} />
							</div>
							<div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setCurrentPage((page) =>
											Math.max(page - 1, 0),
										)
									}
									disabled={currentPage === 0}
									className="gap-2"
								>
									<ChevronLeft className="h-4 w-4" />
									Previous
								</Button>
								<span className="text-sm font-medium text-gray-600">
									Page {currentPage + 1} of {pageCount}
								</span>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setCurrentPage((page) =>
											Math.min(page + 1, pageCount - 1),
										)
									}
									disabled={currentPage >= pageCount - 1}
									className="gap-2"
								>
									Next
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</>
					) : (
						<p className="text-gray-400">
							No document content available.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function ArticleLayout({ material }: { material: Material }) {
	const paragraphs = material.content?.filter((page) => page.trim()) ?? [];

	return (
		<div className="space-y-4">
			{material.articleUrl && (
				<div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm">
					<Link2 className="h-5 w-5 shrink-0 text-gray-400" />
					<span className="text-gray-600 text-sm truncate">
						{material.articleUrl}
					</span>
				</div>
			)}
			<div className="border border-gray-100 rounded-2xl overflow-hidden">
				<div className="relative h-56">
					<Image
						src={material.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
						alt={material.title}
						fill
						className="object-cover"
					/>
					<div className={IMAGE_INNER_SHADOW} />
				</div>
				<div className="p-6">
					<h2 className="text-xl font-bold text-gray-900 mb-3">
						{material.title}
					</h2>
					<div className="flex items-center gap-3 mb-6">
						<div className="flex items-center gap-1 text-sm text-gray-500">
							<Clock className="h-4 w-4" />
							<span>
								{material.durationMinutes ?? "?"} min read
							</span>
						</div>
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
							<Link2 className="h-3 w-3" />
							{material.category}
						</span>
					</div>
					<div className="space-y-8">
						{paragraphs.length > 0 ? (
							paragraphs.map((paragraph, index) => (
								<MarkdownContent
									key={index}
									content={paragraph}
								/>
							))
						) : (
							<p className="text-gray-400">
								No article content available.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// AI chatbot — POST /api/chat. Handles 503 (model not ready) gracefully.
function ChatWidget({ materialId }: { materialId: string }) {
	const [messages, setMessages] = useState<
		{ role: "user" | "bot"; text: string }[]
	>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);

	useEffect(() => {
		api.get<{
			sessionId: string | null;
			messages: { role: "user" | "assistant"; content: string }[];
		}>(`/api/chat?materialId=${materialId}`)
			.then((res) => {
				setMessages(
					res.messages.map((m) => ({
						role: m.role === "user" ? "user" : "bot",
						text: m.content,
					})),
				);
			})
			.catch(() => {});
	}, [materialId]);

	const send = async () => {
		const msg = input.trim();
		if (!msg || sending) return;
		setMessages((m) => [...m, { role: "user", text: msg }]);
		setInput("");
		setSending(true);
		try {
			const res = await api.post<{
				reply: string;
				model: string;
				sessionId: string;
			}>("/api/chat", { materialId, message: msg });
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
				style={{
					background:
						"linear-gradient(180deg, #C5FBF9 0%, #FDF5BF 100%)",
				}}
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
					<div
						key={i}
						className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
								m.role === "user"
									? "text-white"
									: "bg-gray-100 text-gray-700"
							}`}
							style={
								m.role === "user"
									? { backgroundColor: "#2DA5A2" }
									: undefined
							}
						>
							{m.text}
						</div>
					</div>
				))}
				{sending && (
					<p className="text-xs text-gray-400">Signify is typing…</p>
				)}
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
					<button
						onClick={send}
						disabled={sending}
						className="hover:opacity-80 transition-opacity"
					>
						<Image
							src="/learning-materials/send.png"
							alt="Send"
							width={20}
							height={20}
						/>
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
			<h3 className="font-semibold text-gray-900 mb-4">
				Recommended Materials
			</h3>
			<div className="space-y-4">
				{recs.map((rec) => (
					<Link
						key={rec.id}
						href={`/learning-materials/${rec.id}`}
						className="flex gap-3 group"
					>
						<div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-900">
							<Image
								src={rec.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
								alt={rec.title}
								fill
								className="object-cover"
							/>
							<div className={`${IMAGE_INNER_SHADOW} rounded-lg`} />
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
									{rec.pages
										? `${rec.pages} pages`
										: `${rec.durationMinutes ?? "?"} min`}
								</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
