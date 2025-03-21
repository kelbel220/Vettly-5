import type { Metadata } from "next";
import { Outfit } from 'next/font/google'
import { Playfair_Display } from 'next/font/google'
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  display: 'swap',
})

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Vettly",
  description: "Expert human matchmakers, enhanced by AI",
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
    <html lang="en" className="h-full">
      <body className={`${outfit.className} ${playfair.className} min-h-full`}>
        {children}
      </body>
    </html>
  );
}
