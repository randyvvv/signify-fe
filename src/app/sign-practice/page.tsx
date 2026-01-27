"use client";

import { MainLayout } from "@/components/layout";
import {
	ChevronLeft,
	Maximize2,
	Hand,
	Presentation,
	Briefcase,
	Building2,
	X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const categories = [
	{ name: "Sign Language Basics", icon: Hand },
	{ name: "School Presentations", icon: Presentation },
	{ name: "Job Interview", icon: Briefcase },
	{ name: "Bussiness Pitching", icon: Building2 },
];

export default function SignPracticePage() {
	const [showTutorial, setShowTutorial] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState(
		categories[0].name,
	);

	return (
		<MainLayout>
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
					{/* Left Section - Practice Area */}
					<div className="lg:col-span-2 relative h-[500px] rounded-[20px] bg-senary/30 flex items-center justify-center group overflow-hidden">
						<Button className="bg-quinary hover:bg-quinary/90 text-white px-8 py-6 text-lg rounded-xl font-semibold shadow-lg transition-transform hover:scale-105">
							Start Sign Practice
						</Button>

						<button className="absolute bottom-6 right-6 p-2 rounded-lg hover:bg-black/5 transition-colors text-grey hover:text-quaternary">
							<Maximize2 className="w-6 h-6" />
						</button>
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

						{/* Progress Card */}
						<div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
							<h3 className="font-heading font-bold text-lg mb-6 text-quaternary">
								Progress
							</h3>

							<div className="flex flex-col gap-6">
								{/* Completion Progress */}
								<div className="space-y-2">
									<div className="flex items-baseline gap-2">
										<span className="text-2xl font-bold text-quaternary">
											7/10
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Complete
										</span>
									</div>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
										<div className="h-full bg-tertiary w-[70%] rounded-full" />
									</div>
								</div>

								{/* Accuracy Progress */}
								<div className="space-y-2">
									<div className="flex items-baseline gap-2">
										<span className="text-2xl font-bold text-quaternary">
											78%
										</span>
										<span className="text-sm font-medium text-quaternary/60">
											Accuracy
										</span>
									</div>
									<div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
										<div className="h-full bg-orange-400 w-[78%] rounded-full" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
