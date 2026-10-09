import type { ReactNode } from "react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { cn } from "@/lib/utils";

/** Band hijau bercorak + navbar, senada dengan hero landing page. */
export function NewsHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header className={cn("relative bg-[#D2E6E4] pt-6 pb-16 rounded-b-[48px] md:rounded-b-[80px]", className)}>
      <div
        className="absolute inset-0 z-0 rounded-b-[48px] opacity-40 mix-blend-multiply md:rounded-b-[80px]"
        style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
      />
      <SiteNavbar active="news" className="mb-2 md:mb-6" />
      <div className="relative z-10 container mx-auto px-6 md:px-12">{children}</div>
    </header>
  );
}
