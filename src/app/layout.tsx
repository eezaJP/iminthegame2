import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { Background } from "@/components/Background";
import { BackToTop } from "@/components/BackToTop";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SplashEgg } from "@/components/SplashEgg";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans-var",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ЧМ-2026 · Лига прогнозов",
  description:
    "Дашборд дружеской лиги прогнозов на Чемпионат мира по футболу 2026: рейтинг, групповой этап, плей-офф и интерактивная карта городов-хозяев.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a140e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Тема до первой отрисовки (сохранённая или системная) — без вспышки */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('wc-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Background />
        <AutoRefresh />
        <TopNav />
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-4 sm:px-6">
          {children}
        </main>
        <BackToTop />
        <SplashEgg />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
