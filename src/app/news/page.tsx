import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Reveal } from "@/components/landing/Reveal";
import { FeaturedNewsCard, NewsCard } from "@/components/news/NewsCard";
import { NewsHeader } from "@/components/news/NewsHeader";
import { fetchNewsPage, type NewsPage } from "@/lib/news";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";

const NEWS_DESCRIPTION = "Milestones, events and stories from the Signify team.";

type Props = { searchParams: Promise<{ page?: string }> };

function parsePage(pageParam: string | undefined) {
  return Math.max(1, Number(pageParam) || 1);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const path = page > 1 ? `/news?page=${page}` : "/news";
  return {
    title: page > 1 ? `News - Page ${page}` : "News",
    description: NEWS_DESCRIPTION,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: "Signify News",
      description: NEWS_DESCRIPTION,
      url: path,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: "Signify News",
      description: NEWS_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export default async function NewsListPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);

  let data: NewsPage | null = null;
  try {
    data = await fetchNewsPage({ page });
  } catch {
    data = null;
  }

  const items = data?.items ?? [];
  const [featured, ...rest] = page === 1 ? items : [];
  const grid = page === 1 ? rest : items;

  return (
    <div className="min-h-screen bg-white font-body">
      <NewsHeader>
        <Reveal className="max-w-3xl pb-6 md:pb-10">
          <span className="inline-block rounded-lg bg-[#FFE75C] px-4 py-2 text-sm font-bold text-[#5A4A00]">
            Signify News
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] text-[#0F5A5A] md:text-6xl">
            News &amp;{" "}
            <span className="relative z-10 after:absolute after:bottom-1 after:left-0 after:-z-10 after:h-3 after:w-full after:bg-[#FFF59D] after:content-[''] md:after:bottom-2 md:after:h-4">
              Updates
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[#0F5A5A]/80">
            Milestones, events and stories from the Signify team.
          </p>
        </Reveal>
      </NewsHeader>

      <main className="container mx-auto px-6 py-16 md:px-12 md:py-20">
        {!data ? (
          <EmptyState
            title="News is unavailable right now"
            description="We couldn't load the articles. Please try again in a moment."
          />
        ) : items.length === 0 ? (
          <EmptyState title="No news yet" description="Check back soon for updates from the Signify team." />
        ) : (
          <>
            {featured && (
              <Reveal variant="zoom">
                <FeaturedNewsCard item={featured} />
              </Reveal>
            )}

            {grid.length > 0 && (
              <section className={featured ? "mt-16" : undefined}>
                {featured && (
                  <h2 className="mb-8 font-heading text-2xl font-bold text-[#0F5A5A] md:text-3xl">More news</h2>
                )}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {grid.map((item, i) => (
                    <Reveal key={item.id} delay={(i % 3) * 120} className="h-full">
                      <NewsCard item={item} />
                    </Reveal>
                  ))}
                </div>
              </section>
            )}

            {data.totalPages > 1 && (
              <nav className="mt-14 flex items-center justify-center gap-4" aria-label="News pages">
                {page > 1 && (
                  <Link
                    href={page === 2 ? "/news" : `/news?page=${page - 1}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#0B7077] shadow-sm ring-1 ring-[#0F5A5A]/15 hover:bg-[#F1F8F7]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Newer
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {data.page} of {data.totalPages}
                </span>
                {page < data.totalPages && (
                  <Link
                    href={`/news?page=${page + 1}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B7077] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#0b4545]"
                  >
                    Older
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D2E6E4] text-[#0B7077]">
        <Newspaper className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="font-heading text-2xl font-bold text-[#0F5A5A]">{title}</h2>
      <p className="text-gray-500">{description}</p>
      <Link href="/" className="mt-2 font-semibold text-[#FD661F] hover:underline">
        Back to home
      </Link>
    </div>
  );
}
