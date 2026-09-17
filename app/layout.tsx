import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

// Every page here reads the signed-in user's session, so none of them are
// ever safe to statically prerender. This also matters for build-time
// resilience: without it, Next's dynamic-API auto-detection can decide a
// route "looks static" (e.g. when a code path skips cookies() because
// Supabase isn't configured yet) and try to prerender it at build time,
// which then hard-fails the build instead of just deferring to runtime.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "아이러브뷰티 | ILB",
  description: "속눈썹 연장 살롱 원장을 위한 상담/매출/운영 실전 콘텐츠",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  );
}
