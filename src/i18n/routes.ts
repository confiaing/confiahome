import { isLocale, type Locale } from "./locales.ts";

// Tabla de páginas del sitio y su dirección en cada idioma. Añadir una página es
// añadir una fila aquí: de ella salen los enlaces, los alternos y el cambio de idioma.
const SLUGS = {
  home: { es: "", en: "" },
  privacy: { es: "privacidad", en: "privacy" },
  terms: { es: "terminos", en: "terms" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteId = keyof typeof SLUGS;
export type LegalRouteId = Exclude<RouteId, "home">;

const LEGAL_ROUTES = ["privacy", "terms"] as const satisfies readonly LegalRouteId[];

export function pathFor(locale: Locale, routeId: RouteId): string {
  const slug = SLUGS[routeId][locale];
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

/** La página a la que corresponde una ruta del sitio, o null si no es ninguna. */
export function matchRoute(pathname: string): { locale: Locale; routeId: RouteId } | null {
  const segments = pathname.split("/");
  if (segments[0] !== "" || segments.length < 2) return null;
  if (segments.at(-1) === "" && segments.length > 2) segments.pop();
  const [, locale, slug = "", ...rest] = segments;
  if (!locale || !isLocale(locale) || rest.length > 0) return null;
  const routeId = (Object.keys(SLUGS) as RouteId[]).find((id) => SLUGS[id][locale] === slug);
  return routeId ? { locale, routeId } : null;
}

/** La misma página en otro idioma; si la ruta no es del sitio, la home de ese idioma. */
export function equivalentPath(pathname: string, target: Locale): string {
  const match = matchRoute(pathname);
  return pathFor(target, match ? match.routeId : "home");
}

export function legalRouteFor(locale: Locale, slug: string): LegalRouteId | null {
  return LEGAL_ROUTES.find((routeId) => SLUGS[routeId][locale] === slug) ?? null;
}

/** Combinaciones válidas de idioma y slug legal, para pre-generar las páginas. */
export const LEGAL_PARAMS: { locale: Locale; legal: string }[] = LEGAL_ROUTES.flatMap((routeId) =>
  (Object.keys(SLUGS[routeId]) as Locale[]).map((locale) => ({ locale, legal: SLUGS[routeId][locale] })),
);
