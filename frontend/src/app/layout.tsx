import * as React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { CurtainLoader } from "@/components/landing/CurtainLoader";
import "@/styles/globals.css";
import "@/styles/noise.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusCare",
  description:
    "Data-driven, geospatial, and AI-assisted platform for proactive campus infrastructure management",
  keywords: ["campus", "infrastructure", "AI", "geospatial", "management"],
  // themeColor moved to viewport export per Next.js guidance
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "CampusCare",
    description:
      "Data-driven, geospatial, and AI-assisted platform for proactive campus infrastructure management",
    url: "https://your-domain.example", // replace with production URL
    siteName: "CampusCare",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "CampusCare Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusCare",
    description:
      "Data-driven, geospatial, and AI-assisted platform for proactive campus infrastructure management",
    images: ["/logo.png"],
    creator: "@your_twitter_handle",
  },
};

// Base URL used to resolve absolute URLs for social previews; replace with production URL
export const metadataBase = new URL("https://your-domain.example");

// Move visual theme color descriptors into viewport export to satisfy Next.js
export const viewport = {
  // standard viewport settings
  width: "device-width",
  initialScale: 1,
  // themeColor controls meta[name=theme-color]
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <CurtainLoader
          logo={<img src="/logo.png" alt="CampusCare" className="w-7 h-7" />}
        />
        <div className="noise-overlay" aria-hidden="true" />
        <AuthProvider>
          <FloatingNav />
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
