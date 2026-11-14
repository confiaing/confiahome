import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

// Da acceso a los bindings de Cloudflare durante `next dev`.
void initOpenNextCloudflareForDev();
