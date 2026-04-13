import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "unpkg.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "**.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "modelviewer.dev", pathname: "/**" },
    ],
  },
  // Optimize for Vercel Edge Runtime
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  // Reduce build time and output size
  productionBrowserSourceMaps: false,
  compress: true,
  // Ensure API routes work correctly
  experimental: {
    // Add experimental features for Next.js 16+ if needed
  },
};

export default nextConfig;
