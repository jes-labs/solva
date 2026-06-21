import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@solva/brand/fonts";
import "@solva/brand/tokens.css";
import "./globals.css";
import { siteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/lib/session/provider";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Solva console",
    template: "%s · Solva",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
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
    siteName: SITE_NAME,
    title: "Solva console",
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    images: [{ url: "/social/og-image-1200x630.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solva console",
    description: SITE_DESCRIPTION,
    images: ["/social/og-image-1200x630.png"],
  },
  // The console is gated; keep it out of the index. Public pages opt back in.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0C06",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen font-body antialiased">
        {/* Sets the theme before paint so there is no flash of the wrong colors. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <SessionProvider>
            <div id="site-root">{children}</div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
