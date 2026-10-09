"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// OAuth Client ID Google (harus sama dengan GOOGLE_CLIENT_ID di signify-api).
// Kosong = tombol Google tidak ditampilkan.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type ButtonText = "signin_with" | "signup_with" | "continue_with";

// Bagian API Google Identity Services (accounts.google.com/gsi/client) yang dipakai.
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: ButtonText;
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

// Batas lebar tombol dari Google (px).
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/**
 * Tombol "Sign in with Google" + pemisah "or". ID token dari Google dikirim ke
 * signify-api (/api/auth/google), lalu user diarahkan ke dashboard.
 */
export function GoogleSignIn({ text }: { text: ButtonText }) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Callback Google memanggil versi terbaru handler tanpa inisialisasi ulang.
  const handleCredential = useRef<(credential: string) => void>(() => {});
  useEffect(() => {
    handleCredential.current = async (credential: string) => {
      setSigningIn(true);
      try {
        const { isNewUser } = await loginWithGoogle(credential);
        toast.success(isNewUser ? "Account created!" : "Welcome back!");
        router.replace("/dashboard");
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Tidak bisa terhubung ke server";
        toast.error("Login dengan Google gagal", { description: msg });
        setSigningIn(false);
      }
    };
  }, [loginWithGoogle, router]);

  useEffect(() => {
    const container = containerRef.current;
    const gsi = window.google?.accounts.id;
    if (!scriptReady || !GOOGLE_CLIENT_ID || !container || !gsi) return;

    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => handleCredential.current(credential),
      ux_mode: "popup",
      auto_select: false,
    });

    // Lebar tombol Google tetap (px), jadi render ulang saat lebar kolom berubah.
    let renderedWidth = 0;
    const render = () => {
      const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(container.clientWidth)));
      if (width === renderedWidth) return;
      renderedWidth = width;
      container.replaceChildren();
      gsi.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        shape: "pill",
        logo_alignment: "center",
        width,
        locale: "en",
      });
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(container);
    return () => observer.disconnect();
  }, [scriptReady, text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => toast.error("Tombol Google gagal dimuat")}
      />
      <div className="relative">
        <div
          ref={containerRef}
          aria-busy={signingIn}
          className={cn("flex h-11 w-full justify-center", signingIn && "pointer-events-none opacity-50")}
        />
        {signingIn && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in...
          </div>
        )}
      </div>
      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or use email
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </>
  );
}
