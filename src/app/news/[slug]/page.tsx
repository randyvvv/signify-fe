import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, PenLine } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Reveal } from "@/components/landing/Reveal";
import { CategoryPill, NewsCard, NewsCoverImage, NewsMeta } from "@/components/news/NewsCard";
import { NewsHeader } from "@/components/news/NewsHeader";
import { ShareLinks } from "@/components/news/ShareLinks";
import { MarkdownContent } from "@/components/shared/Markdown";
import { fetchNews, fetchNewsPage } from "@/lib/news";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchNews(slug).catch(() => null);
  if (!article) return { title: "News - Signify" };

  const images = article.coverImageUrl
    ? [{ url: article.coverImageUrl, width: 1200, height: 630, alt: article.title }]
    : undefined;
  return {
    title: `${article.title} - Signify`,
    description: article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.authorName],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: images?.map((i) => i.url),
    },
  };
}

// Tipografi artikel: menimpa gaya default MarkdownContent (dipakai juga di chat).
const ARTICLE_CLASS = [
  "text-[17px] text-gray-700",
  "[&_p]:leading-8",
  "[&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:text-[#0F5A5A] md:[&_h2]:text-[1.7rem]",
  "[&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:text-[#0F5A5A]",
  "[&_li]:leading-7 [&_li]:marker:text-[#2DA5A2] [&_strong]:text-[#0F5A5A]",
  "[&_a]:text-[#0B7077]",
  "[&_figure]:my-8",
].join(" ");

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchNews(slug);
  if (!article) notFound();

  const more = await fetchNewsPage({ limit: 3, exclude: article.slug }).catch(() => null);

  return (
    <div className="min-h-screen bg-white font-body">
      <NewsHeader className={article.coverImageUrl ? "pb-28 md:pb-40" : undefined}>
        <Reveal className="mx-auto max-w-4xl text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B7077] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All news
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <CategoryPill category={article.category} />
            <NewsMeta item={article} className="text-[#0F5A5A]/80" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-[#0F5A5A] md:text-5xl">
            {article.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#0F5A5A]/80">
            {article.excerpt}
          </p>
        </Reveal>
      </NewsHeader>

      {article.coverImageUrl && (
        <div className="relative z-10 container mx-auto -mt-20 px-6 md:-mt-32 md:px-12">
          <Reveal variant="zoom" className="mx-auto max-w-5xl">
            <div className="relative aspect-[1200/630] overflow-hidden rounded-[2rem] bg-[#D2E6E4] shadow-2xl shadow-teal-900/20">
              <NewsCoverImage item={article} priority sizes="(min-width: 1024px) 1024px, 100vw" />
            </div>
          </Reveal>
        </div>
      )}

      <main className="container mx-auto px-6 py-14 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className={ARTICLE_CLASS}>
            <MarkdownContent content={article.content} />
          </article>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
            {article.facts.length > 0 && (
              <div className="rounded-[1.75rem] bg-[#D2E6E4]/60 p-6 ring-1 ring-[#0F5A5A]/10">
                <h2 className="font-heading text-lg font-bold text-[#0F5A5A]">At a glance</h2>
                <dl className="mt-4 flex flex-col gap-4">
                  {article.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="text-xs font-bold uppercase tracking-widest text-[#0B7077]">{fact.label}</dt>
                      <dd className="mt-1 font-medium leading-snug text-[#0F5A5A]">
                        {fact.href ? (
                          <a
                            href={fact.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                          >
                            {fact.value}
                            <ArrowUpRight className="h-4 w-4" aria-hidden />
                          </a>
                        ) : (
                          fact.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="rounded-[1.75rem] p-6 ring-1 ring-[#0F5A5A]/10">
              <h2 className="font-heading text-lg font-bold text-[#0F5A5A]">Share this story</h2>
              <div className="mt-4">
                <ShareLinks title={article.title} />
              </div>
            </div>

            <p className="inline-flex items-center gap-2 px-2 text-sm text-gray-500">
              <PenLine className="h-4 w-4" aria-hidden />
              Written by {article.authorName}
            </p>
          </aside>
        </div>
      </main>

      {more && more.items.length > 0 && (
        <section className="bg-[#F1F8F7] py-16 md:py-20">
          <div className="container mx-auto px-6 md:px-12">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-[#0F5A5A] md:text-3xl">More news</h2>
              <Link href="/news" className="font-semibold text-[#FD661F] hover:underline">
                See all
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {more.items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
