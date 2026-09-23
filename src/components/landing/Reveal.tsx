"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "up" | "down" | "left" | "right" | "zoom" | "fade";

interface RevealProps {
  children: ReactNode;
  /** Arah masuk: "left" = datang dari kanan menuju kiri, "right" = dari kiri. */
  variant?: Variant;
  /** Jeda sebelum animasi (ms), untuk efek berurutan. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Animasi masuk saat elemen terlihat di layar (sekali saja).
 * Gaya ada di globals.css (.reveal); otomatis nonaktif untuk prefers-reduced-motion.
 */
export function Reveal({ children, variant = "up", delay = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-variant={variant}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
