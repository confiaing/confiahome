import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PALETTE } from "../support/palette";
import { THEMES, TOKENS_PATH, hexValues, loadTokens, resolve } from "../support/tokens";

const tokens = loadTokens();
const paletteValues = Object.values(PALETTE);
const colorRoles = Object.keys(tokens.base).filter((name) => name.startsWith("--color-"));
const sceneRoles = Object.keys(tokens.base).filter((name) => name.startsWith("--scene-"));

// design-tokens · Paleta cerrada de quince colores (L1-1)
describe("paleta", () => {
  it("declara exactamente los quince primitivos de la paleta elegida", () => {
    const normalized = Object.fromEntries(
      Object.entries(tokens.primitives).map(([name, value]) => [name, value.toUpperCase()]),
    );
    expect(normalized).toEqual(PALETTE);
  });

  it("no contiene ningún otro valor de color", () => {
    expect(hexValues(tokens.source).sort()).toEqual([...paletteValues].sort());
    expect(tokens.source).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i);
  });

  it("globals.css no declara colores: solo usa roles", () => {
    const globals = readFileSync(TOKENS_PATH.replace("tokens.css", "globals.css"), "utf8");
    expect(hexValues(globals)).toEqual([]);
    expect(globals).not.toMatch(/\b(rgba?|hsla?|oklch|oklab)\(/i);
  });

  // Que bg-red-500 no genere estilos se comprobó además compilando (tasks.md, Evidencia).
  it("anula la paleta por defecto de Tailwind", () => {
    expect(tokens.themeBlock).toMatch(/--color-\*\s*:\s*initial\s*;/);
  });
});

// design-tokens · Roles semánticos como única interfaz de color
describe("roles", () => {
  it("existen los roles de color y de escena", () => {
    expect(colorRoles.length).toBeGreaterThanOrEqual(19);
    expect(sceneRoles.length).toBeGreaterThanOrEqual(11);
  });

  it.each(THEMES)("en el tema %s cada rol termina en un primitivo", (theme) => {
    for (const role of [...colorRoles, ...sceneRoles]) {
      expect(paletteValues, `${role} en ${theme}`).toContain(resolve(tokens, theme, role));
    }
  });
});

// design-tokens · Temas por banda
describe("temas", () => {
  it.each([
    ["light", "--cream-50"],
    ["dark", "--indigo-900"],
    ["fresh", "--sage-300"],
    ["coral", "--coral-300"],
    ["warm", "--butter-300"],
    ["calm", "--indigo-100"],
  ] as const)("el tema %s tiene el fondo acordado", (theme, primitive) => {
    expect(resolve(tokens, theme, "--color-background")).toBe(PALETTE[primitive]);
  });

  it.each(THEMES)("el tema %s define todos los roles de color y de escena", (theme) => {
    const missing = [...colorRoles, ...sceneRoles].filter((role) => !(role in tokens.themes[theme]));
    expect(missing).toEqual([]);
  });

  it("un tema claro anidado en el oscuro recupera sus propios roles", () => {
    for (const role of [...colorRoles, ...sceneRoles]) {
      expect(tokens.themes.light[role], role).toBe(tokens.base[role]);
    }
  });

  it("los temas viven en la capa base, para que una utilidad pueda más que ellos", () => {
    const layer = /@layer base\s*\{([\s\S]*)\}\s*$/.exec(tokens.source)?.[1] ?? "";
    for (const theme of THEMES) expect(layer).toContain(`.theme-${theme} {`);
  });
});

// typography · Tres familias con respaldo declarado
describe("variables tipográficas", () => {
  it.each([
    ["--font-display", "var(--font-fraunces)"],
    ["--font-display-italic", "var(--font-fraunces-italic)"],
    ["--font-body", "var(--font-figtree)"],
    ["--font-mono", "var(--font-dm-mono)"],
  ])("%s usa su familia y declara respaldo", (name, family) => {
    const stack = tokens.base[name]?.split(",").map((part) => part.trim()) ?? [];
    expect(stack[0]).toBe(family);
    expect(stack.length).toBeGreaterThanOrEqual(2);
  });
});
