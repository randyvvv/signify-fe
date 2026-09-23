"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BookMarked,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Flame,
  Hand,
  Loader2,
  Mail,
  Pencil,
  Settings,
  ShoppingBag,
  Trophy,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth, type User } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { useCachedGet } from "@/lib/cache";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Gender = "" | "male" | "female";

const BIO_MAX = 300;
const CARD = "rounded-3xl bg-white shadow-sm ring-1 ring-slate-100";
const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "", label: "Prefer not to say" },
];

interface VocabularyStats {
  stats: { total: number; due: number; mastered: number; learning: number };
}

interface PracticeStats {
  sessions: number;
  avgAccuracy: number;
  totalCompleted: number;
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

// Di luar komponen supaya render tetap murni (aturan purity React).
function memberSince(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function genderLabel(g?: string | null) {
  return GENDER_OPTIONS.find((o) => o.value === (g ?? ""))?.label ?? "Prefer not to say";
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="font-heading text-lg font-bold text-slate-800">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0B7077]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [bio, setBio] = useState("");

  const { data: vocab } = useCachedGet<VocabularyStats>(
    "/api/vocabulary",
    user ? `vocabulary:${user.id}` : null,
  );
  const { data: practice } = useCachedGet<PracticeStats>(
    "/api/sign-practice",
    user ? `practice:${user.id}` : null,
  );

  // Form diisi dari data user saat mulai mengedit.
  const startEdit = () => {
    setFullName(user?.fullName ?? "");
    setGender((user?.gender as Gender | undefined) ?? "");
    setBio(user?.bio ?? "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/me", {
        fullName: fullName.trim() || undefined,
        gender: gender || undefined,
        bio: bio,
      });
      await refresh();
      toast.success("Profil tersimpan");
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan profil";
      toast.error("Gagal menyimpan", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const since = memberSince((user as (User & { createdAt?: string }) | null)?.createdAt);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ===== Cover + identitas ===== */}
      <div className={cn(CARD, "overflow-hidden")}>
        <div className="relative h-36 bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] md:h-44">
          <div
            className="absolute inset-0 opacity-15 mix-blend-overlay"
            style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
          />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 md:left-6 md:top-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </div>

        <div className="relative px-6 pb-6 md:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="h-28 w-28 border-4 border-white bg-orange-200 shadow-lg">
                <AvatarImage src={user?.avatarUrl || "/profile/avatar.png"} alt={user?.fullName ?? "User"} />
                <AvatarFallback className="text-3xl font-bold">{initials(user?.fullName)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">
                  {user?.fullName ?? "User"}
                </h1>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                    <Coins className="h-3.5 w-3.5" /> {(user?.coins ?? 0).toLocaleString()} coins
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-600">
                    <Flame className="h-3.5 w-3.5" /> {user?.streakCount ?? 0}-day streak
                  </span>
                  {user?.rank != null && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-rose-600">
                      <Trophy className="h-3.5 w-3.5" /> Rank #{user.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={startEdit}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
              >
                <Pencil className="h-4 w-4" /> Edit profile
              </Button>
            )}
          </div>
          {!isEditing && user?.bio && (
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-slate-600">{user.bio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ===== Detail / form ===== */}
        <div className={cn(CARD, "p-6 md:p-8 lg:col-span-8")}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">
                {isEditing ? "Edit profile" : "Profile details"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? "Update how you appear on Signify" : "Your personal information"}
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-6 grid gap-5">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                  Full name
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={cn(INPUT, "h-12 pl-11")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Gender</span>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setGender(o.value)}
                      aria-pressed={gender === o.value}
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        gender === o.value
                          ? "bg-[#0B7077] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={user?.email ?? ""}
                    className={cn(INPUT, "h-12 cursor-not-allowed pl-11 opacity-70")}
                  />
                </div>
                <p className="text-xs text-slate-400">Email can&apos;t be changed.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                  Bio
                </label>
                <div className="relative">
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                    placeholder="Tell others a little about yourself"
                    rows={4}
                    className={cn(INPUT, "resize-none py-3 pb-7")}
                  />
                  <span className="absolute bottom-2.5 right-4 text-xs text-slate-400">
                    {bio.length}/{BIO_MAX}
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="h-11 rounded-xl border-slate-200 px-6 font-semibold text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-8 font-semibold text-white shadow-md shadow-teal-900/10 hover:opacity-95"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <DetailRow icon={UserIcon} label="Full name" value={user?.fullName || "—"} />
              <DetailRow icon={Mail} label="Email address" value={user?.email ?? "—"} />
              <DetailRow icon={Hand} label="Gender" value={genderLabel(user?.gender)} />
              <DetailRow
                icon={Pencil}
                label="Bio"
                value={
                  user?.bio ? (
                    <span className="whitespace-pre-wrap">{user.bio}</span>
                  ) : (
                    <button onClick={startEdit} className="font-semibold text-[#0B7077] hover:underline">
                      Add a bio
                    </button>
                  )
                }
              />
              {since && <DetailRow icon={CalendarDays} label="Member since" value={since} />}
            </div>
          )}
        </div>

        {/* ===== Statistik + pintasan ===== */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className={cn(CARD, "p-6")}>
            <h2 className="font-heading text-lg font-bold text-slate-800">Learning stats</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatTile icon={Flame} label="Day streak" value={user?.streakCount ?? 0} tone="bg-orange-100 text-orange-500" />
              <StatTile icon={Trophy} label="Leaderboard" value={user?.rank != null ? `#${user.rank}` : "—"} tone="bg-rose-100 text-rose-500" />
              <StatTile icon={Clock} label="Hours learned" value={`${user?.totalLearningHours ?? 0}h`} tone="bg-violet-100 text-violet-600" />
              <StatTile icon={Coins} label="Coins" value={(user?.coins ?? 0).toLocaleString()} tone="bg-amber-100 text-amber-600" />
              <StatTile
                icon={BookMarked}
                label="Signs mastered"
                value={vocab ? `${vocab.stats.mastered}/${vocab.stats.total}` : "—"}
                tone="bg-sky-100 text-sky-600"
              />
              <StatTile
                icon={Hand}
                label="Practice score"
                value={practice?.sessions ? `${practice.avgAccuracy}%` : "—"}
                tone="bg-teal-100 text-teal-600"
              />
            </div>
          </div>

          <div className={cn(CARD, "p-3")}>
            {[
              { href: "/shop", icon: ShoppingBag, label: "Customize avatar", tone: "bg-pink-50 text-pink-500" },
              { href: "/my-signs", icon: BookMarked, label: "My Signs", tone: "bg-sky-50 text-sky-600" },
              { href: "/settings", icon: Settings, label: "Settings", tone: "bg-slate-100 text-slate-600" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-slate-50"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", l.tone)}>
                  <l.icon className="h-5 w-5" />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-700">{l.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
