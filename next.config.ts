import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/profile", destination: "/dashboard/profile", permanent: false },
      { source: "/settings", destination: "/dashboard/settings", permanent: false },
    ];
  },
};

export default nextConfig;
