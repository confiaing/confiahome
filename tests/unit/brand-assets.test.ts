import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildSvgAssets } from "../../scripts/lib/brand-assets.ts";
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
