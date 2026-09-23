"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/dashboard/OnboardingFlow";
import { MainDashboard } from "@/components/dashboard/MainDashboard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { readCache, writeCache } from "@/lib/cache";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      Loading...
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  // Onboarding yang sudah selesai tidak kembali -> aman dipakai dari cache
  // supaya dashboard langsung tampil tanpa menunggu /api/me/preferences.
  const onboardedKey = user ? `onboarded:${user.id}` : null;
  const isOnboarded =
    onboarded ?? (onboardedKey && readCache<boolean>(onboardedKey) ? true : null);

  // Guard: belum login -> /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Cek status onboarding dari preferences.
  useEffect(() => {
    if (!user) return;
    api
      .get<{ onboardingCompleted: boolean }>("/api/me/preferences")
      .then((p) => {
        if (p.onboardingCompleted) writeCache(`onboarded:${user.id}`, true);
        setOnboarded(p.onboardingCompleted);
      })
      .catch(() => setOnboarded(true)); // jangan blokir kalau gagal
  }, [user]);

  if (loading || !user || isOnboarded === null) return <Loading />;

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  }

  return (
    <>
      <MainDashboard />
    </>
  );
}
