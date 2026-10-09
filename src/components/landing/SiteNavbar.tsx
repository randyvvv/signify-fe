"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type NavKey = "home" | "news";

const PUBLIC_LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "news", href: "/news", label: "News" },
];

const SIGNED_IN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quizzes", label: "Quiz" },
];

/**
 * Navbar halaman publik (landing & news). Taruh di dalam elemen `relative`:
 * menu mobile muncul sebagai overlay di bawahnya.
 */
export function SiteNavbar({ active, className }: { active?: NavKey; className?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const isSignedIn = !loading && !!user;

  const linkClass = (key?: NavKey) =>
    key && key === active
      ? "font-medium text-[#FF7D50] hover:text-[#ff6b3d]"
      : "font-medium text-gray-600 hover:text-[#0F5A5A]";

  return (
    <>
      <nav
        className={cn(
          "relative z-50 container mx-auto flex items-center justify-between px-6 py-4 md:px-12 mb-8 md:mb-12",
          className,
        )}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/logo-signify.png"
            alt="Signify"
            width={200}
            height={180}
            priority
            className="h-32 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden gap-12 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={link.key === active ? "page" : undefined}
              className={linkClass(link.key)}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn &&
            SIGNED_IN_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass()}>
                {link.label}
              </Link>
            ))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {isSignedIn ? (
            <Button
              onClick={logout}
              className="bg-[#DF5D73] text-white hover:bg-[#c94d62] shadow-lg shadow-[#DF5D73]/20 px-8 py-6"
            >
              LOG OUT
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button className="bg-white text-[#0F5A5A] hover:bg-gray-50 shadow-sm px-8 py-6">
                  LOG IN
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#0B7077] text-white hover:bg-[#0b4545] shadow-lg shadow-[#0F5A5A]/20 px-8 py-6">
                  SIGN UP
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="text-[#0F5A5A] h-8 w-8" /> : <Menu className="text-[#0F5A5A] h-8 w-8" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-[80px] left-0 z-40 w-full bg-[#D2E6E4]/95 backdrop-blur-sm p-6 shadow-xl border-t border-[#0F5A5A]/10 md:hidden">
          <div className="flex flex-col gap-6 text-center">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "font-medium text-lg py-2",
                  link.key === active ? "text-[#FF7D50]" : "text-gray-600",
                )}
              >
                {link.label}
              </Link>
            ))}
            {isSignedIn &&
              SIGNED_IN_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="font-medium text-gray-600 text-lg py-2">
                  {link.label}
                </Link>
              ))}
            <div className="flex flex-col gap-4 mt-2">
              {isSignedIn ? (
                <Button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-[#DF5D73] text-white hover:bg-[#c94d62] py-6"
                >
                  LOG OUT
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="w-full bg-white text-[#0F5A5A] border border-[#0F5A5A]/20 hover:bg-gray-50 py-6">
                      LOG IN
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-[#0B7077] text-white hover:bg-[#0b4545] py-6">
                      SIGN UP
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
