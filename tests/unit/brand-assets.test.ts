import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildSvgAssets, ogImagePng, ogImageSvg } from "../../scripts/lib/brand-assets.ts";
import { PALETTE } from "../support/palette";
import { hexValues } from "../support/tokens";

const PUBLIC = fileURLToPath(new URL("../../public/", import.meta.url));
const SVGS = [
  "logo.svg", "logo-dark.svg", "logo-compact.svg", "logo-compact-dark.svg",
  "symbol.svg", "symbol-dark.svg", "favicon.svg",
];
const RASTER = ["brand/favicon-32.png", "brand/apple-touch-icon.png", "favicon.ico"];

// brand-identity · Archivos de marca publicados (L1-4)
describe("archivos de marca", () => {
  it.each([...SVGS.map((name) => `brand/${name}`), ...RASTER])("existe %s", (path) => {
    expect(existsSync(PUBLIC + path)).toBe(true);
  });

  it.each(SVGS)("%s es autónomo y solo usa colores de la paleta", (name) => {
    const svg = readFileSync(`${PUBLIC}brand/${name}`, "utf8");
    expect(svg).not.toMatch(/<text|<tspan|font-family|<image|<use|href=|url\(|@import|<style|<script/);
    const colors = hexValues(svg);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(Object.values(PALETTE)).toContain(color);
    expect(svg).toMatch(/<title>Confia\.ing<\/title>/);
  });

  it.each([
    ["logo.svg", "--indigo-900", "--coral-700"],
    ["logo-dark.svg", "--cream-50", "--coral-300"],
    ["symbol.svg", "--indigo-900", "--coral-500"],
    ["symbol-dark.svg", "--cream-50", "--coral-500"],
  ] as const)("%s usa los colores de su tema", (name, main, accent) => {
    const colors = hexValues(readFileSync(`${PUBLIC}brand/${name}`, "utf8"));
    expect(colors).toContain(PALETTE[main]);
    expect(colors).toContain(PALETTE[accent]);
    expect(colors).not.toContain(PALETTE[main === "--cream-50" ? "--indigo-900" : "--cream-50"]);
  });

  it("los PNG tienen el tamaño declarado", () => {
    const size = (path: string) => {
      const png = readFileSync(PUBLIC + path);
      return [png.readUInt32BE(16), png.readUInt32BE(20)];
    };
    expect(size("brand/favicon-32.png")).toEqual([32, 32]);
    expect(size("brand/apple-touch-icon.png")).toEqual([180, 180]);
  });

  it.each(["symbol.png", "symbol-dark.png"])("%s mide 1024 px, con fondo transparente y el símbolo opaco", async (name) => {
    const { data, info } = await sharp(readFileSync(`${PUBLIC}brand/${name}`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([1024, 1024]);
    const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
    // Esquina y centro de la «c» quedan vacíos; el punto coral, a la derecha del centro, no.
    expect(alpha(0, 0)).toBe(0);
    expect(alpha(512, 512)).toBe(0);
    expect(alpha(Math.round((26.6 / 32) * 1024), 512)).toBe(255);
  });

  it("favicon.ico es un icono con una imagen de 32 px", () => {
    const ico = readFileSync(`${PUBLIC}favicon.ico`);
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 1]);
    expect([ico.readUInt8(6), ico.readUInt8(7)]).toEqual([32, 32]);
  });

  it("regenerar los SVG da un resultado idéntico al guardado", () => {
    const built = buildSvgAssets();
    expect(Object.keys(built).sort()).toEqual([...SVGS].sort());
    for (const name of SVGS) {
      expect(built[name], name).toBe(readFileSync(`${PUBLIC}brand/${name}`, "utf8"));
    }
  });
});

// search-and-agent-discovery · Vista previa al compartir (L8-6)
describe("imagen para redes", () => {
  const LOCALES = ["es", "en"] as const;

  it.each(LOCALES)("og-%s.png existe, mide 1200×630 y pesa menos de 300 kB", (locale) => {
    const png = readFileSync(`${PUBLIC}brand/og-${locale}.png`);
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(png.byteLength).toBeLessThan(300_000);
  });

  it.each(LOCALES)("el dibujo en %s mide 1200×630, es autónomo y solo usa colores de la paleta", (locale) => {
    const svg = ogImageSvg(locale);
    expect(svg).toMatch(/viewBox="0 0 1200 630"/);
    expect(svg).not.toMatch(/<text|<tspan|font-family|<image|<use|href=|url\(|@import|<style|<script/);
    const colors = hexValues(svg);
    expect(colors.length).toBeGreaterThan(2);
    for (const color of colors) expect(Object.values(PALETTE)).toContain(color);
    expect(colors).toContain(PALETTE["--cream-50"]);
    expect(colors).toContain(PALETTE["--indigo-900"]);
  });

  it("cada idioma tiene su propia frase", () => {
    expect(ogImageSvg("es")).not.toBe(ogImageSvg("en"));
  });

  // Se comparan los píxeles, no los bytes: cada sistema comprime y suaviza los bordes a su
  // manera, y el archivo de macOS no es idéntico al que genera Linux.
  it.each(LOCALES)("regenerar og-%s.png da la misma imagen que la guardada", async (locale) => {
    const pixels = (input: Buffer) => sharp(input).removeAlpha().raw().toBuffer();
    const [built, stored] = await Promise.all([pixels(await ogImagePng(locale)), pixels(readFileSync(`${PUBLIC}brand/og-${locale}.png`))]);
    expect(built.length).toBe(stored.length);
    let different = 0;
    for (let index = 0; index < built.length; index += 1) if (Math.abs(built[index]! - stored[index]!) > 24) different += 1;
    // Menos del 0,5 % de los valores puede diferir de forma apreciable (bordes de las letras).
    expect(different / built.length).toBeLessThan(0.005);
  });

  it("una imagen distinta no pasa por la guardada", async () => {
    const pixels = (input: Buffer) => sharp(input).removeAlpha().raw().toBuffer();
    const [es, en] = await Promise.all([pixels(await ogImagePng("es")), pixels(await ogImagePng("en"))]);
    let different = 0;
    for (let index = 0; index < es.length; index += 1) if (Math.abs(es[index]! - en[index]!) > 24) different += 1;
    expect(different / es.length).toBeGreaterThan(0.005);
  });

  it("la frase cabe dentro de la imagen con margen", () => {
    for (const locale of LOCALES) {
      // Los trazados de la frase van después del logo, en coordenadas del lienzo.
      const phrase = ogImageSvg(locale).split("</g>").at(-1)!;
      const xs = [...phrase.matchAll(/ d="([^"]+)"/g)].flatMap((match) =>
        [...match[1]!.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((pair) => [Number(pair[1]), Number(pair[2])]),
      );
      expect(xs.length).toBeGreaterThan(100);
      // Dentro del lienzo, con margen, y por debajo del logo.
      for (const [x, y] of xs) {
        expect(x).toBeGreaterThanOrEqual(60);
        expect(x).toBeLessThanOrEqual(1140);
        expect(y).toBeGreaterThanOrEqual(200);
        expect(y).toBeLessThanOrEqual(600);
      }
    }
  });
});

