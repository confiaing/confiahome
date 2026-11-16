// Construye el Worker para producción, o solo comprueba que se puede (--check).
// Uso: npm run release:check · npm run release
// Lee .env.prod sin mostrar ningún valor. Al build solo le pasa las variables públicas.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LEGAL_DOCUMENTS } from "../src/i18n/legal/index.ts";
import { LEGAL_ENTITY, LEGAL_STATUS, publicationBlockers } from "../src/i18n/legal/status.ts";
import { parseEnvFile, publicBuildEnv, releaseProblems } from "./lib/release.ts";

const FILE = ".env.prod";
if (!existsSync(FILE)) {
  console.error(`Falta ${FILE}. Cópialo de .env.example y rellénalo (docs/setup.md).`);
  process.exit(1);
}
const env = parseEnvFile(readFileSync(FILE, "utf8"));
const documents = Object.values(LEGAL_DOCUMENTS).flatMap((set) => Object.values(set));
const { problems, warnings } = releaseProblems(env, { status: LEGAL_STATUS, blockers: publicationBlockers(LEGAL_STATUS, LEGAL_ENTITY, documents) });

for (const warning of warnings) console.warn(`Aviso: ${warning}`);
if (problems.length > 0) {
  console.error(`El entorno de ${FILE} no sirve para producción:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Entorno de producción comprobado (${Object.keys(env).length} variables, sin mostrar valores).`);
if (process.argv.includes("--check")) process.exit(0);

const build = spawnSync("npm", ["run", "build:worker"], { stdio: "inherit", env: { ...process.env, ...publicBuildEnv(env) } });
if (build.status !== 0) process.exit(build.status ?? 1);

// El build debe llevar la clave pública de este entorno: si no, se construyó con otro.
const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;
const chunks = ".next/static/chunks";
const found = readdirSync(chunks, { recursive: true })
  .map(String)
  .filter((name) => name.endsWith(".js") && statSync(join(chunks, name)).isFile())
  .some((name) => readFileSync(join(chunks, name), "utf8").includes(siteKey));
if (!found) {
  console.error("El build no contiene la clave pública de Turnstile de .env.prod: no se construyó con este entorno.");
  process.exit(1);
}
console.log("Build de producción listo para `npx wrangler deploy`.");
