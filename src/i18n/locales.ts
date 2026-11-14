/** Idiomas admitidos, en orden de prioridad. El primero es el idioma por defecto. */
export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Nombre de cada idioma en ese mismo idioma: así se anuncia en el selector, sin traducir. */
export const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English" };
