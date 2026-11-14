import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";

describe("idiomas admitidos", () => {
  it("son español e inglés, en ese orden", () => {
    expect(LOCALES).toEqual(["es", "en"]);
  });

  it("el idioma por defecto es español", () => {
    expect(DEFAULT_LOCALE).toBe("es");
  });

  it("reconoce los idiomas admitidos y rechaza los demás", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("ES")).toBe(false);
  });
});
