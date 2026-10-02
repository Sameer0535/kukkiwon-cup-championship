import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRANDING } from "@/config/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRANDING.championshipName} - Kukkiwon North India x Kyorix`,
  description:
    "Official championship registration, credentialing, and accreditation platform presented by Kukkiwon India North Branch and Kyorix Sports Technology.",
  keywords: [
    "Kukkiwon",
    "Kukkiwon Cup",
    "Taekwondo",
    "Kyorix",
    "India North Branch",
    "Tournament Registration",
    "Accreditation",
  ],
  authors: [{ name: "Kukkiwon North India x Kyorix Sports Technology" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090D16] text-slate-100 selection:bg-sky-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
