"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/dashboard/OnboardingFlow";
import { MainDashboard } from "@/components/dashboard/MainDashboard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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

  // Guard: belum login -> /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Cek status onboarding dari preferences.
  useEffect(() => {
    if (!user) return;
    api
      .get<{ onboardingCompleted: boolean }>("/api/me/preferences")
      .then((p) => setOnboarded(p.onboardingCompleted))
      .catch(() => setOnboarded(true)); // jangan blokir kalau gagal
  }, [user]);

  if (loading || !user || onboarded === null) return <Loading />;

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  }

  return (
    <>
      <MainDashboard />
    </>
  );
}
