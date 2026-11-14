import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales.ts";
import { pathFor, type RouteId } from "./routes.ts";

export type PageAlternates = { canonical: string; languages: Record<Locale | "x-default", string> };

/** URL canónica de una página y sus equivalentes en cada idioma; x-default es la española. */
export function pageAlternates(input: { siteUrl: string; locale: Locale; routeId: RouteId }): PageAlternates {
  const base = input.siteUrl.replace(/\/+$/, "");
  const url = (locale: Locale) => base + pathFor(locale, input.routeId);
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, url(locale)])) as Record<Locale, string>;
  return { canonical: url(input.locale), languages: { ...languages, "x-default": url(DEFAULT_LOCALE) } };
}
