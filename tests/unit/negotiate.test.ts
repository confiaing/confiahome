import { describe, expect, it } from "vitest";
import { negotiateLocale, parseAcceptLanguage, readCookieValues, readLocaleCookie } from "@/i18n/negotiate";

// locale-routing · Negociación del idioma del navegador (L2-1)
describe("parseAcceptLanguage", () => {
  it("ordena por peso y descarta q=0 y entradas mal formadas", () => {
    expect(parseAcceptLanguage("fr;q=0.9, en;q=0.8, es;q=0.7")).toEqual(["fr", "en", "es"]);
    expect(parseAcceptLanguage("en;q=0.2, es-CO, de;q=0")).toEqual(["es-co", "en"]);
    expect(parseAcceptLanguage("en;q=abc, ;;;, es")).toEqual(["es"]);
  });

  it("vacío, ausente o comodín no dan ningún idioma", () => {
    expect(parseAcceptLanguage("")).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage("*")).toEqual([]);
  });
});

describe("negotiateLocale", () => {
  it.each([
    ["en-US,en;q=0.9", "en"],
    ["fr-FR", "es"],
    ["fr;q=0.9, en;q=0.8, es;q=0.7", "en"],
    ["es-CO", "es"],
    ["en;q=0, es", "es"],
    ["*", "es"],
    ["no es una lista de idiomas", "es"],
    ["", "es"],
    [null, "es"],
  ] as const)("Accept-Language %s → %s", (acceptLanguage, expected) => {
    expect(negotiateLocale({ cookie: null, acceptLanguage })).toBe(expected);
  });

  it("la cookie válida manda sobre el navegador", () => {
    expect(negotiateLocale({ cookie: "en", acceptLanguage: "es" })).toBe("en");
  });

  it("una cookie con un idioma no admitido se ignora", () => {
    expect(negotiateLocale({ cookie: "fr", acceptLanguage: "en" })).toBe("en");
    expect(negotiateLocale({ cookie: "EN", acceptLanguage: "es" })).toBe("es");
  });
});

describe("cookie de preferencia", () => {
  it("lee una cookie por nombre entre varias, sin confundir nombres parecidos", () => {
    expect(readCookieValues("a=1; locale=en; b=2", "locale")).toEqual(["en"]);
    expect(readCookieValues("xlocale=es; locale=en", "locale")).toEqual(["en"]);
    expect(readCookieValues("a=1", "locale")).toEqual([]);
    expect(readCookieValues(null, "locale")).toEqual([]);
  });

  it("si viene repetida, vale el primer idioma admitido", () => {
    expect(readLocaleCookie("locale=fr; locale=en")).toBe("en");
    expect(readLocaleCookie("locale=fr")).toBeNull();
    expect(readLocaleCookie(null)).toBeNull();
  });
});

describe("pesos mal escritos o en otra forma", () => {
  it.each([
    ["en;Q=0.1, es", "es"],
    ["en;q =0.1, es;q=0.5", "es"],
    ["en;q=0x1, es;q=0.5", "es"],
    ["en;q=1e-1, es;q=0.5", "es"],
    ["en;q=1.5, es;q=0.1", "es"],
    ["*, en;q=0.1", "en"],
    ["en;level=1;q=0.2, es;q=0.9", "es"],
  ] as const)("%s → %s", (acceptLanguage, expected) => {
    expect(negotiateLocale({ cookie: null, acceptLanguage })).toBe(expected);
  });

  it("una cabecera enorme se procesa sin bloquear", () => {
    const start = performance.now();
    expect(negotiateLocale({ cookie: null, acceptLanguage: "a-".repeat(60_000) + ",en" })).toBe("en");
    expect(performance.now() - start).toBeLessThan(200);
  });
});
