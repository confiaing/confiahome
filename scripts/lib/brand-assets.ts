import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";
import sharp from "sharp";
import {
  FAVICON_ARC,
  FAVICON_DOT,
  SYMBOL_DOT,
  SYMBOL_SEGMENTS,
  SYMBOL_SIZE,
  SYMBOL_STROKE_WIDTH,
  WORDMARK,
} from "../../src/lib/brand-geometry.ts";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";
import { splitEmphasis } from "../../src/lib/emphasis.ts";

// Genera los SVG de public/brand/ a partir de la geometría del logo, los colores de
// tokens.css y las fuentes del proyecto. El nombre se convierte en trazados para que
// los archivos se vean igual donde las fuentes no están instaladas.

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const TITLE = "Confia.ing";

type Colors = { main: string; accent: string; accentText: string };
type Tone = "light" | "dark";

function declarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[match[1]!] = match[2]!.trim();
  return out;
}

/** Resuelve roles de tokens.css a su color final, en el tema base o en uno con nombre. */
function tokenResolver(): (name: string, theme?: string) => string {
  const css = readFileSync(`${SRC}styles/tokens.css`, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = new Map<string, Record<string, string>>();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1]!.trim().split(/\s+/)[0]!;
    blocks.set(selector, { ...blocks.get(selector), ...declarations(match[2]!) });
  }
  const base = { ...blocks.get(":root"), ...blocks.get("@theme") };
  return (name, theme) => {
    const scope = theme ? { ...base, ...blocks.get(`.theme-${theme}`) } : base;
    let value = scope[`--${name}`];
    for (let depth = 0; value !== undefined && depth < 8; depth += 1) {
      const reference = /^var\((--[a-z0-9-]+)\)$/.exec(value);
      if (!reference) return value.toUpperCase();
      value = scope[reference[1]!];
    }
    throw new Error(`tokens.css no resuelve --${name}${theme ? ` en el tema ${theme}` : ""}`);
  };
}

// Los mismos roles que el componente Logo: tramos y nombre con el color del texto,
// quinto tramo y punto con la acción principal, «IA» con el énfasis de cada tema.
function palette(): Record<Tone, Colors> {
  const resolve = tokenResolver();
  const colors = (theme: string): Colors => ({
    main: resolve("color-text", theme),
    accent: resolve("color-primary", theme),
    accentText: resolve("color-emphasis", theme),
  });
  return { light: colors("light"), dark: colors("dark") };
}

const num = (value: number) => String(Math.round(value * 100) / 100);

function openFont(file: string, variation: Record<string, number>): fontkit.Font {
  const font = fontkit.openSync(`${SRC}styles/fonts/${file}`) as fontkit.Font;
  return font.getVariation(variation);
}

type Run = { text: string; font: fontkit.Font; size: number; tracking: number; fill: keyof Colors };
type Outline = { d: string; fill: keyof Colors };

/** Traza una secuencia de tramos de texto sobre una misma línea base. */
function outline(runs: Run[], originX: number, baseline: number): { outlines: Outline[]; width: number } {
  let x = originX;
  const outlines: Outline[] = [];
  for (const run of runs) {
    const scale = run.size / run.font.unitsPerEm;
    const layout = run.font.layout(run.text);
    let d = "";
    layout.glyphs.forEach((glyph, index) => {
      const px = (value: number) => num(x + value * scale);
      const py = (value: number) => num(baseline - value * scale);
      for (const command of glyph.path.commands) {
        const a = command.args;
        if (command.command === "moveTo") d += `M${px(a[0]!)} ${py(a[1]!)}`;
        else if (command.command === "lineTo") d += `L${px(a[0]!)} ${py(a[1]!)}`;
        else if (command.command === "quadraticCurveTo") d += `Q${px(a[0]!)} ${py(a[1]!)} ${px(a[2]!)} ${py(a[3]!)}`;
        else if (command.command === "bezierCurveTo")
          d += `C${px(a[0]!)} ${py(a[1]!)} ${px(a[2]!)} ${py(a[3]!)} ${px(a[4]!)} ${py(a[5]!)}`;
        else d += "Z";
      }
      x += layout.positions[index]!.xAdvance * scale + run.tracking * run.size;
    });
    outlines.push({ d, fill: run.fill });
  }
  return { outlines, width: x - originX };
}

function wordmarkRuns(em: number): { runs: Run[]; ascent: number; descent: number } {
  const display = openFont("fraunces-latin-opsz-normal.woff2", { wght: WORDMARK.weight, opsz: WORDMARK.opticalSize });
  const italic = openFont("fraunces-latin-opsz-italic.woff2", { wght: WORDMARK.ing.weight, opsz: WORDMARK.opticalSize });
  const body = openFont("figtree-latin-wght-normal.woff2", { wght: WORDMARK.ia.weight });
  return {
    runs: [
      { text: "conf", font: display, size: em, tracking: WORDMARK.tracking, fill: "main" },
      { text: "IA", font: body, size: em * WORDMARK.ia.scale, tracking: WORDMARK.ia.tracking, fill: "accentText" },
      { text: ".", font: display, size: em, tracking: WORDMARK.tracking, fill: "accentText" },
      { text: "ing", font: italic, size: em, tracking: WORDMARK.tracking, fill: "main" },
    ],
    ascent: (display.ascent / display.unitsPerEm) * em,
    descent: (-display.descent / display.unitsPerEm) * em,
  };
}

function symbolMarkup(colors: Colors, x = 0, y = 0, scale = 1): string {
  const segments = SYMBOL_SEGMENTS.map(
    (d, index) => `<path d="${d}" stroke="${index === SYMBOL_SEGMENTS.length - 1 ? colors.accent : colors.main}"/>`,
  ).join("");
  const move = x || y ? `translate(${num(x)} ${num(y)})` : "";
  const grow = scale !== 1 ? `scale(${scale})` : "";
  const transform = move || grow ? ` transform="${[move, grow].filter(Boolean).join(" ")}"` : "";
  return (
    `<g${transform}><g fill="none" stroke-width="${SYMBOL_STROKE_WIDTH}">${segments}</g>` +
    `<circle cx="${SYMBOL_DOT.cx}" cy="${SYMBOL_DOT.cy}" r="${SYMBOL_DOT.r}" fill="${colors.accent}"/></g>`
  );
}

function svg(width: number, height: number, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(width)} ${num(height)}" role="img">` +
    `<title>${TITLE}</title>${body}</svg>\n`
  );
}

const paths = (outlines: Outline[], colors: Colors) =>
  outlines.map((item) => `<path d="${item.d}" fill="${colors[item.fill]}"/>`).join("");

const MARGIN = 2;
const EM = SYMBOL_SIZE / WORDMARK.symbolEm;

/** Símbolo y nombre en una línea, centrados como en el componente. */
function horizontal(colors: Colors): string {
  const { runs, ascent, descent } = wordmarkRuns(EM);
  // La caja de línea mide 1 em y se centra con el símbolo; de ahí sale la línea base.
  const baseline = MARGIN + SYMBOL_SIZE / 2 + (ascent - descent) / 2;
  const textX = MARGIN + SYMBOL_SIZE + WORDMARK.gapEm * EM;
  const { outlines, width } = outline(runs, textX, baseline);
  return svg(
    textX + width + MARGIN,
    SYMBOL_SIZE + MARGIN * 2,
    symbolMarkup(colors, MARGIN, MARGIN) + paths(outlines, colors),
  );
}

/** Símbolo sobre el nombre, para espacios estrechos o cuadrados. */
function compact(colors: Colors): string {
  // Apilado, el símbolo crece para pesar lo mismo que el nombre.
  const scale = 1.75;
  const symbol = SYMBOL_SIZE * scale;
  const { runs, ascent } = wordmarkRuns(EM);
  const measured = outline(runs, 0, 0).width;
  const width = Math.max(measured, symbol) + MARGIN * 2;
  const baseline = MARGIN + symbol + WORDMARK.gapEm * EM + ascent * 0.78;
  const { outlines } = outline(runs, (width - measured) / 2, baseline);
  return svg(
    width,
    baseline + EM * 0.3 + MARGIN,
    symbolMarkup(colors, (width - symbol) / 2, MARGIN, scale) + paths(outlines, colors),
  );
}

function symbolOnly(colors: Colors): string {
  return svg(SYMBOL_SIZE, SYMBOL_SIZE, symbolMarkup(colors));
}

const ICON_SIZE = 64;
const ICON_SCALE = 46 / SYMBOL_SIZE;

/** Favicon reducido: arco continuo y punto sobre una ficha crema. */
export function iconSvg(options: { rounded: boolean }): string {
  const resolve = tokenResolver();
  const offset = (ICON_SIZE - SYMBOL_SIZE * ICON_SCALE) / 2;
  const radius = options.rounded ? ` rx="${num(ICON_SIZE * 0.22)}"` : "";
  return svg(
    ICON_SIZE,
    ICON_SIZE,
    `<rect width="${ICON_SIZE}" height="${ICON_SIZE}"${radius} fill="${resolve("color-background")}"/>` +
      `<g transform="translate(${num(offset)} ${num(offset)}) scale(${ICON_SCALE})">` +
      `<path d="${FAVICON_ARC.d}" fill="none" stroke="${resolve("color-text")}" stroke-width="${FAVICON_ARC.strokeWidth}" stroke-linecap="round"/>` +
      `<circle cx="${FAVICON_DOT.cx}" cy="${FAVICON_DOT.cy}" r="${FAVICON_DOT.r}" fill="${resolve("color-primary")}"/></g>`,
  );
}

/** Todos los SVG de public/brand/, por nombre de archivo. */
export function buildSvgAssets(): Record<string, string> {
  const colors = palette();
  return {
    "logo.svg": horizontal(colors.light),
    "logo-dark.svg": horizontal(colors.dark),
    "logo-compact.svg": compact(colors.light),
    "logo-compact-dark.svg": compact(colors.dark),
    "symbol.svg": symbolOnly(colors.light),
    "symbol-dark.svg": symbolOnly(colors.dark),
    "favicon.svg": iconSvg({ rounded: true }),
  };
}

// ---------------------------------------------------------------------------
// Imagen para compartir en redes (Open Graph): 1200×630, una por idioma.
// ---------------------------------------------------------------------------
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const OG_MARGIN = 80;
const OG_LOGO_SCALE = 2.1;

type Word = { text: string; emphasis: boolean };

/**
 * La frase del hero en su idioma, con el logo arriba, sobre el fondo de la página.
 * El texto va convertido en trazados, como en los logos: no depende de fuentes instaladas.
 * La palabra que el título resalta va en cursiva y en el color de énfasis, igual que en la home.
 */
export function ogImageSvg(locale: "es" | "en"): string {
  const resolve = tokenResolver();
  const colors = palette().light;
  const background = resolve("color-background");

  const upright = openFont("fraunces-latin-opsz-normal.woff2", { wght: 500, opsz: 144 });
  const italic = openFont("fraunces-latin-opsz-italic.woff2", { wght: 500, opsz: 144 });
  const words: Word[] = splitEmphasis(getDictionary(locale).home.hero.title).flatMap((run) =>
    run.text.split(/\s+/).filter(Boolean).map((text) => ({ text, emphasis: run.emphasis })),
  );
  const toRun = (word: Word, size: number): Run => ({
    text: word.text,
    font: word.emphasis ? italic : upright,
    size,
    tracking: -0.02,
    fill: word.emphasis ? "accentText" : "main",
  });

  // Se busca el mayor tamaño con el que la frase cabe en tres líneas o menos.
  const maxWidth = OG_WIDTH - OG_MARGIN * 2;
  let size = 84;
  let lines: Word[][] = [];
  for (; size >= 48; size -= 4) {
    const space = size * 0.26;
    lines = [[]];
    let width = 0;
    for (const word of words) {
      const advance = outline([toRun(word, size)], 0, 0).width;
      const needed = lines.at(-1)!.length === 0 ? advance : width + space + advance;
      if (needed > maxWidth && lines.at(-1)!.length > 0) {
        lines.push([word]);
        width = advance;
      } else {
        lines.at(-1)!.push(word);
        width = needed;
      }
    }
    if (lines.length <= 3) break;
  }

  const lineHeight = size * 1.12;
  const firstBaseline = OG_HEIGHT - OG_MARGIN - (lines.length - 1) * lineHeight - size * 0.12;
  let body = "";
  lines.forEach((line, index) => {
    let x = OG_MARGIN;
    for (const word of line) {
      const { outlines, width } = outline([toRun(word, size)], x, firstBaseline + index * lineHeight);
      body += paths(outlines, colors);
      x += width + size * 0.26;
    }
  });

  // El logo horizontal, a escala, en la esquina superior.
  const { runs, ascent, descent } = wordmarkRuns(EM);
  const baseline = SYMBOL_SIZE / 2 + (ascent - descent) / 2;
  const mark = outline(runs, SYMBOL_SIZE + WORDMARK.gapEm * EM, baseline);
  const logo = `<g transform="translate(${OG_MARGIN} ${OG_MARGIN - 8}) scale(${OG_LOGO_SCALE})">${symbolMarkup(colors)}${paths(mark.outlines, colors)}</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" width="${OG_WIDTH}" height="${OG_HEIGHT}" role="img">` +
    `<title>${TITLE}</title><rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${background}"/>` +
    `<rect x="${OG_MARGIN}" y="${num(firstBaseline - size - 34)}" width="72" height="8" rx="4" fill="${colors.accent}"/>` +
    `${logo}${body}</svg>\n`
  );
}

/** El PNG que se publica: mismo dibujo, con paleta para que pese poco. */
export function ogImagePng(locale: "es" | "en"): Promise<Buffer> {
  return sharp(Buffer.from(ogImageSvg(locale))).resize(OG_WIDTH, OG_HEIGHT).png({ compressionLevel: 9, palette: true }).toBuffer();
}

