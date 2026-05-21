import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StarField } from "@/components/cosmic/StarField";
import { CursorGlow } from "@/components/cosmic/CursorGlow";

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const sans = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "KOCMOC — Маркетплейс цифровой вселенной",
  description:
    "Премиальный маркетплейс игровых аккаунтов, валюты, предметов и подписок. Escrow-защита, KYC-верификация, мгновенная авто-выдача. Чёрно-белая космическая идентичность.",
  keywords: ["маркетплейс", "игровые аккаунты", "KOCMOC", "escrow", "цифровые товары"],
  openGraph: {
    title: "KOCMOC — Маркетплейс цифровой вселенной",
    description:
      "P2P сделки с эскроу-защитой. Аккаунты, валюта, подписки, услуги — со скоростью света.",
    type: "website",
    locale: "ru_RU"
  }
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <StarField />
        <CursorGlow />
        <div className="grain" />
        <Header />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
