import localFont from "next/font/local";

// Tipografías servidas desde el propio dominio (ADR-0011). Los archivos y sus
// licencias SIL OFL están en ./fonts/. Solo el subconjunto «latin»: cubre español
// e inglés, y tests/unit/fonts.test.ts lo comprueba glifo a glifo.
// Figtree usa el respaldo de métricas ajustadas de next/font; Fraunces, uno propio.

/** Títulos y cifras. Variable en peso y en tamaño óptico. */
export const fraunces = localFont({
  src: "./fonts/fraunces-latin-opsz-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
  // El respaldo de next/font sale un 36 % más ancho que Fraunces en títulos (calcula sobre
  // la instancia por defecto de la fuente variable). El respaldo se define en globals.css.
  adjustFontFallback: false,
});

/**
 * Cursiva de énfasis en los títulos. Sin precarga: llega tras el primer pintado y su
 * respaldo ajustado (globals.css) evita que el título cambie de líneas al llegar.
 */
export const frauncesItalic = localFont({
  src: "./fonts/fraunces-latin-opsz-italic.woff2",
  weight: "100 900",
  style: "italic",
  variable: "--font-fraunces-italic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

/** Texto e interfaz. */
export const figtree = localFont({
  src: "./fonts/figtree-latin-wght-normal.woff2",
  weight: "300 900",
  style: "normal",
  variable: "--font-figtree",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

/** Etiquetas, números de etapa y terminal. */
export const dmMono = localFont({
  src: [
    { path: "./fonts/dm-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/dm-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

/** Clases que publican las variables --font-* en <html>. */
export const fontVariables = [fraunces, frauncesItalic, figtree, dmMono].map((font) => font.variable).join(" ");
