import { describe, expect, it } from "vitest";
import { LEGAL_PARAMS, equivalentPath, legalRouteFor, matchRoute, pathFor } from "@/i18n/routes";

// locale-routing · Página equivalente en el otro idioma (L2-2)
describe("rutas localizadas", () => {
  it("pathFor construye la ruta de cada página en cada idioma", () => {
    expect(pathFor("es", "home")).toBe("/es");
    expect(pathFor("en", "home")).toBe("/en");
    expect(pathFor("es", "privacy")).toBe("/es/privacidad");
    expect(pathFor("en", "privacy")).toBe("/en/privacy");
    expect(pathFor("es", "terms")).toBe("/es/terminos");
    expect(pathFor("en", "terms")).toBe("/en/terms");
  });

  it("matchRoute reconoce las rutas conocidas, con o sin barra final", () => {
    expect(matchRoute("/es")).toEqual({ locale: "es", routeId: "home" });
    expect(matchRoute("/en/")).toEqual({ locale: "en", routeId: "home" });
    expect(matchRoute("/en/privacy")).toEqual({ locale: "en", routeId: "privacy" });
    expect(matchRoute("/es/terminos/")).toEqual({ locale: "es", routeId: "terms" });
  });

  it("matchRoute rechaza lo desconocido y los cruces de idioma y slug", () => {
    for (const path of ["/", "/fr", "/es/privacy", "/en/terminos", "/es/a/b", "", "//otro.sitio", "https://otro.sitio/es"]) {
      expect(matchRoute(path), path).toBeNull();
    }
  });

  it.each([
    ["/es", "en", "/en"],
    ["/es/privacidad", "en", "/en/privacy"],
    ["/es/terminos", "en", "/en/terms"],
    ["/en", "es", "/es"],
    ["/en/privacy", "es", "/es/privacidad"],
    ["/en/terms", "es", "/es/terminos"],
    ["/es/privacidad", "es", "/es/privacidad"],
  ] as const)("el equivalente de %s en %s es %s", (path, target, expected) => {
    expect(equivalentPath(path, target)).toBe(expected);
  });

  it("una ruta desconocida o ajena lleva a la home del idioma elegido", () => {
    for (const path of ["/es/no-existe", "/", "", "//otro.sitio", "https://otro.sitio/"]) {
      expect(equivalentPath(path, "en"), path).toBe("/en");
    }
  });
});

// legal-pages · Slug e idioma no se cruzan (L2-7)
describe("páginas legales", () => {
  it("legalRouteFor acepta solo el slug de su idioma", () => {
    expect(legalRouteFor("es", "privacidad")).toBe("privacy");
    expect(legalRouteFor("en", "terms")).toBe("terms");
    expect(legalRouteFor("es", "privacy")).toBeNull();
    expect(legalRouteFor("en", "terminos")).toBeNull();
    expect(legalRouteFor("es", "")).toBeNull();
  });

  it("LEGAL_PARAMS son las cuatro combinaciones válidas", () => {
    expect(LEGAL_PARAMS).toEqual([
      { locale: "es", legal: "privacidad" },
      { locale: "en", legal: "privacy" },
      { locale: "es", legal: "terminos" },
      { locale: "en", legal: "terms" },
    ]);
  });
});
