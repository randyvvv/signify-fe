// Identitas situs untuk SEO: metadata, sitemap, robots dan structured data (JSON-LD).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ai-signify.com").replace(/\/+$/, "");
export const SITE_NAME = "Signify";
export const SITE_TITLE = "Signify - AI-Powered Sign Language Learning Platform";
export const SITE_DESCRIPTION =
  "Learn sign language with Signify: an AI learning coach, a 3D signing avatar, real-time camera practice, quizzes and accessible learning materials.";
export const SITE_LOGO = "/logo/logo-signify.png";
/** Gambar dari src/app/opengraph-image.tsx, untuk halaman yang menimpa openGraph. */
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_TITLE };

/** URL absolut dari path situs; URL yang sudah absolut dikembalikan apa adanya. */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
