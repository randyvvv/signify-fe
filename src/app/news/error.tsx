"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center font-body">
      <h1 className="font-heading text-3xl font-bold text-[#0F5A5A]">We couldn&apos;t load this page</h1>
      <p className="max-w-md text-gray-500">Please check your connection and try again.</p>
      <div className="mt-2 flex items-center gap-4">
        <Button onClick={reset} className="bg-[#0B7077] px-6 py-5 text-white hover:bg-[#0b4545]">
          Try again
        </Button>
        <Link href="/" className="font-semibold text-[#FD661F] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
