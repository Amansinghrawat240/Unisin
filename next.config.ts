import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "slelguoygbfzlpylpxfs.supabase.co",
      },
      {
        protocol: "https",
        hostname: "fpmkujsugqanpxxxjdci.supabase.co",
      },
    ],
  },
};

export default nextConfig;
// UniSin restart: 1759860769836
// Orchids restart: 1760020265294
