import type { Dictionary } from "@/i18n/dictionaries";
import { LOCALES, type Locale } from "@/i18n/locales";
import { CONTACT_EMAIL } from "@/lib/contact";
import { stripEmphasis } from "@/lib/emphasis";
import { SITE_NAME } from "./metadata";

/** Nombre de un servicio tal como se lee en la página, sin marcas de énfasis ni punto final. */
export const serviceName = (title: string) => stripEmphasis(title).replace(/\.$/, "");

/**
 * Datos estructurados de la home (schema.org): quién es la organización, qué sitio es y
 * qué servicios describe la página. Los servicios llevan los textos que se leen en ella;
 * la descripción de la organización es la de los metadatos de la home.
 * No lleva valoraciones, precios, dirección, teléfono ni perfiles: nada de eso está aprobado.
 */
export function homeStructuredData(locale: Locale, dictionary: Dictionary, siteUrl: string) {
  const site = siteUrl.replace(/\/+$/, "");
  const organization = { "@id": `${site}/#organization` };
  const { offer } = dictionary.home;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        ...organization,
        name: SITE_NAME,
        url: site,
        logo: `${site}/brand/logo.svg`,
        email: CONTACT_EMAIL,
        description: dictionary.meta.homeDescription,
        contactPoint: { "@type": "ContactPoint", contactType: "sales", email: CONTACT_EMAIL, availableLanguage: [...LOCALES] },
      },
      {
        "@type": "WebSite",
        "@id": `${site}/${locale}#website`,
        url: `${site}/${locale}`,
        name: SITE_NAME,
        inLanguage: locale,
        publisher: organization,
      },
      ...[offer.main, ...offer.rest].map((item) => ({
        "@type": "Service",
        name: serviceName(item.title),
        description: item.text,
        provider: organization,
      })),
    ],
  };
}

/**
 * JSON listo para ir dentro de <script type="application/ld+json">. Los signos que podrían
 * cerrar la etiqueta o abrir otra se escriben como escapes de JSON: el contenido es el
 * mismo y el HTML no se puede alterar.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
