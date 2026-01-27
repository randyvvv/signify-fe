"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, GraduationCap, Briefcase, School, Globe, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<{
    goals: string[];
    master: string;
    frequency: string;
  }>({
    goals: [],
    master: "",
    frequency: "",
  });

  const handleGoalSelect = (id: string) => {
    setSelections((prev) => {
      const isSelected = prev.goals.includes(id);
      if (isSelected) {
        return { ...prev, goals: prev.goals.filter((g) => g !== id) };
      }
      if (prev.goals.length >= 3) return prev;
      return { ...prev, goals: [...prev.goals, id] };
    });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    // TODO: Save questionnaire data to backend or user profile service
    // console.log("User selections:", selections);
    onComplete();
  };

  return (
    // <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-50 via-white to-amber-50">
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(112.27deg, #C5FBF9 0%, #FFFFFF 77.41%, #FDF5BF 100%)' }}
    >
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-[#D8D5D5] z-50">
        <div 
          className="h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${((step - 1) / 3) * 100}%`,
            background: 'linear-gradient(90deg, #458785 0%, #E799A3 100%)'
          }}
        />
      </div>

      <div className="w-full max-w-4xl space-y-8">
        
        {/* Step Counter */}
        <div className="flex justify-end text-muted-foreground font-medium">
          {step} of 3
        </div>

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">What are your main learning goals?</h1>
              <p className="text-muted-foreground text-lg">Select up to 3 areas you want to focus on</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "k12", label: "K-12 Education", desc: "Elementary, Middle, or High School", icon: School },
                { id: "vocational", label: "Vocational Education", desc: "Trade school or skill courses", icon: GraduationCap },
                { id: "higher-ed", label: "Higher Education", desc: "College or University Level", icon: GraduationCap },
                { id: "career", label: "Career Development", desc: "Job skills and interview", icon: Briefcase },
                { id: "sign-lang", label: "Sign Language", desc: "Learn and practice sign language", icon: Globe },
              ].map((item) => {
                const isSelected = selections.goals.includes(item.id);
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleGoalSelect(item.id)}
                    className={cn(
                      "cursor-pointer group relative flex items-center p-6 bg-white border-2 rounded-xl transition-all hover:shadow-md",
                      isSelected ? "border-teal-500 shadow-sm" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                     <div className={cn("absolute right-4 top-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors", 
                        isSelected ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300"
                     )}>
                        {isSelected && <Check className="h-4 w-4" />}
                     </div>
                     <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mr-4">
                        <Icon className="h-6 w-6 text-slate-700" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">{item.label}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Master Most */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">What do you want to master most?</h1>
              <p className="text-muted-foreground text-lg">Select your primary focus areas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "sign-master", label: "Sign Language", desc: "Learn and practice sign language", icon: Globe },
                { id: "academic", label: "Academic Materials", desc: "School/university subjects", icon: School },
                { id: "presentations", label: "Presentations", desc: "Public speaking experience", icon: Users },
                { id: "explore", label: "Explore All", desc: "Try all features", icon: GraduationCap },
              ].map((item) => {
                const isSelected = selections.master === item.id;
                const Icon = item.icon;
                return (
                   <div
                    key={item.id}
                    onClick={() => setSelections(prev => ({ ...prev, master: item.id }))}
                    className={cn(
                      "cursor-pointer group relative flex items-center p-6 bg-white border-2 rounded-xl transition-all hover:shadow-md",
                      isSelected ? "border-purple-600 shadow-sm" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                     <div className={cn("absolute right-4 top-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors", 
                        isSelected ? "bg-white border-purple-600" : "border-slate-300"
                     )}>
                         {isSelected && <div className="h-3 w-3 rounded-full bg-purple-600" />}
                     </div>
                     <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mr-4">
                        <Icon className="h-6 w-6 text-slate-700" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">{item.label}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Frequency */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">How often do you want to learn?</h1>
              <p className="text-muted-foreground text-lg">We&apos;ll remind you based on your preference</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                { id: "casual", label: "Casual", desc: "1-2 times per week", icon: School },
                { id: "regular", label: "Regular", desc: "3-4 times per week", icon: GraduationCap },
                { id: "intensive", label: "Intensive", desc: "Every day", icon: Briefcase },
              ].map((item) => {
                const isSelected = selections.frequency === item.id;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelections(prev => ({ ...prev, frequency: item.id }))}
                    className={cn(
                      "cursor-pointer group relative flex items-center p-6 bg-white border-2 rounded-xl transition-all hover:shadow-md",
                      isSelected ? "border-purple-600 shadow-sm" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                     <div className={cn("absolute right-4 top-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors", 
                        isSelected ? "bg-white border-purple-600" : "border-slate-300"
                     )}>
                        {isSelected && <div className="h-3 w-3 rounded-full bg-purple-600" />}
                     </div>
                     <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mr-4">
                        <Icon className="h-6 w-6 text-slate-700" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">{item.label}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
            <Button 
                variant="outline" 
                size="lg" 
                onClick={step === 1 ? undefined : handleBack}
                disabled={step === 1}
                className={cn("w-32", step === 1 ? "opacity-0 pointer-events-none" : "")}
            >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 3 ? (
                 <Button 
                    variant="default" 
                    size="lg" 
                    onClick={handleNext}
                    className="bg-teal-600 hover:bg-teal-700 w-32"
                >
                    Confirm <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button 
                    variant="default" 
                    size="lg" 
                    onClick={handleConfirm}
                    className="bg-teal-600 hover:bg-teal-700 w-40"
                    disabled={!selections.frequency}
                >
                    Start learning <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
