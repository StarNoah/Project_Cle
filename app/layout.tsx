import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "돌스타그램 - 클라이밍 릴스 랭킹",
  description: "인기 클라이밍/볼더링 인스타그램 릴스 랭킹 사이트",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "돌스타그램",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--accent)]">
                돌스타그램
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                클라이밍 랭킹
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">{children}</main>
        <footer className="border-t border-[var(--border)] mt-12 py-6 text-center text-sm text-[var(--muted-foreground)]">
          돌스타그램 &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
