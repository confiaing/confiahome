export type TextRun = { text: string; emphasis: boolean };

// Los diccionarios marcan con *asteriscos* la palabra que un título resalta. Así cada
// idioma decide qué enfatiza, sin HTML en los textos.
const MARKED = /\*([^*\s](?:[^*]*[^*\s])?)\*/g;

/** Parte un texto en tramos; los que iban entre asteriscos llevan `emphasis: true`. */
export function splitEmphasis(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKED)) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index), emphasis: false });
    runs.push({ text: match[1]!, emphasis: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), emphasis: false });
  return runs;
}

/** El mismo texto sin las marcas, para nombres accesibles y metadatos. */
export function stripEmphasis(text: string): string {
  return splitEmphasis(text)
    .map((run) => run.text)
    .join("");
}
