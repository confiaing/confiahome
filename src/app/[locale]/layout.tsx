import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { WebAnalytics } from "@/components/analytics/web-analytics";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { SkipLink } from "@/components/sections/skip-link";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES, isLocale } from "@/i18n/locales";
import { publicEnv } from "@/lib/public-env";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

// Único layout raíz de la aplicación: es quien pone <html lang> y el marco común
// (enlace de salto, cabecera y pie). Cada página aporta su <main id="contenido">.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: "Confia.ing",
  // Favicon reducido: arco continuo y punto (docs/brand/README.md).
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <SkipLink label={dictionary.skipLink} />
        <SiteHeader locale={locale} dictionary={dictionary} />
        {children}
        <SiteFooter locale={locale} dictionary={dictionary} year={new Date().getFullYear()} />
        {/* Medición sin cookies (ADR-0005): eventos propios y, si hay token, visitas. */}
        <AnalyticsTracker />
        <WebAnalytics token={publicEnv.analyticsToken} />
      </body>
    </html>
  );
}
