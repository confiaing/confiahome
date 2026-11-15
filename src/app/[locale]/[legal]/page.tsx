import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/sections/legal-document";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { getLegalDocument } from "@/i18n/legal";
import { LEGAL_ENTITY, LEGAL_STATUS, isLegalDraft } from "@/i18n/legal/status";
import { isLocale } from "@/i18n/locales";
import { LEGAL_PARAMS, legalRouteFor, type LegalRouteId } from "@/i18n/routes";
import { publicEnv } from "@/lib/public-env";
import { pageMetadata } from "@/lib/server/seo/metadata";

// Privacidad y términos. Solo existen las cuatro combinaciones de idioma y slug de la
// tabla de rutas: /es/privacy o /en/terminos responden 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PARAMS;
}

type Props = { params: Promise<{ locale: string; legal: string }> };

const DESCRIPTION: Record<LegalRouteId, keyof Dictionary["meta"]> = {
  privacy: "privacyDescription",
  terms: "termsDescription",
};

async function resolve(params: Props["params"]) {
  const { locale, legal } = await params;
  if (!isLocale(locale)) return null;
  const routeId = legalRouteFor(locale, legal);
  if (!routeId) return null;
  const dictionary = getDictionary(locale);
  return { locale, routeId, dictionary, document: getLegalDocument(locale, routeId) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolve(params);
  if (!page) return {};
  return pageMetadata({
    siteUrl: publicEnv.siteUrl,
    locale: page.locale,
    routeId: page.routeId,
    title: `${page.document.title} · Confia.ing`,
    description: page.dictionary.meta[DESCRIPTION[page.routeId]],
    imageAlt: page.dictionary.meta.ogAlt,
    // Mientras sea un borrador pendiente de revisión legal, no se indexa.
    legalStatus: LEGAL_STATUS,
  });
}

export default async function LegalPage({ params }: Props) {
  const page = await resolve(params);
  if (!page) notFound();
  return <LegalDocumentPage document={page.document} labels={page.dictionary.legal} draft={isLegalDraft()} entity={LEGAL_ENTITY} />;
}
