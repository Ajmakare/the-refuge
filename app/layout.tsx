import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
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
  title: {
    default: "The Refuge - Minecraft Server | Semi-Vanilla PvE Survival",
    template: "%s | The Refuge Minecraft Server"
  },
  description: "Join The Refuge, a 6-year-strong semi-vanilla PvE survival Minecraft server with deep lore, democratic community, and rich gameplay. View player leaderboards and server statistics.",
  keywords: ["minecraft", "server", "survival", "pve", "semi-vanilla", "community", "leaderboards", "statistics"],
  authors: [{ name: "The Refuge Team" }],
  creator: "The Refuge",
  publisher: "The Refuge",
  metadataBase: new URL('https://the-refuge.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://the-refuge.vercel.app',
    siteName: 'The Refuge Minecraft Server',
    title: 'The Refuge - Minecraft Server | Semi-Vanilla PvE Survival',
    description: 'Join The Refuge, a 6-year-strong semi-vanilla PvE survival Minecraft server with deep lore, democratic community, and rich gameplay.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Refuge Minecraft Server',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Refuge - Minecraft Server',
    description: 'Join The Refuge, a 6-year-strong semi-vanilla PvE survival Minecraft server with deep lore and democratic community.',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8850137353291563"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
