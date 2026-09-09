import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReviewMitra — AI Review Reply for Indian MSMEs",
  description:
    "Google, Facebook & Justdial reviews in one mobile dashboard. 1-click AI replies in Hindi, English or Hinglish. Built for Indian clinics, salons, gyms & restaurants at ₹499/month.",
  keywords: [
    "ReviewMitra",
    "review aggregator",
    "AI reply",
    "Google reviews",
    "Facebook reviews",
    "Justdial",
    "MSME",
    "Indian business",
    "SaaS",
  ],
  authors: [{ name: "ReviewMitra" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
