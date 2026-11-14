import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./locales.ts";

/** Cookie de preferencia de idioma. Funcional: no identifica al visitante. */
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Etiquetas de idioma de `Accept-Language`, en minúsculas y de mayor a menor peso. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  const entries: { tag: string; weight: number; position: number }[] = [];
  header.split(",").forEach((part, position) => {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = (rawTag ?? "").trim().toLowerCase();
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(tag)) return;
    let weight = 1;
    for (const param of params) {
      const [name, value = ""] = param.split("=").map((piece) => piece.trim());
      if (name?.toLowerCase() !== "q") continue;
      // RFC 9110: 0 a 1 con tres decimales como máximo. Un peso mal escrito descarta la entrada.
      if (!/^(0(\.\d{0,3})?|1(\.0{0,3})?)$/.test(value)) return;
      weight = Number(value);
    }
    if (weight === 0) return;
    entries.push({ tag, weight, position });
  });
  return entries.sort((a, b) => b.weight - a.weight || a.position - b.position).map((entry) => entry.tag);
}

/** Cookie válida → idioma del navegador → español. */
export function negotiateLocale(input: { cookie: string | null | undefined; acceptLanguage: string | null | undefined }): Locale {
  if (input.cookie && isLocale(input.cookie)) return input.cookie;
  for (const tag of parseAcceptLanguage(input.acceptLanguage)) {
    const base = tag.split("-")[0]!;
    const match = LOCALES.find((locale) => locale === base);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

/** Valores de una cookie en la cabecera `Cookie`, en orden; puede venir repetida. */
export function readCookieValues(header: string | null | undefined, name: string): string[] {
  if (!header) return [];
  const values: string[] = [];
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) values.push(part.slice(index + 1).trim());
  }
  return values;
}

/** El idioma guardado en la cookie de preferencia: el primer valor admitido, o null. */
export function readLocaleCookie(header: string | null | undefined): Locale | null {
  return readCookieValues(header, LOCALE_COOKIE).find(isLocale) ?? null;
}
