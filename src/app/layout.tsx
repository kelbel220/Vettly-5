import type { Metadata } from "next";
import { playfair } from './fonts'
import "./globals.css";

export const metadata: Metadata = {
  title: "Vettly",
  description: "Matchmaking, Revolutionised",
  keywords: "dating, matchmaking, AI, relationships",
  authors: [{ name: "AI Matchmaking Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={playfair.className}>{children}</body>
    </html>
  );
}
