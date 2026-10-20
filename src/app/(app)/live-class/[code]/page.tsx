"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { liveApi, normalizeClassCode, type LiveClassDetail } from "@/lib/live-class";
import { FatalState } from "@/components/live-class/LiveClassChrome";
import { StudentView } from "@/components/live-class/StudentView";
import { TeacherConsole } from "@/components/live-class/TeacherConsole";

export default function LiveClassRoomPage() {
  const params = useParams<{ code: string }>();
  const code = normalizeClassCode(params.code ?? "");
  const [cls, setCls] = useState<LiveClassDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    liveApi
      .get(code)
      .then((detail) => {
        if (!cancelled) setCls(detail);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Class not found. Check the code and try again."
            : "Couldn't open this class. Please try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) return <FatalState message={error} />;
  if (!cls) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }
  return cls.isTeacher ? <TeacherConsole initial={cls} /> : <StudentView initial={cls} />;
}
