// Carga en el Worker los secretos de .env.prod, sin mostrarlos. Lo ejecuta el fundador:
//   npm run secrets:put
// Los valores van de .env.prod a `wrangler secret bulk` por la entrada estándar: no pasan
// por la pantalla, por los argumentos del proceso ni por ningún archivo intermedio.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnvFile, workerSecrets } from "./lib/release.ts";

if (!existsSync(".env.prod")) {
  console.error("Falta .env.prod.");
  process.exit(1);
}
const secrets = workerSecrets(parseEnvFile(readFileSync(".env.prod", "utf8")));
console.log(`Cargando ${Object.keys(secrets).length} secretos en el Worker: ${Object.keys(secrets).join(", ")}.`);
const run = spawnSync("npx", ["wrangler", "secret", "bulk"], { input: JSON.stringify(secrets), stdio: ["pipe", "inherit", "inherit"] });
process.exit(run.status ?? 1);
