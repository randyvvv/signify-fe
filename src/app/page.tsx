"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const scrollToVideo = () => {
    const section = document.getElementById("video-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen font-body bg-white">
        
      {/* Hero Section */}
      <section className="relative bg-[#D2E6E4] pb-32 pt-6 rounded-b-[60px] md:rounded-b-[100px] overflow-visible">
         {/* Background Pattern */}
         <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply" 
              style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: 'cover' }}>
         </div>

        {/* Navbar */}
        <nav className="relative z-20 container mx-auto flex items-center justify-between px-6 py-4 md:px-12 mb-12">
            <Link href="/" className="font-heading text-3xl font-bold text-[#0F5A5A]">
              Signify
            </Link>
            <div className="hidden gap-12 md:flex">
              <Link href="#" className="font-medium text-[#FF7D50] hover:text-[#ff6b3d]">
                Home
              </Link>
              <Link href="#" className="font-medium text-gray-600 hover:text-[#0F5A5A]">
                Quiz
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button className="hidden bg-white text-[#0F5A5A] hover:bg-gray-50 md:inline-flex shadow-sm px-8 py-6">
                LOG IN
              </Button>
              <Button className="bg-[#0B7077] text-white hover:bg-[#0b4545] shadow-lg shadow-[#0F5A5A]/20 px-8 py-6">
                SIGN UP
              </Button>
            </div>
        </nav>

        <div className="relative z-10 container mx-auto flex flex-col items-center gap-12 px-6 md:flex-row md:justify-between md:px-12">
          {/* Left Content */}
          <div className="flex max-w-3xl flex-col items-start gap-8 text-left">
            <span className="inline-block rounded-lg bg-[#FFE75C] px-4 py-2 text-sm font-bold text-[#5A4A00]">
              #1 Inclusive Education Platform
            </span>
            
            <h1 className="font-heading text-5xl font-bold leading-[1.1] text-[#0F5A5A] md:text-6xl lg:text-7xl">
              Where <span className="relative z-10 after:absolute after:bottom-2 after:left-0 after:-z-10 after:h-4 after:w-full after:bg-[#FFF59D] after:content-['']">Vision</span> <br />
              <span className="whitespace-nowrap">
                Meets <span className="relative z-10 after:absolute after:bottom-2 after:left-0 after:-z-10 after:h-4 after:w-full after:bg-[#FFF59D] after:content-['']">Understanding</span>
              </span>
            </h1>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link href="/dashboard">
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
          </div>
          
          {/* Right Image */}
          <div className="relative mt-8 md:mt-0 md:-mb-32">
              <div className="relative z-10 h-[400px] w-full md:h-[600px] md:w-[600px]">
                  <Image 
                    src="/landing/girl.png" 
                    alt="Learning Sign Language" 
                    fill 
                    className="object-contain object-bottom"
                    priority
                  />
              </div>
          </div>
        </div>

        {/* Floating Play Button Overlay */}
        <div className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 z-30 ">
             <button 
                onClick={scrollToVideo}
                className="relative flex h-52 w-52 items-center justify-center rounded-full bg-[#D2E6E4] p-6 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
             >
                 <div className="relative h-full w-full rounded-full">
                      <Image src="/landing/play.png" alt="Play Video" fill className="object-cover scale-110" /> 
                 </div>
             </button>
        </div>
      </section>

      {/* Feature Section Spacing due to overlay button */}
      <div className="h-24"></div>

      {/* Meet SIGNA Section */}
      <section id="video-section" className="bg-white py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-12 flex flex-col items-center">
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
          </div>

          <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl p-2">
             {/* Video Container */}
             <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white">
                 <Image 
                    src="/landing/video.png" 
                    alt="Signa Video Demo" 
                    fill 
                    className="object-cover"
                 />
                 
                 {/* Play Button Overlay */}
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110">
                     <div className="relative h-24 w-24 md:h-32 md:w-32">
                         <Image src="/landing/play.png" alt="Play" fill className="object-contain drop-shadow-2xl" />
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </section>
      
      {/* Keeping features and footer placeholders for now to maintain page structure */}
      {/* Key Features Section */}
      <section className="container mx-auto px-6 py-24 md:px-12">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-24">
          <div className="flex-1">
             <div className="relative mx-auto aspect-square w-full max-w-lg">
                <Image 
                    src="/landing/discuss.png" 
                    alt="Key Feature Discussion" 
                    fill 
                    className="object-contain"
                />
             </div>
          </div>

          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <span className="inline-block rounded-lg bg-[#D4E1FF] px-4 py-1.5 text-md text-[#0B7077]">
                Key Feature
              </span>
              <h2 className="font-heading text-4xl font-bold text-[#FF5722] md:text-5xl">
                3 Layer for Complete Learning
              </h2>
            </div>
            
            <div className="space-y-8">
               <FeatureItem 
                 icon={<Image src="/landing/communication-bridge.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Communication Bridge"
                 description="AI avatar that translates teacher's voice to sign language in real-time, and vice versa. Perfect for livestream classes and videos."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
               <FeatureItem 
                 icon={<Image src="/landing/content-access.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Content Accessibility"
                 description="Learning materials restructured into visual-friendly formats with subtitles, structured text, and AI chatbot companion."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
                <FeatureItem 
                 icon={<Image src="/landing/active-sign.png" alt="Icon" width={24} height={24} className="object-contain" />}
                 title="Active Sign Practice"
                 description="Practice presentations and sign language with computer vision that detects movements and provides real-time accuracy feedback."
                 iconBg="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)]"
               />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-20 text-center relative overflow-hidden">
        <h2 className="font-heading text-4xl font-bold text-[#0F5A5A] md:text-5xl">
          How to Get Started <span className="text-[#0F5A5A] relative inline-block">with Signify
            <div className="absolute -bottom-6 -left-20 w-full h-4">
               <Image src="/landing/line.png" alt="Underline" fill className="object-contain" />
            </div>
          </span>
        </h2>
        <p className="mt-12 text-xl text-gray-500">Just 4 easy steps to begin your learning journey</p>

        <div className="relative mt-20">
             {/* Connecting Line */}
            <div className="absolute top-10 left-0 hidden w-full -translate-y-1/2 md:block">
                 <div className="mx-auto h-2 w-3/4 rounded-full bg-[#E0F2F1]"></div>
            </div>

            <div className="relative grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <StepCard 
                number={1} 
                title="Create Account" 
                desc="Sign up for free in seconds with your email."
                icon={<Image src="/landing/laptop.png" alt="Laptop" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#F1C9FF] shadow-lg shadow-purple-100"
            />
            <StepCard 
                number={2} 
                title="Quick Survey" 
                desc="Answer a few questions to personalize your learning experience."
                icon={<Image src="/landing/survey.png" alt="Survey" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#A2D3FF] shadow-lg shadow-blue-100"
            />
            <StepCard 
                number={3} 
                title="Start Learning" 
                desc="Access all features: translator, materials, and interactive practice."
                icon={<Image src="/landing/book.png" alt="Book" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#FFDB7E] shadow-lg shadow-yellow-100"
            />
            <StepCard 
                number={4} 
                title="Track Progress" 
                desc="Monitor progress, collect streaks, and improve your skills."
                icon={<Image src="/landing/progress.png" alt="Progress" width={40} height={40} className="object-contain" />}
                bgColor="bg-[#CAC9FF] shadow-lg shadow-indigo-100"
            />
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-[3rem] bg-[#E85D75] px-8 pt-12 md:px-16 md:pt-16">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 z-0 opacity-30 invert" 
                 style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: 'cover' }}>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row md:justify-between">
                <div className="max-w-xl space-y-8 pb-1/2 md:pb-16 text-left">
                    <h2 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    Ready to Start Your <br/>
                    Limitless Learning <br/>
                    Journey?
                    </h2>
                    
                    <div className="flex items-start gap-4">
                        <div className="relative h-6 w-6 shrink-0 mt-1">
                            <Image src="/landing/star-circle.png" alt="Star" fill className="object-contain" />
                        </div>
                        <p className="text-white/90 text-sm md:text-base max-w-sm">
                            Join thousands of students who already experience the ease of learning with SignBridge. Sign up now and feel the difference.
                        </p>
                    </div>

                    <Button className="h-14 rounded-xl bg-white px-8 text-lg font-bold text-[#0F5A5A] hover:bg-gray-50 shadow-lg">
                        GET STARTED NOW
                    </Button>
                </div>

                <div className="relative mt-auto h-[400px] w-full max-w-md self-end md:-mb-16 md:h-[500px] md:w-[500px]">
                     <Image 
                        src="/landing/girl-laugh.png" 
                        alt="Happy Student" 
                        fill 
                        className="object-contain object-bottom"
                     />
                </div>
            </div>
        </div>
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
        <div className="flex flex-col items-center gap-4 text-center">
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}>
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-xs font-bold text-green-700">
                    {number}
                </div>
                {icon}
            </div>
            <h3 className="mt-2 font-bold text-[#0B7077] text-xl">{title}</h3>
            <p className="text-md text-grey">{desc}</p>
             <Button className="bg-white text-[#0B7077]">
                More
            </Button>
        </div>
    )
}
