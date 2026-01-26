"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { OnboardingFlow } from "@/components/dashboard/OnboardingFlow";
import { MainDashboard } from "@/components/dashboard/MainDashboard";

export default function DashboardPage() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local storage on client mount
    const completed = localStorage.getItem("hasCompletedOnboarding");
    setIsOnboardingCompleted(completed === "true");
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setIsOnboardingCompleted(true);
  };

  // Prevent flash of content while checking local storage
  if (isOnboardingCompleted === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  // Tactical Dashboard (First Time)
  if (!isOnboardingCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Real Dashboard (Returning User)
  return (
    <MainLayout>
      <MainDashboard />
    </MainLayout>
  );
}

