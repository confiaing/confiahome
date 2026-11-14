import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePlaceholder } from "@/components/sections/home-placeholder";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { pageAlternates } from "@/i18n/metadata";
import { publicEnv } from "@/lib/public-env";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: getDictionary(locale).meta.homeTitle,
    alternates: pageAlternates({ siteUrl: publicEnv.siteUrl, locale, routeId: "home" }),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePlaceholder copy={getDictionary(locale).placeholder} />;
}
