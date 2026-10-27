/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @solva/brand ships TypeScript source (the next/font setup), so Next must
  // transpile it.
  transpilePackages: ["@solva/brand"],
  // Cloudflare's free plan has no image optimization binding. Images are local
  // and pre-sized.
  images: { unoptimized: true },
};

export default nextConfig;
