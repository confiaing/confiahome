import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPlaceholder } from "@/components/sections/legal-placeholder";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { pageAlternates } from "@/i18n/metadata";
import { LEGAL_PARAMS, legalRouteFor, type LegalRouteId } from "@/i18n/routes";
import { publicEnv } from "@/lib/public-env";

// Privacidad y términos. Solo existen las cuatro combinaciones de idioma y slug de la
// tabla de rutas: /es/privacy o /en/terminos responden 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PARAMS;
}

type Props = { params: Promise<{ locale: string; legal: string }> };

const TITLE: Record<LegalRouteId, keyof Dictionary["legal"]> = {
  privacy: "privacyTitle",
  terms: "termsTitle",
};

async function resolve(params: Props["params"]) {
  const { locale, legal } = await params;
  if (!isLocale(locale)) return null;
  const routeId = legalRouteFor(locale, legal);
  if (!routeId) return null;
  const labels = getDictionary(locale).legal;
  return { locale, routeId, labels, title: labels[TITLE[routeId]] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolve(params);
  if (!page) return {};
  return {
    title: `${page.title} · Confia.ing`,
    alternates: pageAlternates({ siteUrl: publicEnv.siteUrl, locale: page.locale, routeId: page.routeId }),
    // Borrador pendiente de revisión legal: no se indexa hasta el lote L8.
    robots: { index: false, follow: true },
  };
}

export default async function LegalPage({ params }: Props) {
  const page = await resolve(params);
  if (!page) notFound();
  return <LegalPlaceholder title={page.title} labels={page.labels} />;
}
