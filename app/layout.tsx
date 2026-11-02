import type { Metadata, Viewport } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const literata = Literata({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "BibleWithYou",
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  description: "Someone in the Bible has been where you are. Share what you're going through and find a Bible story and verses that speak to it.",
};

export const viewport: Viewport = {
  themeColor: "#1F5F5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${literata.variable}`}>
      <body>{children}</body>
    </html>
  );
}
