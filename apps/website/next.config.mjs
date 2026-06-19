/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @solva/brand ships TypeScript source (the next/font setup), so Next must
  // transpile it.
  transpilePackages: ["@solva/brand"],
};

export default nextConfig;
