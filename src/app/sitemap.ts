import type { MetadataRoute } from "next";
import { fetchNewsPage, type NewsSummary } from "@/lib/news";
import { absoluteUrl } from "@/lib/site";

// Batas limit /api/news per halaman.
const NEWS_PAGE_SIZE = 50;

async function fetchAllNews(): Promise<NewsSummary[]> {
  const items: NewsSummary[] = [];
  for (let page = 1; ; page++) {
    const data = await fetchNewsPage({ page, limit: NEWS_PAGE_SIZE });
    items.push(...data.items);
    if (page >= data.totalPages) return items;
  }
}

// Hanya halaman publik; halaman aplikasi butuh login dan diberi noindex.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // API mati tidak boleh membuat sitemap gagal: halaman statis tetap dikirim.
  const articles = await fetchAllNews().catch(() => []);
  const latestNews = articles[0]?.publishedAt;

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/news"), lastModified: latestNews, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/register"), changeFrequency: "yearly", priority: 0.5 },
  ];
}
