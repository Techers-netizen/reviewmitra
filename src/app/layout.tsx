import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
    "review management",
  ],
  authors: [{ name: "ReviewMitra" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReviewMitra",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
};

import { SessionProvider } from "@/components/providers/session-provider";
import { PwaRegistrar } from "@/components/pwa-registrar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <PwaRegistrar />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
