import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";
import { describe, expect, it } from "vitest";

const FONTS_DIR = fileURLToPath(new URL("../../src/styles/fonts/", import.meta.url));
const files = readdirSync(FONTS_DIR);
// Texto del escenario L1-3 más el resto de signos propios del español.
const SAMPLE = "Capacitación · Diagnóstico · ¿Dónde? ¡ñ ü Ñ Á É Í Ó Ú!";

// typography · Licencias documentadas
describe("licencias", () => {
  it.each(["Fraunces", "Figtree", "DM-Mono"])("hay una licencia SIL OFL para %s", (family) => {
    expect(files).toContain(`LICENSE-${family}.txt`);
    expect(readFileSync(`${FONTS_DIR}LICENSE-${family}.txt`, "utf8")).toContain("SIL Open Font License, Version 1.1");
  });
});

// typography · Cobertura de español e inglés (L1-3)
describe("cobertura de caracteres", () => {
  const fonts = files.filter((file) => file.endsWith(".woff2"));

  it("están las cinco fuentes del proyecto", () => {
    expect(fonts).toHaveLength(5);
  });

  it.each(fonts)("%s contiene los acentos y signos del español", (file) => {
    const font = fontkit.openSync(FONTS_DIR + file) as fontkit.Font;
    const missing = [...SAMPLE].filter((char) => !font.hasGlyphForCodePoint(char.codePointAt(0)!));
    expect(missing).toEqual([]);
  });
});
