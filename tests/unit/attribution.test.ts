import { describe, expect, it } from "vitest";
import { readAttribution } from "@/lib/attribution";

// analytics-instrumentation · Contexto de cada evento
describe("readAttribution", () => {
  const at = (search: string, referrer = "", host = "confia.ing") => readAttribution({ search, host }, referrer);

  it("lee los tres parámetros de campaña", () => {
    expect(at("?utm_source=linkedin&utm_medium=social&utm_campaign=q4&otro=1")).toEqual({
      utmSource: "linkedin",
      utmMedium: "social",
      utmCampaign: "q4",
      referrerHost: undefined,
    });
  });

  it("sin parámetros, todo ausente", () => {
    expect(at("")).toEqual({ utmSource: undefined, utmMedium: undefined, utmCampaign: undefined, referrerHost: undefined });
  });

  it("un parámetro vacío cuenta como ausente y uno largo se recorta", () => {
    expect(at("?utm_source=").utmSource).toBeUndefined();
    expect(at(`?utm_source=${"x".repeat(300)}`).utmSource).toHaveLength(120);
  });

  it("de la procedencia externa solo queda el host", () => {
    expect(at("", "https://www.google.com/search?q=ana+ruiz").referrerHost).toBe("www.google.com");
  });

  it("de una procedencia con puerto queda el nombre, sin el puerto", () => {
    expect(at("", "http://example.com:8080/x").referrerHost).toBe("example.com");
  });

  it("el propio sitio en otro puerto sigue siendo el propio sitio", () => {
    expect(at("", "http://localhost:3100/es", "localhost:3100").referrerHost).toBeUndefined();
  });

  it("la procedencia propia no cuenta", () => {
    expect(at("", "https://confia.ing/es/privacidad").referrerHost).toBeUndefined();
  });

  it("una procedencia ilegible se ignora", () => {
    expect(at("", "no es una url").referrerHost).toBeUndefined();
  });
});
