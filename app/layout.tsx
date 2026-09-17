import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

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
