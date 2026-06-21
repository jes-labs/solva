import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/shared/logo";
import { gitConfig, websiteUrl, appUrl } from "./shared";

// Shared chrome for the docs and marketing layouts: the brand wordmark, the nav
// links, and the GitHub link. The Website and Launch app links point at the
// sibling origins; Fumadocs renders absolute URLs as external (new tab).
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo />,
    url: "/",
  },
  githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  links: [
    { type: "main", text: "Home", url: "/" },
    { type: "main", text: "Docs", url: "/docs" },
    { type: "main", text: "Website", url: websiteUrl, external: true },
    { type: "main", text: "Launch app", url: appUrl, external: true },
  ],
};
