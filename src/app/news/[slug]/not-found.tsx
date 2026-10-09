import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { NewsHeader } from "@/components/news/NewsHeader";

export default function NewsNotFound() {
  return (
    <div className="min-h-screen bg-white font-body">
      <NewsHeader>
        <div className="pb-6" />
      </NewsHeader>
      <main className="container mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D2E6E4] text-[#0B7077]">
          <Newspaper className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="font-heading text-3xl font-bold text-[#0F5A5A]">Article not found</h1>
        <p className="text-gray-500">It may have been moved or removed.</p>
        <Link href="/news" className="mt-2 font-semibold text-[#FD661F] hover:underline">
          Browse all news
        </Link>
      </main>
      <Footer />
    </div>
  );
}
