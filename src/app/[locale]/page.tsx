import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "@/components/sections/home-content";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { publicEnv } from "@/lib/public-env";
import { pageMetadata } from "@/lib/server/seo/metadata";
import { homeStructuredData, serializeJsonLd } from "@/lib/server/seo/structured-data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = getDictionary(locale);
  return pageMetadata({ siteUrl: publicEnv.siteUrl, locale, routeId: "home", title: meta.homeTitle, description: meta.homeDescription, imageAlt: meta.ogAlt });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <>
      <HomeContent dictionary={dictionary} locale={locale} />
      {/* Datos estructurados: lo mismo que dice la página, para buscadores y asistentes. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeStructuredData(locale, dictionary, publicEnv.siteUrl)) }}
      />
    </>
  );
}
