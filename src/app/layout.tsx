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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
