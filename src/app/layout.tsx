import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

// Typsnitten från designen: Inter för rubriker/brödtext, Roboto Mono för knappar och hero.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
