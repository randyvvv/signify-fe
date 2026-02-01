"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Languages,
	BookOpen,
	ListChecks,
	Grid2X2,
	ShoppingBag,
	Settings,
	LogOut,
	ChevronLeft,
	Menu,
	X,
	ChevronRight,
  HelpCircle,
  Hand,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";

interface NavItem {
	href: string;
	label: string;
	icon: React.ReactNode;
}

const navItems: NavItem[] = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: <Grid2X2 className="h-5 w-5" />,
	},
	{
		href: "/live-translator",
		label: "Live Translator",
		icon: <Languages className="h-5 w-5" />,
	},
	{
		href: "/learning-materials",
		label: "Learning Materials",
		icon: <BookOpen className="h-5 w-5" />,
	},
	{
		href: "/quizzes",
		label: "Quizzes",
		icon: <ListChecks className="h-5 w-5" />,
	},
	{
		href: "/sign-practice",
		label: "Sign Practice",
		icon: <Grid2X2 className="h-5 w-5" />,
	},
];

const bottomNavItems: NavItem[] = [
	{
		href: "/shop",
		label: "Shop",
		icon: <ShoppingBag className="h-5 w-5" />,
	},
	{
		href: "/settings",
		label: "Settings",
		icon: <Settings className="h-5 w-5" />,
	},
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
	return (
		<Link
			href={item.href}
			className={cn(
				"flex items-center gap-3 rounded-lg p-4 text-base font-medium transition-all duration-200",
				isActive
					? "bg-quinary text-white shadow-md"
					: "text-[#818181] hover:bg-tertiary/50 hover:text-quaternary",
			)}
		>
			{item.icon}
			{item.label}
		</Link>
	);
}

function SidebarContent({ pathname }: { pathname: string }) {
	return (
		<div className="flex h-full flex-col py-[45px]">
			{/* Logo Section */}
			<div className="flex items-center justify-between px-4 mb-[30px]">
				<div className="flex items-center gap-[10px]">
					<Image
						src="/profile/hat.png"
						alt="Signify"
						width={40}
						height={30}
						// className="h-10 w-10"
					/>
					<span className="font-heading text-3xl font-bold text-black ">
						Signify
					</span>
				</div>
				<button className="flex h-8 w-8 items-center justify-center rounded-lg bg-quinary text-white hover:bg-quinary/90 transition-colors">
					<ChevronLeft className="h-4 w-4" />
				</button>
			</div>

			{/* Main Navigation */}
			<nav className="flex flex-col gap-1 px-3 py-4">
				{navItems.map((item) => (
					<NavLink
						key={item.href}
						item={item}
						isActive={pathname === item.href}
					/>
				))}
			</nav>

			{/* Spacer */}
			<div className="flex-1" />

			{/* User Profile Card */}
			<div className="px-4 pb-6">
				<Link
					href="/profile"
					className="group flex items-center justify-between rounded-[12px] border border-[#B4ADAE] bg-[#F2F8F8] p-3 transition-all duration-200 hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="relative">
							<div className="size-[62px] overflow-hidden rounded-full border-[3px] border-[#D4D4FF] p-[7px]">
								<Image
									src="/profile/avatar.png"
									alt="Thea Josephine"
									width={56}
									height={56}
									className="h-full w-full object-cover"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs  text-black">
								Thea Josephine
							</span>
							<div className="flex w-fit items-center gap-2 rounded-full bg-senary  p-1 pl-3">
								<span className="text-sm font-bold text-white">
									602
								</span>
								<div className="bg-white p-[3px] rounded-full flex  items-center justify-center">
									<Image
										src="/profile/coins-1.png"
										alt="coins"
										width={20}
										height={20}
										className="h-5 w-5"
									/>
								</div>
							</div>
						</div>
					</div>
					<ChevronRight className="mr-1 h-6 w-6 stroke-[3px] text-black" />
				</Link>
			</div>

			{/* Bottom Navigation */}
			<nav className="flex flex-col gap-1 px-3 pb-2">
				{bottomNavItems.map((item) => (
					<NavLink
						key={item.href}
						item={item}
						isActive={pathname === item.href}
					/>
				))}
				<button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10">
					<LogOut className="h-5 w-5" />
					Logout
				</button>
			</nav>
		</div>
	);
}

export function Sidebar() {
	const pathname = usePathname();

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-border bg-white">
				<SidebarContent pathname={pathname} />
			</aside>

			{/* Mobile Sidebar */}
			<Sheet>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="fixed left-4 top-4 z-50 lg:hidden"
					>
						<Menu className="h-6 w-6" />
						<span className="sr-only">Toggle navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-64 p-0">
					<SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</SheetClose>
					<SidebarContent pathname={pathname} />
				</SheetContent>
			</Sheet>
		</>
	);
}
