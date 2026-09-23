"use client";

import {
  ArrowRight,
  Bell,
  BookA,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  Flame,
  Globe,
  Hand,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MonitorPlay,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  UserRound,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordField } from "@/components/auth/AuthLayout";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Preferences {
  notifications: boolean;
  soundEffects: boolean;
  autoplay: boolean;
  language: string;
  signLanguage: string;
}

interface SignLanguageInfo {
  code: string;
  name: string;
  signGpt: boolean;
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

const DEFAULT_SIGN_LANGUAGES: SignLanguageInfo[] = [
  { code: "ase", name: "American Sign Language (ASL)", signGpt: true },
];

const APP_VERSION = "1.0.0";

function initials(name: string | null | undefined, email?: string) {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "U";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Toggle({
  enabled,
  onClick,
  label,
  disabled,
}: {
  enabled: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2DA5A2]/25 disabled:cursor-not-allowed disabled:opacity-50",
        enabled
          ? "bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] shadow-inner shadow-teal-900/20"
          : "bg-slate-200 hover:bg-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300",
          enabled ? "translate-x-5" : "translate-x-0",
        )}
      >
        <Check
          className={cn(
            "h-3.5 w-3.5 text-[#0B7077] transition-opacity duration-200",
            enabled ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
    </button>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none truncate rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function IconTile({ icon: Icon, tone }: { icon: LucideIcon; tone: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
        tone,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function RowText({ label, description }: { label: string; description?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-slate-800">{label}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

/** Baris pengaturan: ikon + label + deskripsi + kontrol di kanan. */
function SettingRow({
  icon,
  tone,
  label,
  description,
  children,
  stackOnMobile,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  description?: string;
  children?: ReactNode;
  stackOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 px-5 py-4 sm:items-center sm:px-6",
        stackOnMobile ? "flex-col sm:flex-row" : "items-center",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <IconTile icon={icon} tone={tone} />
        <RowText label={label} description={description} />
      </div>
      {children}
    </div>
  );
}

function LinkRow({
  href,
  icon,
  tone,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-6"
    >
      <IconTile icon={icon} tone={tone} />
      <RowText label={label} description={description} />
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-teal-500" />
    </Link>
  );
}

function Section({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </header>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function ControlSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 animate-pulse bg-slate-200/70",
        wide ? "h-11 w-full rounded-xl sm:w-64" : "h-7 w-12 rounded-full",
      )}
    />
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [signLanguages, setSignLanguages] = useState<SignLanguageInfo[]>([]);

  // change-password form
  const [showPwd, setShowPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    api
      .get<Preferences>("/api/me/preferences")
      .then(setPrefs)
      .catch(() => toast.error("Gagal memuat preferensi"))
      .finally(() => setPrefsLoading(false));
    api
      .get<{ languages: SignLanguageInfo[] }>("/api/signs/languages")
      .then((res) => setSignLanguages(res.languages))
      .catch(() => {});
  }, []);

  const updatePref = async (patch: Partial<Preferences>) => {
    if (!prefs) return;
    const prev = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next); // optimistic
    try {
      await api.put("/api/me/preferences", patch);
    } catch {
      setPrefs(prev); // revert
      toast.error("Gagal menyimpan preferensi");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    setSavingPwd(true);
    try {
      await api.post("/api/me/password", { currentPassword, newPassword });
      toast.success("Password berhasil diubah");
      setShowPwd(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengubah password";
      toast.error("Gagal mengubah password", { description: msg });
    } finally {
      setSavingPwd(false);
    }
  };

  const cancelChangePassword = () => {
    setShowPwd(false);
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const signLanguageOptions = signLanguages.length ? signLanguages : DEFAULT_SIGN_LANGUAGES;
  // Bahasa isyarat tanpa SignGPT (mis. BISINDO) hanya memakai kamus Signify.
  const dictionaryOnly = signLanguages.find(
    (l) => l.code === prefs?.signLanguage && !l.signGpt,
  );
  const newPwdOk = newPassword.length >= 6;
  const displayName = user?.fullName?.trim() || "Signify Learner";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Hero ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <SlidersHorizontal className="pointer-events-none absolute -bottom-6 right-6 hidden h-36 w-36 rotate-12 text-white/10 sm:block" />
        <div className="relative flex items-center gap-4">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold md:text-3xl">Settings</h1>
            <p className="text-sm text-white/80">Manage your preferences, account and privacy</p>
          </div>
        </div>
      </div>

      {/* ===== Profile summary ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-50" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 bg-orange-200 ring-4 ring-teal-50">
              <AvatarImage src={user?.avatarUrl || "/profile/avatar.png"} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-[#2DA5A2] to-[#0B7077] font-heading text-lg font-bold text-white">
                {initials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-bold text-slate-800">{displayName}</p>
              <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                  <Coins className="h-3.5 w-3.5" /> {(user?.coins ?? 0).toLocaleString()} coins
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500 ring-1 ring-orange-100">
                  <Flame className="h-3.5 w-3.5" /> {user?.streakCount ?? 0} day
                  {(user?.streakCount ?? 0) === 1 ? "" : "s"} streak
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 transition-all hover:shadow-md hover:brightness-105"
          >
            View profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ===== General ===== */}
      <Section
        icon={SlidersHorizontal}
        tone="bg-teal-50 text-teal-600"
        title="General"
        description="How Signify behaves while you learn"
      >
        <SettingRow
          icon={Bell}
          tone="bg-teal-50 text-teal-600"
          label="Notifications"
          description="Receive updates and reminders"
        >
          {prefsLoading ? (
            <ControlSkeleton />
          ) : (
            <Toggle
              label="Notifications"
              enabled={prefs?.notifications ?? false}
              disabled={!prefs}
              onClick={() => updatePref({ notifications: !prefs?.notifications })}
            />
          )}
        </SettingRow>
        <SettingRow
          icon={Volume2}
          tone="bg-violet-50 text-violet-600"
          label="Sound Effects"
          description="Play sounds for actions and feedback"
        >
          {prefsLoading ? (
            <ControlSkeleton />
          ) : (
            <Toggle
              label="Sound Effects"
              enabled={prefs?.soundEffects ?? false}
              disabled={!prefs}
              onClick={() => updatePref({ soundEffects: !prefs?.soundEffects })}
            />
          )}
        </SettingRow>
        <SettingRow
          icon={MonitorPlay}
          tone="bg-rose-50 text-rose-500"
          label="Autoplay Videos"
          description="Automatically play learning videos"
        >
          {prefsLoading ? (
            <ControlSkeleton />
          ) : (
            <Toggle
              label="Autoplay Videos"
              enabled={prefs?.autoplay ?? false}
              disabled={!prefs}
              onClick={() => updatePref({ autoplay: !prefs?.autoplay })}
            />
          )}
        </SettingRow>
        <SettingRow
          icon={Globe}
          tone="bg-sky-50 text-sky-600"
          label="Language"
          description="Language used across the app"
          stackOnMobile
        >
          {prefsLoading ? (
            <ControlSkeleton wide />
          ) : (
            <SelectControl
              label="Language"
              value={prefs?.language ?? "en"}
              disabled={!prefs}
              onChange={(v) => updatePref({ language: v })}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </SelectControl>
          )}
        </SettingRow>
      </Section>

      {/* ===== Sign Language ===== */}
      <Section
        icon={Hand}
        tone="bg-orange-50 text-orange-500"
        title="Sign Language"
        description="Choose how your avatar signs"
      >
        <div>
          <SettingRow
            icon={Sparkles}
            tone="bg-orange-50 text-orange-500"
            label="Avatar sign language"
            description="Used by the avatar in the translator, practice, quizzes and My Signs"
            stackOnMobile
          >
            {prefsLoading ? (
              <ControlSkeleton wide />
            ) : (
              <SelectControl
                label="Avatar sign language"
                value={prefs?.signLanguage ?? "ase"}
                disabled={!prefs}
                onChange={(v) => updatePref({ signLanguage: v })}
              >
                {signLanguageOptions.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </SelectControl>
            )}
          </SettingRow>
          {dictionaryOnly && (
            <div className="mx-5 mb-4 flex gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100 animate-in fade-in slide-in-from-top-1 sm:mx-6">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p>
                <span className="font-semibold">{dictionaryOnly.name}</span> only uses signs from the
                Signify dictionary. Words that are not in the dictionary yet cannot be signed by the
                avatar.
              </p>
            </div>
          )}
        </div>
        <LinkRow
          href="/sign-dictionary"
          icon={BookA}
          tone="bg-amber-50 text-amber-600"
          label="Sign Dictionary"
          description="Browse every sign the avatar knows"
        />
      </Section>

      {/* ===== Account ===== */}
      <Section
        icon={UserRound}
        tone="bg-violet-50 text-violet-600"
        title="Account"
        description="Your profile and sign-in details"
      >
        <LinkRow
          href="/profile"
          icon={UserRound}
          tone="bg-violet-50 text-violet-600"
          label="Edit Profile"
          description="Update your name, photo and bio"
        />
        <div>
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-expanded={showPwd}
            aria-controls="change-password-form"
            className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
          >
            <IconTile icon={KeyRound} tone="bg-sky-50 text-sky-600" />
            <RowText label="Change Password" description="Update the password you use to sign in" />
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-slate-300 transition-transform duration-300 group-hover:text-teal-500",
                showPwd && "rotate-180 text-teal-500",
              )}
            />
          </button>
          {showPwd && (
            <form
              id="change-password-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleChangePassword();
              }}
              className="mx-5 mb-5 space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 animate-in fade-in slide-in-from-top-1 sm:mx-6 sm:p-5"
            >
              <PasswordField
                id="current-password"
                label="Current password"
                icon={Lock}
                placeholder="Enter your current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-white"
              />
              <div className="space-y-2">
                <PasswordField
                  id="new-password"
                  label="New password"
                  icon={KeyRound}
                  placeholder="New password (min 6 chars)"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white"
                />
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium transition-colors",
                    newPwdOk ? "text-emerald-600" : "text-slate-500",
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5", !newPwdOk && "opacity-40")} />
                  At least 6 characters
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelChangePassword}
                  className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 transition-all hover:shadow-md hover:brightness-105 disabled:opacity-60"
                >
                  {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savingPwd ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Section>

      {/* ===== Privacy & Security ===== */}
      <Section
        icon={ShieldCheck}
        tone="bg-sky-50 text-sky-600"
        title="Privacy & Security"
        description="How we handle your data"
      >
        <LinkRow
          href="/privacy-policy"
          icon={ShieldCheck}
          tone="bg-sky-50 text-sky-600"
          label="Privacy Policy"
          description="What we collect and why"
        />
        <LinkRow
          href="/terms-of-service"
          icon={FileText}
          tone="bg-slate-100 text-slate-600"
          label="Terms of Service"
          description="The rules for using Signify"
        />
      </Section>

      {/* ===== About ===== */}
      <Section
        icon={Info}
        tone="bg-amber-50 text-amber-600"
        title="About"
        description="The app behind your learning"
      >
        <LinkRow
          href="/about"
          icon={Info}
          tone="bg-amber-50 text-amber-600"
          label="About Signify"
          description="Our mission for inclusive education"
        />
        <SettingRow icon={Tag} tone="bg-slate-100 text-slate-600" label="Version">
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">
            {APP_VERSION}
          </span>
        </SettingRow>
      </Section>

      {/* ===== Logout ===== */}
      <div className="flex flex-col gap-4 rounded-3xl bg-rose-50/70 p-5 ring-1 ring-rose-100 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <IconTile icon={LogOut} tone="bg-white text-[#DF5D73] shadow-sm" />
          <RowText label="Log out" description="Sign out of Signify on this device" />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#DF5D73] px-5 text-sm font-semibold text-white shadow-sm shadow-rose-900/10 transition-all hover:bg-[#c94a60] hover:shadow-md"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </div>
  );
}
