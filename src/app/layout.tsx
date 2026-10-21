import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

// Font disimpan di repo (variable font, lisensi OFL, dari Fontsource) supaya build tidak
// bergantung pada Google Fonts: next/font/google di Turbopack gagal membaca format URL
// font Google yang baru ("next/font/google queries have exactly one entry").
const raleway = localFont({
  src: "./fonts/raleway-latin-wght-normal.woff2",
  variable: "--font-raleway",
  weight: "100 900",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans-latin-standard-normal.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
});

export const metadata: Metadata = {
  // Basis URL absolut untuk canonical dan gambar Open Graph (preview link di media sosial).
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["sign language", "learning", "accessibility", "education", "ASL", "BISINDO"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Token verifikasi Google Search Console (metode tag HTML); kosong = tag tidak dirender.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${dmSans.variable} font-body antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
