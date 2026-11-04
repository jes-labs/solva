import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { appName, siteUrl } from "@/lib/shared";
import { body, display, mono } from "./fonts";
import "./global.css";

const description =
  "Solva documentation: how anchors and custodial apps on Stellar publish proof that their reserves cover what they owe, and how anyone can check it.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Solva Docs",
    template: "%s · Solva Docs",
  },
  description,
  applicationName: appName,
  openGraph: {
    type: "website",
    siteName: "Solva Docs",
    title: "Solva Docs",
    description,
    url: "/docs",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solva Docs",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c06" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ defaultTheme: "dark" }}>{children}</RootProvider>
      </body>
    </html>
  );
}
