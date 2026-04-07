import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StarField } from "@/components/star-field";
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
  title: "Verg — @lazerhawk5000",
  description: "Sourcing signal. Removing noise. For builders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        <StarField />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
