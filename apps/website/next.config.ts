import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [400, 800, 1600],
    imageSizes: [200],
  },
  async redirects() {
    return [
      { source: "/solutions", destination: "/anchors", permanent: true },
      { source: "/pricing", destination: "/contact", permanent: true },
      { source: "/request-a-demo", destination: "/contact", permanent: true },
      { source: "/status", destination: "/coverage-record", permanent: true },
      { source: "/sandbox", destination: "/demo", permanent: true },
      { source: "/developers", destination: "/partners", permanent: true },
      { source: "/solvency-oracle", destination: "/partners", permanent: true },
      { source: "/security", destination: "/trust", permanent: true },
      { source: "/research", destination: "/blog", permanent: true },
      {
        source: "/blog/merkle-sum-tree-in-noir",
        destination: "/blog/why-no-balance-can-be-left-out",
        permanent: true,
      },
      {
        source: "/blog/telling-a-regulator-one-number",
        destination: "/blog/telling-a-supervisor-one-number",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      "*.mdx": {
        condition: { query: "?raw" },
        type: "text",
      },
    },
  },
};

export default nextConfig;
