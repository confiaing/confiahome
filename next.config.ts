import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 404 propia para rutas fuera de /es y /en (src/app/global-not-found.tsx).
  experimental: { globalNotFound: true },
};

export default nextConfig;

// Da acceso a los bindings de Cloudflare durante `next dev`.
void initOpenNextCloudflareForDev();
