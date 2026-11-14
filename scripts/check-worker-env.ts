// Falla si el Worker construido lleva algún secreto incrustado. Uso: parte de `npm run build:worker`.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findEmbeddedSecrets } from "./lib/worker-env.ts";

const file = resolve(".open-next/cloudflare/next-env.mjs");
if (!existsSync(file)) {
  console.error(`No se pudo comprobar: falta ${file}. Ejecuta antes \`opennextjs-cloudflare build\`.`);
  process.exit(1);
}
const embedded = await import(pathToFileURL(file).href);
const secrets = findEmbeddedSecrets({ production: embedded.production });
if (secrets.length > 0) {
  console.error(`El Worker lleva secretos incrustados: ${secrets.join(", ")}.`);
  console.error("Quítalos de .env y .env.local: producción los recibe con `wrangler secret put`.");
  process.exit(1);
}
console.log("Worker sin secretos incrustados.");
