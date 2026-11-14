import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Analizador mínimo de src/styles/tokens.css para las pruebas: no interpreta CSS
// general, solo bloques planos de declaraciones de variables.
export const TOKENS_PATH = fileURLToPath(new URL("../../src/styles/tokens.css", import.meta.url));

export const THEMES = ["light", "dark", "fresh", "coral", "warm", "calm"] as const;
export type Theme = (typeof THEMES)[number];

export type Declarations = Record<string, string>;

export type Tokens = {
  source: string;
  /** Variables de :root que no son roles: los primitivos de color. */
  primitives: Declarations;
  /** Roles y medidas del tema base (:root y el bloque de tema de Tailwind). */
  base: Declarations;
  /** Lo que declara cada clase de tema. */
  themes: Record<Theme, Declarations>;
  /** Contenido del bloque @theme tal cual, para comprobar la anulación de la paleta. */
  themeBlock: string;
};

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const PRIMITIVE_NAME = /^--(indigo|coral|butter|sage|cream|sand|white|red|green)(-\d+)?$/;

function declarations(body: string): Declarations {
  const out: Declarations = {};
  for (const match of body.matchAll(/(--[a-z0-9*-]+)\s*:\s*([^;]+);/g)) {
    out[match[1]!] = match[2]!.trim();
  }
  return out;
}

export function parseTokens(source: string): Tokens {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = new Map<string, string>();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1]!.trim();
    blocks.set(selector, (blocks.get(selector) ?? "") + match[2]!);
  }

  const root = declarations(blocks.get(":root") ?? "");
  const themeSelector = [...blocks.keys()].find((key) => key.startsWith("@theme")) ?? "";
  const themeBlock = blocks.get(themeSelector) ?? "";

  const primitives: Declarations = {};
  const base: Declarations = { ...declarations(themeBlock) };
  for (const [name, value] of Object.entries(root)) {
    if (PRIMITIVE_NAME.test(name)) primitives[name] = value;
    else base[name] = value;
  }
  delete base["--color-*"];

  const themes = Object.fromEntries(
    THEMES.map((theme) => [theme, declarations(blocks.get(`.theme-${theme}`) ?? "")]),
  ) as Record<Theme, Declarations>;

  return { source: css, primitives, base, themes, themeBlock };
}

export function loadTokens(): Tokens {
  return parseTokens(readFileSync(TOKENS_PATH, "utf8"));
}

export function hexValues(source: string): string[] {
  return (source.match(HEX) ?? []).map((value) => value.toUpperCase());
}

/** Resuelve un rol hasta su valor final dentro de un tema. */
export function resolve(tokens: Tokens, theme: Theme, name: string): string {
  const scope: Declarations = { ...tokens.primitives, ...tokens.base, ...tokens.themes[theme] };
  let value = scope[name];
  for (let depth = 0; value !== undefined && depth < 8; depth += 1) {
    const reference = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (!reference) return value.toUpperCase();
    value = scope[reference[1]!];
  }
  throw new Error(`El rol ${name} no se resuelve en el tema ${theme}`);
}
