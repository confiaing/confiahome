import { describe, expect, it } from "vitest";
import { pageAlternates } from "@/i18n/metadata";

// locale-routing · Metadatos por idioma
describe("pageAlternates", () => {
  it("home: canónica propia y alternos con x-default en español", () => {
    expect(pageAlternates({ siteUrl: "https://confia.ing", locale: "en", routeId: "home" })).toEqual({
      canonical: "https://confia.ing/en",
      languages: { es: "https://confia.ing/es", en: "https://confia.ing/en", "x-default": "https://confia.ing/es" },
    });
  });

  it("página legal: cada idioma apunta a su slug", () => {
    expect(pageAlternates({ siteUrl: "https://confia.ing/", locale: "es", routeId: "privacy" })).toEqual({
      canonical: "https://confia.ing/es/privacidad",
      languages: {
        es: "https://confia.ing/es/privacidad",
        en: "https://confia.ing/en/privacy",
        "x-default": "https://confia.ing/es/privacidad",
      },
    });
  });
});
