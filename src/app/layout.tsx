import { metadata, viewport } from './metadata';
import { inter, playfair } from './fonts'
import "./globals.css";
import { Providers } from "./providers";

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="hide-scrollbar">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
