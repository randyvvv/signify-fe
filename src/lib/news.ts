// Data berita publik dari signify-api (/api/news). Dipakai di server component,
// jadi tanpa token; selalu segar (no-store) supaya berita baru langsung tampil.
import { cache } from "react";
import { BASE_URL } from "./api";

export interface NewsFact {
  label: string;
  value: string;
  href?: string;
}

export interface NewsSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** URL absolut, atau path aset frontend (mis. /news/<slug>/cover.jpg). */
  coverImageUrl: string | null;
  category: string;
  authorName: string;
  publishedAt: string;
  readingMinutes: number;
}

export interface NewsDetail extends NewsSummary {
  content: string;
  facts: NewsFact[];
  updatedAt: string;
}

export interface NewsPage {
  items: NewsSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`News API ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchNewsPage(
  opts: { page?: number; limit?: number; exclude?: string } = {},
): Promise<NewsPage> {
  const q = new URLSearchParams();
  if (opts.page) q.set("page", String(opts.page));
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.exclude) q.set("exclude", opts.exclude);
  const qs = q.toString();
  const data = await getJson<NewsPage>(`/api/news${qs ? `?${qs}` : ""}`);
  return data ?? { items: [], page: 1, limit: opts.limit ?? 9, total: 0, totalPages: 0 };
}

/** Satu artikel; null bila tidak ada. Di-cache per request (metadata + halaman). */
export const fetchNews = cache((slug: string) =>
  getJson<NewsDetail>(`/api/news/${encodeURIComponent(slug)}`),
);

export function formatNewsDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}
