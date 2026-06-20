import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@solva/brand/fonts";
import "@solva/brand/tokens.css";
import "./globals.css";
import { themeScript } from "@/lib/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: {
    default: "Solva",
    template: "%s · Solva",
  },
  description: "Proof of Solvency on Stellar. Reserves greater than or equal to liabilities.",
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
          <div id="site-root">
            <SiteNav />
            <main className="mx-auto max-w-site px-7 py-12">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
