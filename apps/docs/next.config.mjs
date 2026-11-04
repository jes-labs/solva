import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/", destination: "/docs", permanent: true },
      {
        source: "/docs/end-to-end-flow",
        destination: "/docs/overview/how-solva-works",
        permanent: true,
      },
      { source: "/docs/architecture", destination: "/docs/build/architecture", permanent: true },
      {
        source: "/docs/passkey-wallet",
        destination: "/docs/build/passkey-wallet",
        permanent: true,
      },
      { source: "/docs/quickstart", destination: "/docs/build/quickstart", permanent: true },
      { source: "/docs/sdk-reference", destination: "/docs/build/sdk", permanent: true },
      { source: "/docs/sandbox", destination: "/docs/build/sandbox", permanent: true },
      {
        source: "/docs/contract-address",
        destination: "/docs/build/contract-reference",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/docs.md", destination: "/api/docs-md" },
        { source: "/docs/:slug*.md", destination: "/api/docs-md/:slug*" },
      ],
    };
  },
};

export default withMDX(config);
