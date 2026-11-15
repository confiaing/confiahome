import type { Metadata } from "next";
import { legalRobots, type LegalStatus } from "@/i18n/legal/status";
import { LOCALES, type Locale } from "@/i18n/locales";
import { pageAlternates } from "@/i18n/metadata";
import type { RouteId } from "@/i18n/routes";

export const SITE_NAME = "Confia.ing";
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Idioma y región para Open Graph. La región es la del mercado principal de cada idioma. */
const OG_LOCALE: Record<Locale, string> = { es: "es_CO", en: "en_US" };

/** Imagen para compartir en redes, una por idioma (scripts/build-brand-assets.ts). */
export const ogImagePath = (locale: Locale) => `/brand/og-${locale}.png`;

type PageMetadataInput = {
  siteUrl: string;
  locale: Locale;
  routeId: RouteId;
  title: string;
  description: string;
  imageAlt: string;
  /** Solo en las páginas legales: un borrador no se indexa. */
  legalStatus?: LegalStatus;
};

/** Metadatos completos de una página: buscadores, idiomas alternos y vista previa en redes. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const { siteUrl, locale, routeId, title, description, imageAlt } = input;
  const alternates = pageAlternates({ siteUrl, locale, routeId });
  const image = siteUrl.replace(/\/+$/, "") + ogImagePath(locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: alternates.canonical,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALE[other]),
      images: [{ url: image, ...OG_SIZE, alt: imageAlt, type: "image/png" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: imageAlt }] },
    ...(input.legalStatus ? { robots: legalRobots(input.legalStatus) } : {}),
  };
}
