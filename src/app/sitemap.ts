import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/public-env";
import { sitemapEntries } from "@/lib/server/seo/sitemap";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(publicEnv.siteUrl);
}
