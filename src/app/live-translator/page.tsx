import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	Link as LinkIcon,
	Play,
	Video,
	Download,
	User,
	Volume2,
	Maximize2,
	MoreVertical,
} from "lucide-react";
import Link from "next/link";

export default function LiveTranslatorPage() {
	return (
		<MainLayout>
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
						<h1 className="text-2xl font-bold text-black">
							Live Translator
						</h1>
						<p className="text-base text-gray-500 ">
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
								placeholder="https://www.youtube.com/"
								className="w-full h-12 rounded-[10px] border border-gray-300 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
							/>
						</div>
						<Button className="h-12 bg-quinary hover:bg-quinary/90 text-white px-8 rounded-[10px] font-semibold flex items-center gap-2">
							Start <Play className="w-4 h-4 fill-current" />
						</Button>
					</div>
					<p className="text-base text-grey">
						Supports YouTube Live, YouTube videos, Zoom, Google
						Meet, and other livestream platforms
					</p>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-y-[30px] gap-x-[20px]">
					{/* Video Player */}
					<div className="lg:col-span-2 bg-white pt-[35px] px-[30px] rounded-[10px]">
						<div className="bg-senary/30 rounded-[10px] aspect-video relative flex items-center justify-center group overflow-hidden shadow-sm">
							{/* Live Badge */}
							<div className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
								<span className="text-xs font-bold text-black">
									Live
								</span>
							</div>

							<div className="flex flex-col items-center gap-3 text-grey/70">
								<Video className="w-12 h-12" />
								<p className="font-medium">
									Enter a URL to begin translation
								</p>
							</div>

							{/* Mock Controls */}
							<div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between text-grey">
								<div className="flex items-center gap-4">
									<Play className="w-5 h-5 fill-current" />
									<span className="text-xs font-medium">
										0:00 / 0:10
									</span>
								</div>
								<div className="flex items-center gap-4">
									<Volume2 className="w-5 h-5" />
									<Maximize2 className="w-5 h-5" />
									<MoreVertical className="w-5 h-5" />
								</div>
							</div>
							{/* Progress Bar Mock */}
							<div className="absolute bottom-12 left-4 right-4 h-1 bg-black/10 rounded-full">
								<div className="w-0 h-full bg-black rounded-full"></div>
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
							<div className="bg-senary/30 rounded-[10px] py-[45px] px-[30px] flex flex-col items-center justify-center text-center gap-6 shadow-sm aspect-video lg:aspect-square">
								{/* Placeholder Avatar */}
								<div className="w-32 h-32 relative">
									{/* Simple CSS Avatar Mock or Icon */}
									<div className="w-full h-full rounded-full bg-white/50 flex items-center justify-center">
										<User className="w-16 h-16 text-black" />
									</div>
								</div>
								<p className="text-grey font-medium leading-relaxed">
									Avatar will translate to sign language
								</p>
							</div>
						</div>

						{/* Transcript */}
						<div className="flex flex-col">
							{/* Header */}
							<div className="bg-gradient-to-r from-[#C5FBF9] to-secondary p-4 rounded-t-[10px] flex justify-between items-center">
								<span className="font-bold text-black">
									Video Transcript
								</span>
								<Download className="w-4 h-4 text-black cursor-pointer" />
							</div>
							{/* Body */}
							<div className="bg-white border-x border-b border-gray-100 rounded-b-[10px] py-[45px] px-[30px] shadow-sm">
								<div className="flex flex-col gap-4 text-sm text-grey leading-relaxed">
									<p>
										1. Adherence is King TB bacteria are
										tough, which is why the treatment takes
										months.
									</p>
									<p>
										2. Listen to Your Body Your body
										communicates through symptoms. Feeling
										extra tired?
									</p>
									<p>
										Fact: Side effects like nausea or a
										slight change in urine color can
										happen...
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
