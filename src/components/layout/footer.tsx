import Link from "next/link";
import { Button } from "../ui/button";

export function Footer() {
  return (
    <div className="w-full bg-white">
       {/* Curved Top */}
       <div className="w-full overflow-hidden leading-[0]">
          <svg className="block w-full h-12 md:h-24 fill-[#D2E6E4]" viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0,100 C480,20 960,20 1440,100 V100 H0 Z" />
          </svg>
       </div>
       
      <footer className="w-full bg-[#D2E6E4] px-6 pb-20 pt-12">
        <div className="container mx-auto">
          <div className="flex flex-col justify-between gap-12 lg:flex-row">
            {/* Logo and Links */}
            <div className="flex flex-col gap-8 md:flex-row md:gap-20">
              <div className="space-y-6">
                <Link href="/" className="font-heading text-3xl font-bold text-[#0B7077]">
                  Signify
                </Link>
                
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#0B7077] md:text-base mt-6">
                  <div className="flex flex-col gap-3">
                    <h4 className="mb-2 font-bold text-[#0A033C]">Product</h4>
                    <Link href="#" className="hover:text-[#0b4545] hover:underline">Live Translator</Link>
                    <Link href="#" className="hover:text-[#0b4545] hover:underline">Learning Materials</Link>
                    <Link href="#" className="hover:text-[#0b4545] hover:underline">Sign Practice</Link>
                    <Link href="#" className="hover:text-[#0b4545] hover:underline">Quizzes</Link>
                    <Link href="/dashboard" className="hover:text-[#0b4545] hover:underline">Dashboard</Link>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <h4 className="mb-2 font-bold text-[#0A033C]">Links</h4>
                    <Link href="#" className="hover:text-[#0b4545] hover:underline">Demo</Link>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Newsletter */}
            <div className="flex max-w-lg flex-col gap-4">
              <p className="text-md text-[#0A033C]">
                Be the first to know when new learning experiences launch on Signify.
              </p>
              <div className="flex items-center rounded-xl bg-white p-1 pl-4 py-2 pr-2 shadow-sm">
                <input
                  type="email"
                  placeholder="Sign up for email updates."
                  className="w-full bg-transparent text-base text-gray-600 outline-none placeholder:text-gray-400"
                />
                <Button className="rounded-xl bg-[#0B7077] px-12 py-6 text-base font-semibold text-white hover:bg-[#0b4545]">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
