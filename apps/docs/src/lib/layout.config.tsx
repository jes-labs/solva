import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/shared/logo";
import { gitConfig } from "./shared";

// Shared chrome for the docs and marketing layouts: the brand wordmark, the
// nav links, and the GitHub link.
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo />,
    url: "/",
  },
  githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  links: [
    { type: "main", text: "Home", url: "/" },
    { type: "main", text: "Docs", url: "/docs" },
  ],
};
