"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCachedGet } from "@/lib/cache";
import {
	BookMarked,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Coins,
	Flame,
	Grid2X2,
	Hand,
	Languages,
	ListChecks,
	LogOut,
	Menu,
	Settings,
	ShoppingBag,
	X,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetClose,
	SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "./SidebarContext";

interface NavItem {
	href: string;
	label: string;
	icon: LucideIcon;
}

const navSections: { title: string; items: NavItem[] }[] = [
	{
		title: "Learn",
		items: [
			{ href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
			{ href: "/learning-materials", label: "Learning Materials", icon: BookOpen },
			{ href: "/quizzes", label: "Quizzes", icon: ListChecks },
		],
	},
	{
		title: "Practice",
		items: [
			{ href: "/live-translator", label: "Live Translator", icon: Languages },
			{ href: "/sign-practice", label: "Sign Practice", icon: Hand },
			{ href: "/my-signs", label: "My Signs", icon: BookMarked },
		],
	},
];

const bottomNavItems: NavItem[] = [
	{ href: "/shop", label: "Shop", icon: ShoppingBag },
	{ href: "/settings", label: "Settings", icon: Settings },
];

interface VocabularyStats {
	stats: { due: number };
}

function initials(name?: string | null) {
	if (!name) return "U";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

// Menu aktif juga untuk sub-halaman, mis. /quizzes/:id -> "Quizzes".
function isActivePath(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
	item,
	isActive,
	isCollapsed,
	badge,
}: {
	item: NavItem;
	isActive: boolean;
	isCollapsed?: boolean;
	badge?: number;
}) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			aria-current={isActive ? "page" : undefined}
			title={isCollapsed ? item.label : undefined}
			className={cn(
				"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
				isActive
					? "bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-white shadow-md shadow-teal-900/15"
					: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
				isCollapsed && "justify-center px-0",
			)}
		>
			<Icon
				className={cn(
					"h-5 w-5 shrink-0 transition-transform duration-200",
					!isActive && "group-hover:scale-110",
				)}
			/>
			{!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
			{!!badge &&
				(isCollapsed ? (
					<span className="absolute right-2.5 top-1.5 h-2 w-2 rounded-full bg-[#DF5D73] ring-2 ring-white" />
				) : (
					<span
						className={cn(
							"min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5",
							isActive ? "bg-white/25 text-white" : "bg-[#DF5D73] text-white",
						)}
					>
						{badge > 99 ? "99+" : badge}
					</span>
				))}
		</Link>
	);
}

function SidebarContent({
	pathname,
	isCollapsed,
	setIsCollapsed,
}: {
	pathname: string;
	isCollapsed?: boolean;
	setIsCollapsed?: (value: boolean) => void;
}) {
	const { user, logout } = useAuth();
	const router = useRouter();
	// Jumlah kartu My Signs yang jatuh tempo (cache sama dengan dashboard).
	const { data: vocab } = useCachedGet<VocabularyStats>(
		"/api/vocabulary",
		user ? `vocabulary:${user.id}` : null,
	);
	const dueSigns = vocab?.stats.due ?? 0;

	const handleLogout = () => {
		logout();
		router.replace("/login");
	};

	const avatarSrc = user?.avatarUrl || "/profile/avatar.png";

	return (
		<div className="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden py-6">
			{/* Logo + collapse */}
			<div
				className={cn(
					"mb-6 flex items-center px-4",
					isCollapsed ? "flex-col gap-4" : "justify-between",
				)}
			>
				<Link
					href="/"
					title="Signify"
					className="flex items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2DA5A2]/30"
				>
					{isCollapsed ? (
						<Image src="/profile/hat.png" alt="Signify" width={40} height={30} />
					) : (
						<Image
							src="/logo/logo-signify.png"
							alt="Signify"
							width={200}
							height={180}
							priority
							className="h-16 w-auto"
						/>
					)}
				</Link>
				{setIsCollapsed && (
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-teal-50 hover:text-[#0B7077]"
					>
						{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
					</button>
				)}
			</div>

			{/* Navigasi utama */}
			<nav className="flex flex-col gap-5 px-3">
				{navSections.map((section) => (
					<div key={section.title} className="flex flex-col gap-1">
						{isCollapsed ? (
							<div className="mx-auto mb-1 h-px w-8 bg-slate-100" />
						) : (
							<p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								{section.title}
							</p>
						)}
						{section.items.map((item) => (
							<NavLink
								key={item.href}
								item={item}
								isActive={isActivePath(pathname, item.href)}
								isCollapsed={isCollapsed}
								badge={item.href === "/my-signs" ? dueSigns : undefined}
							/>
						))}
					</div>
				))}
			</nav>

			<div className="flex-1" />

			{/* Menu bawah */}
			<nav className="mt-6 flex flex-col gap-1 px-3">
				{bottomNavItems.map((item) => (
					<NavLink
						key={item.href}
						item={item}
						isActive={isActivePath(pathname, item.href)}
						isCollapsed={isCollapsed}
					/>
				))}
			</nav>

			{/* Kartu user */}
			<div className="mt-4 px-3">
				{isCollapsed ? (
					<div className="flex flex-col items-center gap-2">
						<Link
							href="/profile"
							title="Profile"
							className="rounded-full ring-2 ring-teal-100 transition-all hover:ring-[#2DA5A2]"
						>
							<Avatar className="h-11 w-11 bg-orange-100">
								<AvatarImage src={avatarSrc} alt={user?.fullName ?? "Profile"} />
								<AvatarFallback className="font-bold">{initials(user?.fullName)}</AvatarFallback>
							</Avatar>
						</Link>
						<button
							onClick={handleLogout}
							title="Logout"
							aria-label="Logout"
							className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50"
						>
							<LogOut className="h-5 w-5" />
						</button>
					</div>
				) : (
					<div className="rounded-2xl bg-gradient-to-br from-[#C5FBF9]/70 to-[#FDF5BF]/70 p-3 ring-1 ring-teal-100">
						<Link href="/profile" className="group flex items-center gap-3">
							<Avatar className="h-11 w-11 shrink-0 bg-orange-100 ring-2 ring-white">
								<AvatarImage src={avatarSrc} alt={user?.fullName ?? "Profile"} />
								<AvatarFallback className="font-bold">{initials(user?.fullName)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-bold text-slate-800">
									{user?.fullName ?? "User"}
								</p>
								<div className="mt-1 flex items-center gap-2 text-xs font-semibold">
									<span className="flex items-center gap-1 text-amber-600">
										<Coins className="h-3.5 w-3.5" />
										{(user?.coins ?? 0).toLocaleString()}
									</span>
									<span className="flex items-center gap-1 text-orange-500">
										<Flame className="h-3.5 w-3.5" />
										{user?.streakCount ?? 0}
									</span>
								</div>
							</div>
							<ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
						</Link>
						<button
							onClick={handleLogout}
							className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/80 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
						>
							<LogOut className="h-4 w-4" /> Logout
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export function Sidebar() {
	const pathname = usePathname();
	const { isCollapsed, setIsCollapsed } = useSidebar();

	return (
		<>
			{/* Desktop Sidebar */}
			<aside
				className={cn(
					"hidden overflow-hidden border-r border-slate-100 bg-white transition-all duration-300 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col",
					isCollapsed ? "lg:w-20" : "lg:w-64",
				)}
			>
				<SidebarContent pathname={pathname} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
			</aside>

			{/* Mobile Sidebar */}
			<Sheet>
				<SheetTrigger asChild>
					<button
						className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md ring-1 ring-slate-100 transition-colors hover:bg-slate-50 lg:hidden"
						aria-label="Open navigation menu"
					>
						<Menu className="h-5 w-5" />
					</button>
				</SheetTrigger>
				<SheetContent side="left" showCloseButton={false} className="w-72 border-r-0 p-0">
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<SheetClose className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</SheetClose>
					<SidebarContent pathname={pathname} />
				</SheetContent>
			</Sheet>
		</>
	);
}
