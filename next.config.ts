import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone on the same Wi-Fi reaching the dev server by LAN address (SPEC §14.4 mobile checks).
  // Without this, Next blocks the client JS from a non-localhost origin and the page looks frozen.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
