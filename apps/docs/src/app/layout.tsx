import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { fontVariables } from "@solva/brand/fonts";
import { appName, siteUrl } from "@/lib/shared";
import "./global.css";

const description =
  "Documentation for Solva: prove reserves meet liabilities on Stellar with the SDK, sandbox, and proof-registry contract.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Solva docs",
    template: "%s · Solva docs",
  },
  description,
  applicationName: appName,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon-180.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Solva docs",
    title: "Solva docs",
    description,
    url: "/",
    locale: "en_US",
    images: [{ url: "/social/og-image-1200x630.png", width: 1200, height: 630, alt: "Solva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solva docs",
    description,
    images: ["/social/og-image-1200x630.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0C06",
};

// Root layout shared by the (marketing) and (docs) groups. Fumadocs's
// RootProvider wraps next-themes (one toggle drives both surfaces) and the
// search dialog provider.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
