// Falla si el Worker construido lleva algún secreto incrustado. Uso: parte de `npm run build:worker`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findEmbeddedSecrets, keepProductionOnly } from "./lib/worker-env.ts";

const file = resolve(".open-next/cloudflare/next-env.mjs");
if (!existsSync(file)) {
  console.error(`No se pudo comprobar: falta ${file}. Ejecuta antes \`opennextjs-cloudflare build\`.`);
  process.exit(1);
}
// El Worker que se sube solo necesita el bloque de producción: los otros dos se vacían aquí,
// porque OpenNext copia en ellos .env.development.local, que sí puede tener claves.
writeFileSync(file, keepProductionOnly(readFileSync(file, "utf8")));
const embedded = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
const secrets = findEmbeddedSecrets({ production: embedded.production, development: embedded.development, test: embedded.test });
if (secrets.length > 0) {
  console.error(`El Worker lleva secretos incrustados: ${secrets.join(", ")}.`);
  console.error("Quítalos de .env y .env.local: producción los recibe con `wrangler secret put`.");
  process.exit(1);
}
console.log("Worker sin secretos incrustados (bloques de desarrollo y de pruebas vaciados).");
if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
  // La clave pública se incrusta al construir. Sin ella el formulario no carga la verificación
  // y, con los servicios reales, el servidor rechaza todas las consultas.
  console.warn("Aviso: este build no lleva NEXT_PUBLIC_TURNSTILE_SITE_KEY. Vale para pruebas; NO para desplegar.");
}
