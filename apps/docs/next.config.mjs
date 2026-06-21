import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Serve per-page markdown at /docs/<slug>.md. A beforeFiles rewrite catches it
  // before the docs page catch-all so the page never shadows the markdown route.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/docs/:slug*.md", destination: "/api/docs-md/:slug*" }],
    };
  },
};

export default withMDX(config);
