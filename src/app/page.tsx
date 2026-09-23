"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth-context";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/landing/Reveal";

// Video demo di section "Meet SIGNA" (https://youtu.be/wi_hiz7INks).
const DEMO_VIDEO_ID = "wi_hiz7INks";

// Garis tipis di atas layar yang menunjukkan progres scroll halaman.
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-[#0B7077] via-[#FD661F] to-[#DF5D73]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const isSignedIn = !loading && !!user;

  const scrollToVideo = () => {
    const section = document.getElementById("video-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen font-body bg-white">
      <ScrollProgress />

      {/* Hero Section */}
      <section className="relative bg-[#D2E6E4] pb-0 pt-6 rounded-b-[60px] md:rounded-b-[100px] overflow-visible md:pb-32">
         {/* Background Pattern */}
         <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply"
              style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: 'cover' }}>
         </div>

        {/* Navbar */}
        <nav className="relative z-50 container mx-auto flex items-center justify-between px-6 py-4 md:px-12 mb-8 md:mb-12">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/logo-signify.png"
                alt="Signify"
                width={200}
                height={180}
                priority
                className="h-32 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden gap-12 md:flex">
              <Link href="#" className="font-medium text-[#FF7D50] hover:text-[#ff6b3d]">
                Home
              </Link>
              {isSignedIn && (
                <>
                  <Link href="/dashboard" className="font-medium text-gray-600 hover:text-[#0F5A5A]">
                    Dashboard
                  </Link>
                  <Link href="/quizzes" className="font-medium text-gray-600 hover:text-[#0F5A5A]">
                    Quiz
                  </Link>
                </>
              )}
            </div>
            <div className="hidden items-center gap-4 md:flex">
              {isSignedIn ? (
                <Button
                  onClick={logout}
                  className="bg-[#DF5D73] text-white hover:bg-[#c94d62] shadow-lg shadow-[#DF5D73]/20 px-8 py-6"
                >
                  LOG OUT
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="bg-white text-[#0F5A5A] hover:bg-gray-50 shadow-sm px-8 py-6">
                      LOG IN
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[#0B7077] text-white hover:bg-[#0b4545] shadow-lg shadow-[#0F5A5A]/20 px-8 py-6">
                      SIGN UP
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="text-[#0F5A5A] h-8 w-8" /> : <Menu className="text-[#0F5A5A] h-8 w-8" />}
            </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
            <div className="absolute top-[80px] left-0 z-40 w-full bg-[#D2E6E4]/95 backdrop-blur-sm p-6 shadow-xl border-t border-[#0F5A5A]/10 md:hidden">
                <div className="flex flex-col gap-6 text-center">
                    <Link href="#" className="font-medium text-[#FF7D50] text-lg py-2">Home</Link>
                    {isSignedIn && (
                      <>
                        <Link href="/dashboard" className="font-medium text-gray-600 text-lg py-2">Dashboard</Link>
                        <Link href="/quizzes" className="font-medium text-gray-600 text-lg py-2">Quiz</Link>
                      </>
                    )}
                    <div className="flex flex-col gap-4 mt-2">
                        {isSignedIn ? (
                          <Button
                            onClick={() => {
                              logout();
                              setIsMenuOpen(false);
                            }}
                            className="w-full bg-[#DF5D73] text-white hover:bg-[#c94d62] py-6"
                          >
                            LOG OUT
                          </Button>
                        ) : (
                          <>
                            <Link href="/login">
                                <Button className="w-full bg-white text-[#0F5A5A] border border-[#0F5A5A]/20 hover:bg-gray-50 py-6">
                                    LOG IN
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="w-full bg-[#0B7077] text-white hover:bg-[#0b4545] py-6">
                                    SIGN UP
                                </Button>
                            </Link>
                          </>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="relative z-10 container mx-auto flex flex-col items-center gap-12 px-6 md:flex-row md:justify-between md:px-12">
          {/* Left Content */}
          <div className="flex max-w-3xl flex-col items-start gap-6 md:gap-8 text-left z-20">
            <Reveal variant="down">
            <span className="inline-block rounded-lg bg-[#FFE75C] px-4 py-2 text-sm font-bold text-[#5A4A00]">
              #1 Inclusive Education Platform
            </span>
            </Reveal>

            <Reveal delay={120}>
            <h1 className="font-heading text-4xl font-bold leading-[1.1] text-[#0F5A5A] md:text-5xl lg:text-7xl">
              Where <span className="relative z-10 after:absolute after:bottom-2 after:left-0 after:-z-10 after:h-4 after:w-full after:bg-[#FFF59D] after:content-['']">Vision</span> <br />
              <span className="whitespace-nowrap">
                Meets <span className="relative z-10 after:absolute after:bottom-2 after:left-0 after:-z-10 after:h-4 after:w-full after:bg-[#FFF59D] after:content-['']">Understanding</span>
              </span>
            </h1>
            </Reveal>

            <Reveal delay={240}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link href="/register">
                <Button size="lg" className="h-14 rounded-xl bg-[#FD661F] px-8 text-lg text-white hover:bg-[#ff6b3d] hover:scale-105 transition-transform">
                  START LEARNING FREE
                </Button>
              </Link>

              <div className="flex items-center gap-3">
                 <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#D6EFEF] bg-gray-300">
                          <Image src='/landing/avatar.png' alt="User" width={40} height={40} />
                      </div>
                    ))}
                 </div>
                 <div className="flex flex-col">
                    <div className="flex text-[#0F5A5A]">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className="text-sm">★</span>
                        ))}
                    </div>
                    <span className="text-xs font-semibold text-[#0F5A5A]">( 10k+ Reviews )</span>
                 </div>
              </div>
            </div>
            </Reveal>
          </div>

          {/* Right Image */}
          <div className="relative mt-8 h-[350px] w-full md:mt-0 md:hidden lg:block lg:absolute lg:-bottom-32 lg:-right-4 lg:h-[440px] lg:w-[440px] xl:-bottom-32 xl:right-6 xl:h-[500px] xl:w-[500px] 2xl:right-12 2xl:h-[600px] 2xl:w-[600px]">
              <Reveal variant="left" delay={200} className="relative z-10 h-full w-full">
                 <Image
                  src="/landing/girl.webp"
                  alt="Learning Sign Language"
                  width={800}
                  height={800}
                  className="w-full h-full object-contain object-bottom animate-float"
                  priority
                />
              </Reveal>
          </div>
        </div>

        {/* Floating Play Button Overlay */}
        <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 z-30 md:bottom-0 md:translate-y-1/2">
             <Reveal variant="zoom" delay={400}>
             <button
                onClick={scrollToVideo}
                className="relative flex h-24 w-24 md:h-52 md:w-52 items-center justify-center rounded-full bg-[#D2E6E4] p-4 md:p-6 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
             >
                 <div className="relative h-full w-full rounded-full">

                      <Image src="/landing/play.png" alt="Play Video" fill className="object-cover scale-110" />
                 </div>
             </button>
             </Reveal>
        </div>
      </section>

      {/* Feature Section Spacing due to overlay button */}
      <div className="h-24"></div>

      {/* Meet SIGNA Section */}
      <section id="video-section" className="bg-white min-h-screen flex flex-col justify-center py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <Reveal className="mb-12 flex flex-col items-center">
            <h2 className="flex items-center justify-center gap-3 font-heading text-4xl font-bold md:text-5xl">
              <span className="text-[#6632FF]">Meet</span>
              <span className="text-[#FFC619]">SIGNA</span>
              <Image src="/landing/message.png" alt="Message Icon" width={50} height={50} className="object-contain" />
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              An AI assistant built to make communication and learning truly accessible.
              <br className="hidden md:block" />
              Master real-life conversational scenarios.
            </p>
          </Reveal>

          <Reveal variant="zoom" delay={150} className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl p-2">
             {/* Video Container */}
             <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl shadow-teal-900/20">
                 <iframe
                    src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0`}
                    title="Signify demo video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                 />
             </div>
          </Reveal>
        </div>
      </section>

      {/* Keeping features and footer placeholders for now to maintain page structure */}
      {/* Key Features Section */}
      <section className="container mx-auto min-h-screen flex flex-col justify-center px-6 py-24 md:px-12">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-24">
          <Reveal variant="right" className="flex-1">
             <div className="relative mx-auto aspect-square w-full max-w-lg">
                <Image
                    src="/landing/discuss.png"
                    alt="Key Feature Discussion"
                    fill
                    className="object-contain"
                />
             </div>
          </Reveal>

          <div className="flex-1 space-y-10">
            <Reveal className="space-y-4">
              <span className="inline-block rounded-lg bg-[#D4E1FF] px-4 py-1.5 text-md text-[#0B7077]">
                Key Feature
              </span>
              <h2 className="font-heading text-4xl font-bold text-[#FF5722] md:text-5xl">
                3 Layer for Complete Learning
              </h2>
            </Reveal>

            <div className="space-y-8">
               <Reveal variant="left" delay={100}>
               <FeatureItem
                 icon={<Image src="/landing/communication-bridge.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Communication Bridge"
                 description="AI avatar that translates teacher's voice to sign language in real-time, and vice versa. Perfect for livestream classes and videos."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
               </Reveal>
               <Reveal variant="left" delay={220}>
               <FeatureItem
                 icon={<Image src="/landing/content-access.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Content Accessibility"
                 description="Learning materials restructured into visual-friendly formats with subtitles, structured text, and AI chatbot companion."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
               </Reveal>
               <Reveal variant="left" delay={340}>
                <FeatureItem
                 icon={<Image src="/landing/active-sign.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Active Sign Practice"
                 description="Practice presentations and sign language with computer vision that detects movements and provides real-time accuracy feedback."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
               </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto min-h-screen flex flex-col justify-center px-6 py-20 text-center relative overflow-hidden">
        <Reveal>
        <h2 className="font-heading text-4xl font-bold text-[#0F5A5A] md:text-5xl">
          How to Get Started <span className="text-[#0F5A5A] relative inline-block">with Signify
            <div className="absolute -bottom-6 md:-left-20 w-full h-4">
               <Image src="/landing/line.png" alt="Underline" fill className="object-contain" />
            </div>
          </span>
        </h2>
        <p className="mt-12 text-xl text-gray-500">Just 4 easy steps to begin your learning journey</p>
        </Reveal>

        <div className="relative mt-20">
             {/* Connecting Line removed, now inside individual cards */}

            <div className="relative grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <Reveal delay={0} className="h-full">
            <StepCard
                number={1}
                title="Create Account"
                desc="Sign up for free in seconds with your email."
                icon={<Image src="/landing/laptop.png" alt="Laptop" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#F1C9FF] shadow-lg shadow-purple-100"
            />
            </Reveal>
            <Reveal delay={150} className="h-full">
            <StepCard
                number={2}
                title="Quick Survey"
                desc="Answer a few questions to personalize your learning experience."
                icon={<Image src="/landing/survey.png" alt="Survey" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#A2D3FF] shadow-lg shadow-blue-100"
            />
            </Reveal>
            <Reveal delay={300} className="h-full">
            <StepCard
                number={3}
                title="Start Learning"
                desc="Access all features: translator, materials, and interactive practice."
                icon={<Image src="/landing/book.png" alt="Book" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#FFDB7E] shadow-lg shadow-yellow-100"
            />
            </Reveal>
            <Reveal delay={450} className="h-full">
            <StepCard
                number={4}
                title="Track Progress"
                desc="Monitor progress, collect streaks, and improve your skills."
                icon={<Image src="/landing/progress.png" alt="Progress" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#CAC9FF] shadow-lg shadow-indigo-100"
            />
            </Reveal>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto min-h-screen flex flex-col justify-center px-6 py-20">
        <Reveal variant="zoom">
        <div className="relative rounded-[3rem] bg-[#E85D75] px-8 pt-12 md:overflow-visible overflow-hidden md:px-16 md:pt-16">
            {/* Background Pattern Overlay with Clipping */}
            <div className="absolute inset-0 z-0 rounded-[3rem] overflow-hidden">
                <div className="absolute inset-0 opacity-30 invert"
                     style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: 'cover' }}>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row md:justify-between">
                <Reveal delay={200} className="max-w-xl space-y-8 pb-1/2 md:pb-16 text-left">
                    <h2 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    Ready to Start Your <br/>
                    Limitless Learning <br/>
                    Journey?
                    </h2>

                    <div className="flex items-start gap-4">
                        <div className="relative h-6 w-6 shrink-0 mt-1">
                            <Image src="/landing/star-circle.png" alt="Star" fill className="object-contain" />
                        </div>
                        <p className="text-white/90 text-sm md:text-base max-w-xl">
                            Join thousands of students who already experience the ease of learning with SignBridge. Sign up now and feel the difference.
                        </p>
                    </div>

                    <Link href="/register">
                        <Button className="h-14 rounded-xl bg-white px-8 text-lg text-[#0B7077] hover:bg-gray-50 shadow-lg">
                            GET STARTED NOW
                        </Button>
                    </Link>
                </Reveal>

                <div className="relative mt-8 h-[400px] w-full self-end md:absolute md:bottom-0 md:right-0 md:mt-0 md:h-[800px] md:w-[800px] md:-mr-24">
                     <Reveal variant="left" delay={350} className="absolute inset-0">
                     <Image
                        src="/landing/girl-laugh.png"
                        alt="Happy Student"
                        fill
                        className="object-contain object-bottom"
                     />
                     </Reveal>
                </div>
            </div>
        </div>
        </Reveal>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function FeatureItem({ icon, title, description, iconBg } : { icon: React.ReactNode, title: string, description: string, iconBg: string }) {
    return (
        <div className="flex gap-6">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                {icon}
            </div>
            <div className="space-y-2">
                <h3 className="font-heading text-xl font-bold text-gray-900">{title}</h3>
                <p className="max-w-md text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function StepCard({ number, title, desc, icon, bgColor } : { number: number, title: string, desc: string, icon: React.ReactNode, bgColor: string }) {
    return (
        <div className="flex h-full flex-col items-center text-center w-full">
            <div className="relative flex flex-1 flex-col items-center gap-4 w-full">
                 {/* Card Line - with animation */}
                 <div className="absolute top-10 left-0 hidden h-[6px] w-full -translate-y-1/2 rounded-full bg-[#E1F2E3] md:block overflow-hidden">
                    <div
                        className={`h-full w-full bg-gradient-to-r from-[#0B7077] to-[#0F5A5A] animate-fill-step-${number} rounded-full`}
                    ></div>
                 </div>

                <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F2E3] text-lg font-bold text-[#0F5A5A] shadow-sm">
                        {number}
                    </div>
                    {icon}
                </div>
                <h3 className="mt-2 font-bold text-[#0B7077] text-xl">{title}</h3>
                <p className="text-md text-grey">{desc}</p>
            </div>
             <Button className="mt-6 bg-white text-[#0B7077] shadow-md hover:bg-gray-50 px-16 py-6">
                more
            </Button>
        </div>
    )
}
