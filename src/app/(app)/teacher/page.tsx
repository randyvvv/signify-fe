"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Captions,
  FileText,
  GraduationCap,
  Plus,
  Radio,
  Settings,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { languageLabel } from "@/lib/live-class";
import { teacherApi, type TeacherLiveClass, type TeacherMaterial } from "@/lib/teacher";
import { ClassToMaterial } from "@/components/teacher/ClassToMaterial";
import { cn } from "@/lib/utils";

const MATERIAL_IMAGE_FALLBACK = "/learning-materials/image-not-found.png";

const STATUS_STYLE: Record<TeacherLiveClass["status"], { label: string; tone: string }> = {
  waiting: { label: "Not started", tone: "bg-slate-100 text-slate-600" },
  live: { label: "Live", tone: "bg-orange-50 text-[#FD661F]" },
  ended: { label: "Ended", tone: "bg-slate-100 text-slate-500" },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function StatTile({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number | null; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", tone)}>
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="font-heading text-2xl font-bold text-slate-800">{value ?? "–"}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-slate-800">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirming) {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 4000);
          return;
        }
        setBusy(true);
        await onConfirm();
        setBusy(false);
      }}
      aria-label="Delete material"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors disabled:opacity-50",
        confirming ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-rose-50 hover:text-rose-600",
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {confirming && "Tap again"}
    </button>
  );
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [classes, setClasses] = useState<TeacherLiveClass[] | null>(null);
  const [materials, setMaterials] = useState<TeacherMaterial[] | null>(null);

  useEffect(() => {
    if (!isTeacher) return;
    teacherApi
      .classes()
      .then(setClasses)
      .catch(() => {
        setClasses([]);
        toast.error("Gagal memuat Kelas Live");
      });
    teacherApi
      .materials()
      .then(setMaterials)
      .catch(() => {
        setMaterials([]);
        toast.error("Gagal memuat materi");
      });
  }, [isTeacher]);

  if (user && !isTeacher) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <GraduationCap className="h-7 w-7" aria-hidden />
        </div>
        <p className="font-heading text-lg font-bold text-slate-800">The Teacher Dashboard is for teacher accounts</p>
        <p className="text-sm text-slate-500">Switch your account to Teacher in Settings to create classes and materials.</p>
        <Link
          href="/settings"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-6 text-sm font-semibold text-white shadow-md shadow-teal-900/10"
        >
          <Settings className="h-4 w-4" aria-hidden /> Open Settings
        </Link>
      </div>
    );
  }

  const removeMaterial = async (id: string) => {
    try {
      await teacherApi.deleteMaterial(id);
      setMaterials((list) => list?.filter((m) => m.id !== id) ?? null);
      // Kelas yang materinya dihapus bisa diubah jadi materi lagi.
      setClasses((list) => list?.map((c) => (c.materialId === id ? { ...c, materialId: null, quizId: null } : c)) ?? null);
      toast.success("Material deleted");
    } catch {
      toast.error("Gagal menghapus materi");
    }
  };

  // Nama lengkap (bukan kata pertama) supaya gelar seperti "Ms." tidak berdiri sendiri.
  const displayName = user?.fullName?.trim();
  const liveNow = classes?.filter((c) => c.status === "live").length ?? null;
  const sentences = classes ? classes.reduce((sum, c) => sum + c.segmentCount, 0) : null;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:px-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-white/80">Teacher Dashboard</p>
            <h1 className="mt-1 font-heading text-2xl font-bold md:text-3xl">
              {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Teach live with captions and sign language, then share your lessons as materials.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:ml-auto">
            <Link
              href="/live-class"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#0B7077] shadow-md transition-transform hover:scale-[1.02]"
            >
              <Radio className="h-4 w-4" aria-hidden /> Start a live class
            </Link>
            <Link
              href="/teacher/materials/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-5 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add material
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Radio} label="Live classes" value={classes?.length ?? null} tone="bg-teal-50 text-[#0B7077]" />
        <StatTile icon={Radio} label="Live right now" value={liveNow} tone="bg-orange-50 text-[#FD661F]" />
        <StatTile icon={BookOpen} label="Materials" value={materials?.length ?? null} tone="bg-violet-50 text-violet-600" />
        <StatTile icon={Captions} label="Sentences transcribed" value={sentences} tone="bg-sky-50 text-sky-600" />
      </div>

      <SectionCard
        title="Live classes"
        action={
          <Link href="/live-class" className="text-sm font-semibold text-[#0B7077] hover:underline">
            New class
          </Link>
        }
      >
        {classes === null ? (
          <ListSkeleton />
        ) : classes.length === 0 ? (
          <p className="text-sm text-slate-500">No classes yet. Start one and share the join code with your students.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {classes.map((cls) => (
              <li key={cls.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                <Link href={`/live-class/${cls.code}`} className="group flex min-w-0 flex-1 items-center gap-4">
                  <span className="w-20 shrink-0 font-mono text-sm font-bold tracking-widest text-[#0B7077]">{cls.code}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800 group-hover:text-[#0B7077]">{cls.title}</span>
                    <span className="block text-xs text-slate-500">
                      {languageLabel(cls)} · {cls.segmentCount} sentences · {formatDate(cls.createdAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      STATUS_STYLE[cls.status].tone,
                    )}
                  >
                    {STATUS_STYLE[cls.status].label}
                  </span>
                </Link>
                {cls.status === "ended" && (
                  <ClassToMaterial
                    key={`${cls.id}-${cls.materialId ?? "none"}`}
                    code={cls.code}
                    segmentCount={cls.segmentCount}
                    materialId={cls.materialId}
                    quizId={cls.quizId}
                    className="md:justify-end"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Your materials"
        action={
          <Link href="/teacher/materials/new" className="text-sm font-semibold text-[#0B7077] hover:underline">
            Add material
          </Link>
        }
      >
        {materials === null ? (
          <ListSkeleton />
        ) : materials.length === 0 ? (
          <p className="text-sm text-slate-500">
            No materials yet. Add a YouTube video or an article, or turn a finished live class into one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center gap-4 py-3">
                <Link href={`/learning-materials/${m.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail YouTube/eksternal */}
                  <img
                    src={m.thumbnailUrl || MATERIAL_IMAGE_FALLBACK}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-xl bg-slate-100 object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800 group-hover:text-[#0B7077]">{m.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      {m.type === "video" ? <Video className="h-3.5 w-3.5" aria-hidden /> : <FileText className="h-3.5 w-3.5" aria-hidden />}
                      {m.type === "video" ? "Video" : "Article"} · {m.category}
                      {m.durationMinutes ? ` · ${m.durationMinutes} min` : ""} · {formatDate(m.createdAt)}
                    </span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#0B7077]" />
                </Link>
                <DeleteButton onConfirm={() => removeMaterial(m.id)} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
