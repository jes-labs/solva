import type { Metadata, Viewport } from "next";
import { fontVariables } from "@solva/brand/fonts";
import { themeScript } from "@/lib/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/motion";
import "@solva/brand/tokens.css";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Solva",
    template: "%s · Solva",
  },
  description:
    "Zero-knowledge proof of reserves infrastructure. Continuously prove reserves meet liabilities, verified on Stellar, without exposing customer data.",
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
          <SmoothScroll>
            <div id="site-root">{children}</div>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
