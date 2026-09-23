"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	Captions,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	ExternalLink,
	FileText,
	Globe,
	GripHorizontal,
	Hand,
	Link2,
	Loader2,
	MessageCircle,
	SearchX,
	SendHorizontal,
	Video,
	X,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Draggable from "react-draggable";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
	content: string[] | string | null;
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

function normalizeContentPages(content: Material["content"]): string[] {
	const values = Array.isArray(content) ? content : content ? [content] : [];
	if (values.length === 1) {
		try {
			const parsed = JSON.parse(values[0]);
			if (Array.isArray(parsed)) {
				return parsed
					.filter((page): page is string => typeof page === "string")
					.map((page) => page.trim())
					.filter(Boolean);
			}
		} catch {
			// Content is already plain markdown, not a JSON-encoded page array.
		}
	}

	return values.map((page) => page.trim()).filter(Boolean);
}

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

const TYPE_META: Record<Material["type"], { icon: LucideIcon; label: string }> = {
	video: { icon: Video, label: "Video" },
	article: { icon: Globe, label: "Article" },
	document: { icon: FileText, label: "Document" },
};

function metaLabel(m: Material) {
	if (m.type === "document") return `${m.pages ?? "?"} pages`;
	if (m.type === "article") return `${m.durationMinutes ?? "?"} min read`;
	return `${m.durationMinutes ?? "?"} min`;
}

function fmtTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${String(s).padStart(2, "0")}`;
}

const CARD = "rounded-3xl bg-white shadow-sm ring-1 ring-slate-100";

// Judul + meta materi (tipe, durasi, kategori, deskripsi).
function MaterialHeader({ material, onImage = false }: { material: Material; onImage?: boolean }) {
	const type = TYPE_META[material.type];
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
				<span
					className={cn(
						"flex items-center gap-1.5 rounded-full px-2.5 py-1",
						onImage ? "bg-white/90 text-slate-700" : "bg-teal-50 text-[#0B7077]",
					)}
				>
					<type.icon className="h-3.5 w-3.5" /> {type.label}
				</span>
				<span
					className={cn(
						"rounded-full px-2.5 py-1",
						onImage ? "bg-white/20 text-white backdrop-blur" : "bg-slate-100 text-slate-600",
					)}
				>
					{material.category}
				</span>
				<span className={cn("flex items-center gap-1", onImage ? "text-white/85" : "text-slate-500")}>
					<Clock className="h-3.5 w-3.5" /> {metaLabel(material)}
				</span>
			</div>
			<h1
				className={cn(
					"mt-3 font-heading text-2xl font-bold leading-tight md:text-3xl",
					onImage ? "text-white drop-shadow" : "text-slate-800",
				)}
			>
				{material.title}
			</h1>
			{material.description && (
				<p className={cn("mt-2 max-w-3xl", onImage ? "text-white/85" : "text-slate-500")}>
					{material.description}
				</p>
			)}
		</div>
	);
}

// Banner bergambar untuk dokumen & artikel.
function ImageBanner({ material }: { material: Material }) {
	return (
		<div className="relative overflow-hidden rounded-3xl shadow-sm">
			<div className="relative h-64 md:h-72">
				<Image
					src={material.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
					alt={material.title}
					fill
					priority
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#0B3F42]/90 via-[#0B3F42]/40 to-transparent" />
			</div>
			<div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
				<MaterialHeader material={material} onImage />
			</div>
		</div>
	);
}

function ProgressCard({
	material,
	marking,
	onComplete,
}: {
	material: Material;
	marking: boolean;
	onComplete: () => void;
}) {
	const done = material.progress >= 100;
	return (
		<div className={cn(CARD, "p-6")}>
			<div className="flex items-center justify-between">
				<h2 className="font-heading text-lg font-bold text-slate-800">Your progress</h2>
				<span className="font-heading text-2xl font-bold text-[#0B7077]">
					{material.progress}%
				</span>
			</div>
			<div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-700",
						done ? "bg-emerald-500" : "bg-gradient-to-r from-[#2DA5A2] to-[#0B7077]",
					)}
					style={{ width: `${Math.min(100, material.progress)}%` }}
				/>
			</div>
			{done ? (
				<div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-emerald-700">
					<CheckCircle2 className="h-6 w-6 shrink-0" />
					<div className="leading-tight">
						<p className="text-sm font-bold">Completed</p>
						<p className="text-xs text-emerald-600">Nice work — keep your streak going!</p>
					</div>
				</div>
			) : (
				<Button
					onClick={onComplete}
					disabled={marking}
					className="mt-5 h-11 w-full rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
				>
					{marking ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<CheckCircle2 className="h-4 w-4" />
					)}
					{marking ? "Saving..." : "Mark as complete"}
				</Button>
			)}
			<p className="mt-3 text-center text-xs text-slate-400">
				Finishing a material adds to your streak and learning time.
			</p>
		</div>
	);
}

function DetailSkeleton() {
	const block = "animate-pulse rounded-3xl bg-slate-200/70";
	return (
		<div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 lg:grid-cols-12" aria-busy="true">
			<div className="space-y-6 lg:col-span-8">
				<div className={`aspect-video ${block}`} />
				<div className={`h-32 ${block}`} />
			</div>
			<div className="space-y-6 lg:col-span-4">
				<div className={`h-44 ${block}`} />
				<div className={`h-72 ${block}`} />
			</div>
		</div>
	);
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

	if (loading) return <DetailSkeleton />;

	if (notFound || !material) {
		return (
			<div className={cn(CARD, "mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center")}>
				<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
					<SearchX className="h-8 w-8" />
				</div>
				<p className="font-heading text-lg font-bold text-slate-700">Material not found</p>
				<p className="text-sm text-slate-500">It may have been moved or removed.</p>
				<Link
					href="/learning-materials"
					className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
				>
					Browse materials
				</Link>
			</div>
		);
	}

	return (
		<>
			<div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
				{/* Breadcrumb */}
				<div className="flex items-center gap-3">
					<Link
						href="/learning-materials"
						aria-label="Back to learning materials"
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-50"
					>
						<ChevronLeft className="h-5 w-5" />
					</Link>
					<nav className="flex min-w-0 items-center gap-1.5 text-sm">
						<Link href="/learning-materials" className="shrink-0 font-medium text-slate-500 hover:text-[#0B7077]">
							Learning Materials
						</Link>
						<ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
						<span className="shrink-0 text-slate-500">{material.category}</span>
						<ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
						<span className="truncate font-semibold text-slate-800">{material.title}</span>
					</nav>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
						{material.type === "video" && <VideoLayout material={material} />}
						{/* key: halaman kembali ke 1 saat pindah materi */}
						{material.type === "document" && <DocumentLayout key={material.id} material={material} />}
						{material.type === "article" && <ArticleLayout material={material} />}
					</div>

					<aside className="flex flex-col gap-6 self-start lg:sticky lg:top-8 lg:col-span-4">
						<ProgressCard material={material} marking={marking} onComplete={markComplete} />
						<RecommendedMaterials recs={recs} />
					</aside>
				</div>
			</div>

			{/* Chat mengambang di pojok kanan bawah */}
			<FloatingChat materialId={material.id} />
		</>
	);
}

function VideoLayout({ material }: { material: Material }) {
	const nodeRef = useRef<HTMLDivElement>(null);
	const transcriptRef = useRef<HTMLDivElement>(null);
	const avatar = useEquippedAvatar();
	const rawSrc =
		material.videoUrl || "https://www.youtube.com/embed/v1desDduz5M";
	const videoId = parseYouTubeId(rawSrc);

	// Avatar berisyarat mengikuti transcript video; jika video tak punya caption,
	// fallback ke gerak acak. Keduanya berhenti saat video di-pause.
	const sign = useTranscriptSign(videoId ? rawSrc : null);

	// Gulir transcript agar baris aktif tetap terlihat (hanya di dalam panelnya).
	useEffect(() => {
		const box = transcriptRef.current;
		const el = box?.querySelector<HTMLElement>(`[data-cue="${sign.activeIdx}"]`);
		if (!box || !el) return;
		const b = box.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		if (r.top < b.top || r.bottom > b.bottom) {
			box.scrollTo({ top: box.scrollTop + (r.top - b.top) - b.height / 3, behavior: "smooth" });
		}
	}, [sign.activeIdx]);

	const signStatus = sign.unavailable
		? { label: "No captions — avatar moves freely", tone: "bg-slate-100 text-slate-600" }
		: sign.preparing
			? {
					label: sign.progress.total
						? `Preparing signs ${sign.progress.done}/${sign.progress.total}`
						: "Preparing signs…",
					tone: "bg-amber-100 text-amber-700",
				}
			: { label: "Avatar is ready", tone: "bg-emerald-100 text-emerald-700" };

	return (
		<>
			<div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-lg shadow-slate-900/10">
				{videoId ? (
					<YouTube
						videoId={videoId}
						className="h-full w-full"
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
						className="h-full w-full"
					/>
				)}
				<Draggable bounds="parent" defaultPosition={{ x: 0, y: 0 }} nodeRef={nodeRef}>
					<div
						ref={nodeRef}
						className="group absolute right-4 top-4 z-10 h-44 w-36 cursor-move overflow-hidden rounded-2xl bg-gradient-to-b from-[#C5FBF9] to-[#FDF5BF] shadow-xl ring-2 ring-white/80"
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
							className="pointer-events-none h-full w-full"
							placeholder=""
						/>
						<span className="pointer-events-none absolute inset-x-0 top-1.5 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
							<span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white">
								<GripHorizontal className="h-3 w-3" /> Drag
							</span>
						</span>
					</div>
				</Draggable>
			</div>

			<div className={cn(CARD, "p-6")}>
				<MaterialHeader material={material} />
			</div>

			<div className={cn(CARD, "flex flex-col overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
					<div className="flex items-center gap-2">
						<Captions className="h-5 w-5 text-[#2DA5A2]" />
						<h2 className="font-heading font-bold text-slate-800">Transcript</h2>
					</div>
					<span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", signStatus.tone)}>
						{signStatus.label}
					</span>
				</div>
				<div ref={transcriptRef} className="max-h-80 overflow-y-auto p-3">
					{sign.cues && sign.cues.length > 0 ? (
						sign.cues.map((c, idx) => (
							<button
								key={idx}
								data-cue={idx}
								onClick={() => sign.seekTo(c.start)}
								className={cn(
									"flex w-full gap-4 rounded-xl px-3 py-2 text-left text-sm transition-colors",
									idx === sign.activeIdx
										? "bg-teal-50 font-semibold text-slate-900"
										: "text-slate-600 hover:bg-slate-50",
								)}
							>
								<span
									className={cn(
										"w-12 shrink-0 font-mono text-xs leading-5",
										idx === sign.activeIdx ? "text-[#0B7077]" : "text-slate-400",
									)}
								>
									{fmtTime(c.start)}
								</span>
								<span className="leading-5">{c.text}</span>
							</button>
						))
					) : (
						<p className="px-3 py-8 text-center text-sm text-slate-400">
							{sign.preparing
								? "Loading transcript…"
								: "Transcript is not available for this video."}
						</p>
					)}
				</div>
			</div>
		</>
	);
}

function DocumentLayout({ material }: { material: Material }) {
	const [currentPage, setCurrentPage] = useState(0);
	const contentPages = normalizeContentPages(material.content);
	const pageCount = contentPages.length;
	const pageContent = contentPages[currentPage] ?? "";
	const readerRef = useRef<HTMLDivElement>(null);

	const goTo = (page: number) => {
		setCurrentPage(Math.min(Math.max(page, 0), pageCount - 1));
		readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<>
			<ImageBanner material={material} />

			<div ref={readerRef} className={cn(CARD, "scroll-mt-8 overflow-hidden")}>
				{pageCount > 0 ? (
					<>
						<div className="h-1 bg-slate-100">
							<div
								className="h-full bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] transition-all duration-500"
								style={{ width: `${((currentPage + 1) / pageCount) * 100}%` }}
							/>
						</div>
						<div className="flex items-center justify-between px-6 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-10">
							<span>
								Page {currentPage + 1} of {pageCount}
							</span>
							<span>{Math.round(((currentPage + 1) / pageCount) * 100)}% read</span>
						</div>
						<div key={currentPage} className="min-h-60 px-6 py-6 animate-in fade-in duration-300 md:px-10 md:py-8">
							<MarkdownContent content={pageContent} />
						</div>
						<div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 md:px-10">
							<Button
								type="button"
								variant="outline"
								onClick={() => goTo(currentPage - 1)}
								disabled={currentPage === 0}
								className="gap-2 rounded-xl"
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>
							{pageCount <= 12 && (
								<div className="hidden items-center gap-1.5 sm:flex">
									{contentPages.map((_, i) => (
										<button
											key={i}
											onClick={() => goTo(i)}
											aria-label={`Go to page ${i + 1}`}
											className={cn(
												"h-2 rounded-full transition-all",
												i === currentPage ? "w-6 bg-[#0B7077]" : "w-2 bg-slate-200 hover:bg-slate-300",
											)}
										/>
									))}
								</div>
							)}
							<Button
								type="button"
								onClick={() => goTo(currentPage + 1)}
								disabled={currentPage >= pageCount - 1}
								className="gap-2 rounded-xl bg-[#0B7077] text-white hover:bg-[#095d63]"
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</>
				) : (
					<p className="px-6 py-12 text-center text-slate-400">No document content available.</p>
				)}
			</div>
		</>
	);
}

function ArticleLayout({ material }: { material: Material }) {
	const paragraphs = normalizeContentPages(material.content);

	return (
		<>
			<ImageBanner material={material} />

			{material.articleUrl && (
				<a
					href={material.articleUrl}
					target="_blank"
					rel="noreferrer"
					className={cn(CARD, "group flex items-center gap-3 px-5 py-4 transition-shadow hover:shadow-md")}
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#0B7077]">
						<Link2 className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-slate-800">Read the original article</p>
						<p className="truncate text-xs text-slate-500">{material.articleUrl}</p>
					</div>
					<ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#0B7077]" />
				</a>
			)}

			<article className={cn(CARD, "px-6 py-8 md:px-10 md:py-10")}>
				<div className="mx-auto max-w-3xl space-y-8 text-[15px]">
					{paragraphs.length > 0 ? (
						paragraphs.map((paragraph, index) => (
							<MarkdownContent key={index} content={paragraph} />
						))
					) : (
						<p className="text-center text-slate-400">No article content available.</p>
					)}
				</div>
			</article>
		</>
	);
}

// AI chatbot — POST /api/chat. Handles 503 (model not ready) gracefully.
function useChatController(materialId: string) {
	const [messages, setMessages] = useState<
		{ role: "user" | "bot"; text: string }[]
	>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	// Pesan bot yang sedang diperagakan avatar (null = panel avatar tertutup).
	const [signing, setSigning] = useState<string | null>(null);

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

	const send = async (text?: string) => {
		const msg = (text ?? input).trim();
		if (!msg || sending) return;
		setMessages((m) => [...m, { role: "user", text: msg }]);
		if (text === undefined) setInput("");
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

	return { messages, input, setInput, sending, send, signing, setSigning };
}

// Saran pertanyaan saat chat masih kosong.
const CHAT_SUGGESTIONS = [
	"Summarize this material",
	"Explain the key points simply",
	"Quiz me with one question",
];

// Isi pop up chat: header + daftar pesan (scroll) + input yang menempel di bawah.
function ChatPanel({
	controller,
	onClose,
}: {
	controller: ReturnType<typeof useChatController>;
	onClose: () => void;
}) {
	const { messages, input, setInput, sending, send, signing, setSigning } =
		controller;
	const listRef = useRef<HTMLDivElement>(null);

	// Selalu gulir ke pesan terbaru.
	useEffect(() => {
		const el = listRef.current;
		if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
	}, [messages.length, sending]);

	return (
		<>
			{/* Header */}
			<div className="relative flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 py-4 text-white">
				<div className="flex items-center gap-3">
					<div className="relative">
						<Image
							src="/learning-materials/chatbot.png"
							alt="Signify"
							width={40}
							height={40}
							className="rounded-full bg-white/90 p-0.5"
						/>
						<span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1c8d8a] bg-emerald-300" />
					</div>
					<div className="leading-tight">
						<p className="font-heading text-base font-bold">Signify</p>
						<p className="text-xs text-white/80">Ask me about this material</p>
					</div>
				</div>
				<button
					onClick={onClose}
					aria-label="Close chat"
					className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{signing && <ChatSignPanel text={signing} onClose={() => setSigning(null)} />}

			{/* Messages */}
			<div
				ref={listRef}
				className="flex-1 min-h-0 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5"
			>
				{messages.length === 0 && (
					<div className="flex flex-col items-center gap-4 pt-4 text-center">
						<Image
							src="/learning-materials/chatbot.png"
							alt=""
							width={64}
							height={64}
							className="rounded-full"
						/>
						<div>
							<p className="font-heading font-bold text-gray-800">
								Hi! I&apos;m Signify 👋
							</p>
							<p className="mt-1 text-sm text-gray-500">
								I can answer questions using this material. Try one of these:
							</p>
						</div>
						<div className="flex flex-wrap justify-center gap-2">
							{CHAT_SUGGESTIONS.map((q) => (
								<button
									key={q}
									onClick={() => send(q)}
									disabled={sending}
									className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 shadow-sm transition-colors hover:bg-teal-50"
								>
									{q}
								</button>
							))}
						</div>
					</div>
				)}

				{messages.map((m, i) =>
					m.role === "user" ? (
						<div key={i} className="flex justify-end">
							<div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[#2DA5A2] px-4 py-2.5 text-sm text-white shadow-sm">
								{m.text}
							</div>
						</div>
					) : (
						<div key={i} className="flex items-end gap-2">
							<Image
								src="/learning-materials/chatbot.png"
								alt=""
								width={28}
								height={28}
								className="shrink-0 rounded-full"
							/>
							<div className="max-w-[80%] rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm">
								<p className="whitespace-pre-wrap">{m.text}</p>
								<button
									onClick={() => setSigning(m.text)}
									className={`mt-2 flex items-center gap-1 text-xs font-semibold transition-colors ${
										signing === m.text
											? "text-quinary"
											: "text-gray-400 hover:text-quinary"
									}`}
								>
									<Hand className="h-3.5 w-3.5" />
									{signing === m.text ? "Signing…" : "Sign this"}
								</button>
							</div>
						</div>
					),
				)}

				{sending && (
					<div className="flex items-end gap-2">
						<Image
							src="/learning-materials/chatbot.png"
							alt=""
							width={28}
							height={28}
							className="shrink-0 rounded-full"
						/>
						<div
							className="flex gap-1 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm"
							aria-label="Signify is typing"
						>
							{[0, 150, 300].map((delay) => (
								<span
									key={delay}
									className="h-2 w-2 animate-bounce rounded-full bg-teal-400"
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Input */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					send();
				}}
				className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-4 py-3"
			>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					className="h-11 flex-1 rounded-full bg-slate-100 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-quinary/30"
				/>
				<button
					type="submit"
					disabled={sending || !input.trim()}
					aria-label="Send"
					className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2DA5A2] text-white shadow-sm transition-all hover:bg-[#258f8c] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
				>
					<SendHorizontal className="h-5 w-5" />
				</button>
			</form>
		</>
	);
}

// Batas teks yang dikirim ke penerjemah isyarat (sama dengan backend).
const MAX_SIGN_CHARS = 500;

// Avatar kecil di atas daftar pesan yang memperagakan jawaban bot.
function ChatSignPanel({ text, onClose }: { text: string; onClose: () => void }) {
	const avatar = useEquippedAvatar();
	// Potong di batas kata terakhir sebelum batas karakter.
	const cut = text.lastIndexOf(" ", MAX_SIGN_CHARS);
	const clipped =
		text.length > MAX_SIGN_CHARS
			? text.slice(0, cut > 0 ? cut : MAX_SIGN_CHARS)
			: text;
	return (
		<div className="relative h-44 shrink-0 border-b border-gray-100 bg-senary/30">
			<SignAvatarViewer
				text={clipped}
				vrmUrl={avatar.vrmUrl}
				hairColor={avatar.hairColor}
				eyeColor={avatar.eyeColor}
				accessory={avatar.accessory}
				className="h-full w-full"
				placeholder="Signing the answer"
			/>
			<button
				onClick={onClose}
				aria-label="Close avatar"
				className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-gray-500 shadow-sm hover:text-gray-800"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

// Chat mengambang di pojok kanan bawah (semua ukuran layar): klik tombol untuk
// membuka pop up. Riwayat tetap tersimpan saat pop up ditutup.
function FloatingChat({ materialId }: { materialId: string }) {
	const [open, setOpen] = useState(false);
	const [opened, setOpened] = useState(false); // sudah pernah dibuka? (matikan efek ping)
	const controller = useChatController(materialId);

	// Esc menutup pop up.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	const toggle = () => {
		setOpen((v) => !v);
		setOpened(true);
	};

	return (
		<>
			{open && (
				<div
					role="dialog"
					aria-label="Signify chat"
					className="fixed bottom-24 right-4 z-50 flex h-[min(620px,calc(100dvh-8rem))] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 sm:right-6 sm:w-[400px]"
				>
					<ChatPanel controller={controller} onClose={() => setOpen(false)} />
				</div>
			)}

			<div className="fixed bottom-6 right-4 z-50 flex items-center gap-3 sm:right-6">
				{!open && (
					<span className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-lg sm:block">
						Ask Signify
					</span>
				)}
				<button
					onClick={toggle}
					aria-label={open ? "Close chat" : "Open chat"}
					aria-expanded={open}
					className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] text-white shadow-xl shadow-teal-900/20 transition-transform hover:scale-105 active:scale-95"
				>
					{!opened && (
						<span className="absolute inset-0 animate-ping rounded-full bg-[#2DA5A2]/40" />
					)}
					{open ? (
						<X className="relative h-7 w-7" />
					) : (
						<MessageCircle className="relative h-7 w-7" />
					)}
				</button>
			</div>
		</>
	);
}

function RecommendedMaterials({ recs }: { recs: RecMaterial[] }) {
	if (recs.length === 0) return null;
	return (
		<div className={cn(CARD, "p-5")}>
			<h3 className="mb-4 font-heading text-lg font-bold text-slate-800">Up next</h3>
			<div className="space-y-2">
				{recs.map((rec) => (
					<Link
						key={rec.id}
						href={`/learning-materials/${rec.id}`}
						className="group flex gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50"
					>
						<div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
							<Image
								src={rec.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
								alt={rec.title}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-105"
							/>
						</div>
						<div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
							<h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#0B7077]">
								{rec.title}
							</h4>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">{rec.category}</span>
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
