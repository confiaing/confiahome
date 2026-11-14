import localFont from "next/font/local";

// Tipografías servidas desde el propio dominio (ADR-0011). Los archivos y sus
// licencias SIL OFL están en ./fonts/. Solo el subconjunto «latin»: cubre español
// e inglés, y tests/unit/fonts.test.ts lo comprueba glifo a glifo.
// next/font añade un respaldo con métricas ajustadas para que el diseño no salte.

/** Títulos y cifras. Variable en peso y en tamaño óptico. */
export const fraunces = localFont({
  src: "./fonts/fraunces-latin-opsz-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
});

/** Cursiva de énfasis en los títulos. Sin precarga: llega tras el primer pintado. */
export const frauncesItalic = localFont({
  src: "./fonts/fraunces-latin-opsz-italic.woff2",
  weight: "100 900",
  style: "italic",
  variable: "--font-fraunces-italic",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
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
