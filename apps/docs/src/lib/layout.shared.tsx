import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig, blogRoute } from "./shared";

// Shared chrome for the home, docs, and blog layouts: the nav title, the blog
// link, and the GitHub link.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    links: [{ text: "Blog", url: blogRoute }],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
