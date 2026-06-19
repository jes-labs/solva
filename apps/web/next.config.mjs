/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @solva/ui ships TypeScript source, so Next must transpile it.
  transpilePackages: ["@solva/ui", "@solva/sdk-ts", "@solva/shared-types"],
};

export default nextConfig;
