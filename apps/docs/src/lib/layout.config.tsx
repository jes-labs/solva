import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { DocsLockup } from "@/components/brand/docs-lockup";
import { gitConfig, websiteUrl } from "./shared";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <DocsLockup />,
    url: "/docs",
  },
  githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  links: [{ type: "main", text: "joinsolva.xyz", url: websiteUrl, external: true }],
};
