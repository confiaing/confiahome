import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/public-env";
import { robotsRules } from "@/lib/server/seo/robots";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(publicEnv.siteUrl);
}
