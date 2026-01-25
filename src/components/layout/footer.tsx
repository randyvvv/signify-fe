import Link from "next/link";
import { Button } from "../ui/button";

export function Footer() {
  return (
    <footer className="w-full bg-[#D6EFEF] px-6 py-20 pb-8 rounded-t-[3rem] md:rounded-t-[5rem]">
      <div className="container mx-auto">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          {/* Logo and Links */}
          <div className="flex flex-col gap-8 md:flex-row md:gap-20">
            <div className="space-y-6">
              <Link href="/" className="font-heading text-3xl font-bold text-[#0F5A5A]">
                Signify
              </Link>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#0F5A5A] md:text-base">
                <div className="flex flex-col gap-3">
                  <h4 className="mb-2 font-bold text-[#1E1E1E]">Product</h4>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Live Translator</Link>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Learning Materials</Link>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Sign Practice</Link>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Quizzes</Link>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Dashboard</Link>
                </div>
                
                <div className="flex flex-col gap-3">
                  <h4 className="mb-2 font-bold text-[#1E1E1E]">Links</h4>
                  <Link href="#" className="hover:text-[#0b4545] hover:underline">Demo</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex max-w-md flex-col gap-4">
            <p className="text-sm text-[#1E1E1E]/80">
              Be the first to know when new learning experiences launch on Signify.
            </p>
            <div className="flex items-center rounded-xl bg-white p-1 pl-4 shadow-sm">
              <input
                type="email"
                placeholder="Sign up for email updates."
                className="w-full bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
              />
              <Button className="rounded-lg bg-[#0F5A5A] px-8 py-6 text-base font-semibold text-white hover:bg-[#0b4545]">
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
