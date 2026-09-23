"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Flame, Hand, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Di luar komponen supaya render tetap murni (aturan purity React).
const YEAR = new Date().getFullYear();

/**
 * Layout halaman auth (login/register): form di kiri, panel ilustrasi di kanan.
 * Panel kanan disembunyikan di layar kecil.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri: form */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-12 lg:w-1/2 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Signify home">
            <Image
              src="/logo/logo-signify.png"
              alt="Signify"
              width={200}
              height={180}
              priority
              className="h-20 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#0B7077]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="font-heading text-3xl font-bold text-[#0F5A5A] sm:text-4xl">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          © {YEAR} Signify · Inclusive education for everyone
        </p>
      </div>

      {/* Kanan: ilustrasi */}
      <div className="relative hidden p-4 lg:block lg:w-1/2">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[40px] bg-[#D2E6E4]">
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply"
            style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
          />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#FFE75C]/40 blur-2xl" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#2DA5A2]/25 blur-2xl" />

          <div className="relative z-10 px-12 pt-14 xl:px-16">
            <span className="inline-block rounded-lg bg-[#FFE75C] px-4 py-1.5 text-sm font-bold text-[#5A4A00]">
              #1 Inclusive Education Platform
            </span>
            <h2 className="mt-6 font-heading text-4xl font-bold leading-tight text-[#0F5A5A] xl:text-5xl">
              Where Vision
              <br />
              Meets Understanding
            </h2>
            <p className="mt-4 max-w-md text-[#0F5A5A]/70">
              Learn sign language with an AI avatar, real-time practice feedback and
              materials made accessible for everyone.
            </p>
          </div>

          <div className="relative z-10 mt-auto flex justify-center">
            <Image
              src="/landing/girl.webp"
              alt="Student learning sign language"
              width={560}
              height={560}
              priority
              className="h-auto w-[78%] max-w-[520px] animate-float object-contain object-bottom"
            />
            <FloatingStat
              icon={Flame}
              tone="bg-orange-100 text-orange-500"
              title="7-day streak"
              caption="Keep it going!"
              className="left-10 top-10 xl:left-16"
            />
            <FloatingStat
              icon={Hand}
              tone="bg-teal-100 text-teal-600"
              title="Sign score 92"
              caption="Great handshape"
              className="right-8 top-1/3 [animation-delay:1.5s] xl:right-14"
            />
            <FloatingStat
              icon={Trophy}
              tone="bg-amber-100 text-amber-500"
              title="+60 coins"
              caption="Quiz completed"
              className="bottom-16 left-8 [animation-delay:3s] xl:left-14"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingStat({
  icon: Icon,
  tone,
  title,
  caption,
  className,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  caption: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex animate-float items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-xl shadow-teal-900/10 backdrop-blur",
        className,
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

/** Input dengan label & ikon di kiri. */
export function AuthField({ label, icon: Icon, id, className, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input id={id} className={cn(inputClass, className)} {...props} />
      </div>
    </div>
  );
}

/** Input password dengan tombol mata untuk tampil/sembunyikan. */
export function PasswordField({ label, icon: Icon, id, className, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(inputClass, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
