import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Halaman aplikasi yang butuh login tetap boleh di-crawl supaya Google membaca tag noindex-nya.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
