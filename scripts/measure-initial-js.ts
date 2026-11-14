// Mide el JS que /es carga de entrada (los <script src> del HTML pre-generado), comprimido con gzip.
// Uso: npm run build && npm run measure:js
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { DEFERRED_SCENE_LIMIT_BYTES, INITIAL_JS_LIMIT_BYTES } from "./lib/size.ts";

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

// Marca que solo existe en el código de Three.js: sirve para saber en qué archivo viaja.
const THREE_MARK = "isWebGLRenderer";

let total = 0;
const rows: string[] = [];
const withThree: string[] = [];
for (const src of sources) {
  const file = decodeURIComponent(src.replace("/_next/", ".next/"));
  if (!existsSync(file)) {
    console.error(`No se pudo medir: el HTML referencia ${src} y no existe ${file}.`);
    process.exit(1);
  }
  const content = readFileSync(file);
  if (content.includes(THREE_MARK)) withThree.push(src);
  const size = gzipSync(content).length;
  total += size;
  rows.push(`  ${(size / 1000).toFixed(1).padStart(7)} kB  ${src}`);
}

const kb = (n: number) => `${(n / 1000).toFixed(1)} kB`;
console.log(`JS inicial de /es (gzip), ${sources.length} archivos:`);
console.log(rows.join("\n"));
console.log(`Total: ${kb(total)} de ${kb(INITIAL_JS_LIMIT_BYTES)} (${((total / INITIAL_JS_LIMIT_BYTES) * 100).toFixed(0)} % del límite).`);

if (withThree.length > 0) {
  console.error(`Three.js está en el JS inicial (${withThree.join(", ")}): debe cargarse solo con import() dinámico.`);
  process.exit(1);
}

// La escena 3D viaja aparte y se pide después de que la página es legible.
const chunkDir = ".next/static/chunks";
const deferred = readdirSync(chunkDir, { recursive: true })
  .map(String)
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, content: readFileSync(`${chunkDir}/${name}`) }))
  .filter(({ content }) => content.includes(THREE_MARK));
if (deferred.length === 0) {
  console.error("No se encontró el trozo de la escena 3D: la medición no puede darse por superada.");
  process.exit(1);
}
const deferredSize = deferred.reduce((sum, { content }) => sum + gzipSync(content).length, 0);
console.log(`Escena 3D (diferida, fuera del JS inicial): ${kb(deferredSize)} en ${deferred.length} archivo(s).`);
if (deferredSize > DEFERRED_SCENE_LIMIT_BYTES) {
  console.error(`La escena 3D supera ${kb(DEFERRED_SCENE_LIMIT_BYTES)}.`);
  process.exit(1);
}

process.exit(total <= INITIAL_JS_LIMIT_BYTES ? 0 : 1);
