import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  // Keep a running development server independent from production builds.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};
export default config;
