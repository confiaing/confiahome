import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "./ai-crawlers";

/** Todo el sitio es público salvo la API, que no tiene nada que leer. */
export function robotsRules(siteUrl: string): MetadataRoute.Robots {
  const open = { allow: "/", disallow: "/api/" };
  return {
    rules: [
      { userAgent: "*", ...open },
      // Los asistentes de IA, por nombre: pueden leer el sitio igual que un buscador.
      { userAgent: AI_CRAWLERS, ...open },
    ],
    sitemap: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
