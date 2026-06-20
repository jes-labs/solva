import type { Metadata, Viewport } from "next";
import { fontVariables } from "@solva/brand/fonts";
import { siteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/motion";
import { SiteNav } from "@/components/nav/site-nav";
import { SiteFooter } from "@/components/footer/site-footer";
import "@solva/brand/tokens.css";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  // Base URL for resolving every relative metadata field below into an absolute
  // URL. Without this, Open Graph and Twitter image paths fall back to localhost.
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: "%s · Solva",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Brand favicons and the PWA manifest from the design kit (public/).
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon-180.png",
  },
  manifest: "/manifest.json",
  // Default social card from the kit; pages with their own image (blog posts)
  // override it.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    images: [{ url: "/social/og-image-1200x630.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/social/og-image-1200x630.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0C06",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        {/* Sets the theme before paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <SiteNav />
          <SmoothScroll>
            <div id="site-root">
              {children}
              <SiteFooter />
            </div>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
