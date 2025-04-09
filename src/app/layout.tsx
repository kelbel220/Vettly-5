import { metadata, viewport } from './metadata';
import { playfair } from './fonts'
import "./globals.css";
import { Providers } from "./providers";

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.className} hide-scrollbar`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
