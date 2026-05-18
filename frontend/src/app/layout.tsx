import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthBootstrap } from "@/components/common/AuthBootstrap";

export const metadata: Metadata = {
  title: "NexusMarket — Игровая экономика, собранная заново",
  description:
    "Маркетплейс, аренда, автодоставка и боты для FunPay, Starvell, Playerok. Эскроу, мгновенные ключи, 552 функции.",
  openGraph: {
    title: "NexusMarket",
    description: "Игровая экономика, собранная заново",
    type: "website"
  },
  themeColor: "#000000"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="grain" />
        <AuthBootstrap />
        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
