import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { formatNewsDate, type NewsSummary } from "@/lib/news";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  Achievement: "bg-[#FFE75C] text-[#5A4A00]",
  Event: "bg-[#FFD5DC] text-[#8A2338]",
};

export function CategoryPill({ category, className }: { category: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-widest",
        CATEGORY_STYLE[category] ?? "bg-white text-[#0B7077]",
        className,
      )}
    >
      {category}
    </span>
  );
}

export function NewsMeta({ item, className }: { item: NewsSummary; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500", className)}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4" aria-hidden />
        <time dateTime={item.publishedAt}>{formatNewsDate(item.publishedAt)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4" aria-hidden />
        {item.readingMinutes} min read
      </span>
    </div>
  );
}

/** Cover berita; tanpa gambar -> panel hijau bercorak. Path lokal dioptimasi next/image. */
export function NewsCoverImage({
  item,
  sizes,
  priority,
  className,
}: {
  item: Pick<NewsSummary, "coverImageUrl" | "title">;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!item.coverImageUrl) {
    return (
      <div className="absolute inset-0 bg-[#2DA5A2]">
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
      </div>
    );
  }
  return (
    <Image
      src={item.coverImageUrl}
      alt={item.title}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={/^https?:\/\//.test(item.coverImageUrl)}
      className={cn("object-cover", className)}
    />
  );
}

/** Kartu besar untuk berita terbaru di /news. */
export function FeaturedNewsCard({ item }: { item: NewsSummary }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group grid overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_-36px_rgba(11,112,119,0.55)] ring-1 ring-[#0F5A5A]/10 transition-shadow hover:shadow-[0_28px_70px_-34px_rgba(11,112,119,0.65)] lg:grid-cols-[1.2fr_1fr]"
    >
      <div className="relative aspect-[1200/630] overflow-hidden lg:aspect-auto lg:min-h-[340px]">
        <NewsCoverImage
          item={item}
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryPill category={item.category} />
          <span className="text-sm font-semibold text-[#0B7077]">Latest</span>
        </div>
        <h2 className="font-heading text-2xl font-bold leading-snug text-[#0F5A5A] transition-colors group-hover:text-[#0B7077] md:text-3xl">
          {item.title}
        </h2>
        <p className="leading-relaxed text-gray-600">{item.excerpt}</p>
        <NewsMeta item={item} />
        <span className="mt-2 inline-flex items-center gap-2 font-semibold text-[#FD661F]">
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function NewsCard({ item }: { item: NewsSummary }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.08)] ring-1 ring-[#0F5A5A]/10 transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[1200/630] overflow-hidden">
        <NewsCoverImage
          item={item}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <CategoryPill category={item.category} className="self-start" />
        <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug text-[#0F5A5A] group-hover:text-[#0B7077]">
          {item.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{item.excerpt}</p>
        <NewsMeta item={item} className="mt-auto pt-2 text-xs" />
      </div>
    </Link>
  );
}
