// Mide el JS que /es carga de entrada (los <script src> del HTML pre-generado), comprimido con gzip.
// Uso: npm run build && npm run measure:js
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { INITIAL_JS_LIMIT_BYTES } from "./lib/size.ts";

const htmlPath = ".next/server/app/es.html";
if (!existsSync(htmlPath)) {
  console.error(`No se pudo medir: falta ${htmlPath}. Ejecuta antes \`npm run build\`.`);
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
// Los <script noModule> son polyfills para navegadores antiguos: los modernos no los descargan.
const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]).filter((tag) => !/\bnomodule\b/i.test(tag));
const sources = [...new Set(tags.flatMap((tag) => /\bsrc="(\/_next\/[^"?]+\.js)/.exec(tag)?.[1] ?? []))];
if (sources.length === 0) {
  console.error("No se pudo medir: el HTML de /es no referencia ningún script. La medición no puede darse por superada.");
  process.exit(1);
}

let total = 0;
const rows: string[] = [];
for (const src of sources) {
  const file = decodeURIComponent(src.replace("/_next/", ".next/"));
  if (!existsSync(file)) {
    console.error(`No se pudo medir: el HTML referencia ${src} y no existe ${file}.`);
    process.exit(1);
  }
  const size = gzipSync(readFileSync(file)).length;
  total += size;
  rows.push(`  ${(size / 1000).toFixed(1).padStart(7)} kB  ${src}`);
}

const kb = (n: number) => `${(n / 1000).toFixed(1)} kB`;
console.log(`JS inicial de /es (gzip), ${sources.length} archivos:`);
console.log(rows.join("\n"));
console.log(`Total: ${kb(total)} de ${kb(INITIAL_JS_LIMIT_BYTES)} (${((total / INITIAL_JS_LIMIT_BYTES) * 100).toFixed(0)} % del límite).`);
process.exit(total <= INITIAL_JS_LIMIT_BYTES ? 0 : 1);
