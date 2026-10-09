import type { Metadata } from "next";
import { MainLayout } from "@/components/layout";

// Semua halaman di grup ini butuh login, jadi jangan diindeks mesin pencari.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
