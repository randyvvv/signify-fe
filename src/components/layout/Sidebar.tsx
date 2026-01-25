"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Languages,
  BookOpen,
  HelpCircle,
  Hand,
  User,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    icon: <LayoutDashboard className="h-5 w-5" />,
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
    icon: <HelpCircle className="h-5 w-5" />,
  },
  {
    href: "/sign-practice",
    label: "Sign Practice",
    icon: <Hand className="h-5 w-5" />,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-white shadow-md"
          : "text-grey hover:bg-tertiary/50 hover:text-quaternary"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Hand className="h-6 w-6 text-white" />
        </div>
        <span className="font-heading text-xl font-bold text-quaternary">
          Signify
        </span>
      </div>

      <Separator className="mx-4 w-auto" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="mx-4 w-auto" />

      {/* Profile Section */}
      <div className="p-4">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200",
            pathname === "/profile"
              ? "bg-secondary/50"
              : "hover:bg-tertiary/30"
          )}
        >
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src="/placeholder-avatar.png" alt="User" />
            <AvatarFallback className="bg-primary text-white font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-quaternary">
              User Name
            </span>
            <span className="text-xs text-grey">View Profile</span>
          </div>
        </Link>
      </div>
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
