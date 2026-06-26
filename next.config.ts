import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile Three.js, React Three Fiber, and MindAR packages
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "mind-ar"],

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},

  // Webpack fallbacks for browser-only globals used by MindAR
  webpack: (config, { isServer }) => {
    if (isServer) {
      // MindAR relies on browser APIs — exclude from SSR bundle
      config.externals = [...(config.externals ?? []), 'mind-ar'];
    }
    return config;
  },
};

export default nextConfig;
