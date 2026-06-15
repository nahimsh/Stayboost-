import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { DEFAULT_LOCALE, textDirection } from "@stayboost/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayboost.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StayBoost — AI-Powered Hospitality Growth Operating System",
    template: "%s · StayBoost",
  },
  description:
    "StayBoost puts an AI growth team to work on your property — dynamic pricing, guest messaging, reviews and operations — so you book more, earn more and do less.",
  openGraph: {
    type: "website",
    siteName: "StayBoost",
    url: siteUrl,
    title: "StayBoost — AI-Powered Hospitality Growth Operating System",
    description:
      "More bookings, more revenue, automated operations and happier guests — powered by AI.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={textDirection(DEFAULT_LOCALE)}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
