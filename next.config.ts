import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Playwright opens the dev server at 127.0.0.1. Next blocks that host
  // unless it is listed, so the client bundle never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
