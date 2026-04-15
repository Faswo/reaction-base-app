import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Reaction Game",
  description: "Reaction game on Base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="69dfabc56d8c62b41bf7a3c5" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}