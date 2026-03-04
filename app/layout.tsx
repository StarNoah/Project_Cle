import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ClimbingGram - 클라이밍 인스타그램 랭킹",
  description: "인기 클라이밍/볼더링 인스타그램 게시물 랭킹 사이트",
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
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--accent)]">
                ClimbingGram
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                볼더링 랭킹
              </span>
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t border-[var(--border)] mt-12 py-6 text-center text-sm text-[var(--muted-foreground)]">
          ClimbingGram &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
