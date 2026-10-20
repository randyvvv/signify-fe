"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { teacherApi, type TeacherMaterial } from "@/lib/teacher";
import { MaterialList } from "@/components/teacher/MaterialList";

export default function TeacherMaterialsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [materials, setMaterials] = useState<TeacherMaterial[] | null>(null);

  useEffect(() => {
    if (!isTeacher) return;
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
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
        <p className="font-heading text-lg font-bold text-slate-800">Only teacher accounts manage materials</p>
        <Link href="/learning-materials" className="mt-4 inline-block text-sm font-semibold text-[#0B7077] hover:underline">
          Browse Learning Materials
        </Link>
      </div>
    );
  }

  const remove = async (id: string) => {
    try {
      await teacherApi.deleteMaterial(id);
      setMaterials((list) => list?.filter((m) => m.id !== id) ?? null);
      toast.success("Material deleted");
    } catch {
      toast.error("Gagal menghapus materi");
    }
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Materials</h1>
          <p className="text-sm text-slate-500">
            Videos and articles you published. Students find them in Learning Materials with the signing avatar and AI
            chat.
          </p>
        </div>
        <Link
          href="/teacher/materials/new"
          className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] px-5 text-sm font-semibold text-white shadow-md shadow-teal-900/10 sm:ml-auto sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add material
        </Link>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <MaterialList materials={materials} onDelete={remove} />
      </div>
    </div>
  );
}
