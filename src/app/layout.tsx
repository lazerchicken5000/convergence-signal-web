import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { StarField } from "@/components/star-field";
import "./globals.css";

// Previously this file imported Geist and Geist_Mono from next/font/google,
// which fetches the font files from Google Fonts at build time. That call
// is the single biggest source of build flakiness in this repo — when the
// network blips or Google rate-limits, the entire production build fails.
//
// We now define the same CSS variables (--font-geist-sans / --font-geist-mono)
// inline on the html element using system-font stacks. If a user has Geist
// installed locally it'll be picked up first; otherwise the OS fallback
// chain takes over (SF Pro on macOS, Segoe UI on Windows, Roboto on Linux).
// All component code that uses var(--font-geist-mono) etc. continues to
// work unchanged.
const FONT_VARS: CSSProperties & Record<string, string> = {
  "--font-geist-sans": '"Geist", "Geist Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  "--font-geist-mono": '"Geist Mono", "SF Mono", "Menlo", "Monaco", "Cascadia Mono", "Consolas", monospace',
};

export const metadata: Metadata = {
  title: "Verg — @lazerhawk5000",
  description: "Verg tracks convergence patterns across researchers and builders. Open methodology, prediction accuracy measured. Updated daily.",
  openGraph: {
    title: "Verg — Convergence Intelligence",
    description: "Verg tracks convergence patterns across researchers and builders. Open methodology, prediction accuracy measured. Updated daily.",
    url: "https://verg.dev",
    siteName: "Verg",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@lazerhawk5000",
    creator: "@lazerhawk5000",
  },
  alternates: {
    canonical: "https://verg.dev",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Verg",
  "url": "https://verg.dev",
  "logo": "https://verg.dev/favicon.ico",
  "sameAs": [
    "https://x.com/lazerhawk5000",
    "https://github.com/lazerchicken5000/convergence-signal-web",
    "https://github.com/lazerchicken5000/trenddistill"
  ],
  "description": "Convergence intelligence protocol — detects when independent thinkers arrive at the same conclusion"
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Verg",
  "url": "https://verg.dev",
  "description": "Convergence intelligence — sourcing signal, removing noise, for builders"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased scroll-smooth"
      style={FONT_VARS}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        <StarField />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
