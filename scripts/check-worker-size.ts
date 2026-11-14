// Mide el Worker tal como lo subiría Cloudflare y falla si supera el plan gratuito.
// Uso: npm run build:worker  (después de `opennextjs-cloudflare build`).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateWorkerSize, parseGzipSize } from "./lib/size.ts";

const outdir = mkdtempSync(join(tmpdir(), "confia-worker-"));
const run = spawnSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", outdir], { encoding: "utf8" });
rmSync(outdir, { recursive: true, force: true });

const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
const result = evaluateWorkerSize(run.status === 0 ? parseGzipSize(output) : null);

console.log(result.message);
if (!result.ok && run.status !== 0) console.error(output.trim().split("\n").slice(-8).join("\n"));
process.exit(result.ok ? 0 : 1);
