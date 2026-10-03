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
  title: "NEXORA — Building Intelligence Platform",
  description:
    "Retrofit-first Building Intelligence platform for smart buildings. SENSE → UNDERSTAND → PREDICT → DECIDE → GATE → ACT → VERIFY → LEARN.",
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
      <body className="min-h-full flex flex-col bg-[#F4F1EE] dark:bg-[#141413] text-[#141413] dark:text-[#F4F1EE]">
        {children}
      </body>
    </html>
  );
}
