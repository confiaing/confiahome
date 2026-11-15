import type { MetadataRoute } from "next";
import { indexablePages, type LegalStatus } from "@/i18n/legal/status";
import { LOCALES } from "@/i18n/locales";
import { pageAlternates } from "@/i18n/metadata";

/**
 * Páginas que se anuncian a los buscadores, cada una con sus equivalentes en otros idiomas.
 * Las legales solo entran cuando dejan de ser borrador. Sin fechas: el contenido es
 * estático y una fecha de build no dice cuándo cambió una página.
 */
export function sitemapEntries(siteUrl: string, status?: LegalStatus): MetadataRoute.Sitemap {
  return indexablePages(status).flatMap((routeId) =>
    LOCALES.map((locale) => {
      const { canonical, languages } = pageAlternates({ siteUrl, locale, routeId });
      return { url: canonical, alternates: { languages } };
    }),
  );
}
