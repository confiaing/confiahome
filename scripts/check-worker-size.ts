// Mide el Worker tal como lo subiría Cloudflare y falla si supera el plan gratuito.
// Uso: npm run build:worker  (después de `opennextjs-cloudflare build`).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateWorkerSize, parseGzipSize } from "./lib/size.ts";

const outdir = mkdtempSync(join(tmpdir(), "confia-worker-"));
const run = spawnSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", outdir], { encoding: "utf8" });
rmSync(outdir, { recursive: true, force: true });

const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
const result = evaluateWorkerSize(run.status === 0 ? parseGzipSize(output) : null);

// Three.js es solo para el navegador: si aparece en el código del Worker, algo lo importó
// de forma estática o el build del servidor dejó de descartar su importación dinámica.
const THREE_MARK = "isWebGLRenderer";
const serverDir = ".open-next/server-functions";
const withThree = existsSync(serverDir)
  ? readdirSync(serverDir, { recursive: true })
      .map(String)
      .filter((name) => /\.m?js$/.test(name) && statSync(join(serverDir, name)).isFile())
      .filter((name) => readFileSync(join(serverDir, name)).includes(THREE_MARK))
  : null;
if (withThree === null) {
  console.error(`No se pudo comprobar el contenido del Worker: falta ${serverDir}.`);
  process.exit(1);
}
if (withThree.length > 0) {
  console.error(`Three.js está en el Worker (${withThree.slice(0, 3).join(", ")}): debe viajar solo al navegador.`);
  process.exit(1);
}
console.log("Worker sin Three.js.");

console.log(result.message);
if (!result.ok && run.status !== 0) console.error(output.trim().split("\n").slice(-8).join("\n"));
process.exit(result.ok ? 0 : 1);
