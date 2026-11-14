import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { en } from "../src/i18n/dictionaries/en.ts";
import { es } from "../src/i18n/dictionaries/es.ts";

// Genera docs/content/home.md: el texto de la home en español e inglés, lado a lado,
// para la revisión editorial del fundador (BACKLOG L3-7). Uso: npm run content:doc

const OUT = fileURLToPath(new URL("../docs/content/home.md", import.meta.url));

const SECTIONS: [key: keyof typeof es.home, title: string][] = [
  ["actions", "Acciones (hero y cierre)"],
  ["hero", "Hero"],
  ["start", "Dónde empezamos"],
  ["journey", "Cómo lo hacemos realidad"],
  ["offer", "Lo que ofrecemos"],
  ["trust", "Por qué confiar"],
  ["closing", "Cierre"],
];

function leaves(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  return Object.entries(value as object).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}

const cell = (text: string) => text.replace(/\|/g, "\\|");

let out = `# Texto de la home — español e inglés

Documento generado desde los diccionarios (\`src/i18n/dictionaries/\`). No lo edites a mano:
los cambios se hacen en \`es.ts\` y \`en.ts\`, y se regenera con \`npm run content:doc\`.

**Para revisar (BACKLOG L3-7):** que el inglés suene natural, no traducido, y que no prometa
más que el español. Los asteriscos marcan la palabra que el título resalta en cursiva.
`;

for (const [key, title] of SECTIONS) {
  const spanish = leaves(es.home[key]);
  const english = new Map(leaves(en.home[key]));
  out += `\n## ${title}\n\n| Clave | Español | English |\n|---|---|---|\n`;
  for (const [path, text] of spanish) out += `| \`${path}\` | ${cell(text)} | ${cell(english.get(path) ?? "—")} |\n`;
}

writeFileSync(OUT, out);
console.log(`Documento de contenido generado: ${OUT}`);
