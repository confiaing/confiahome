// Verifica un sitio desplegado sin crear datos. Uso: node scripts/verify-production.ts https://confia.ing
import { verifySite } from "./lib/verify-site.ts";

const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) {
  console.error("Uso: node scripts/verify-production.ts <dirección del sitio>");
  process.exit(1);
}
const checks = await verifySite(base);
for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? ` (${check.detail})` : ""}`);
const failed = checks.filter((check) => !check.ok).length;
console.log(failed === 0 ? `\n${checks.length} comprobaciones en verde.` : `\n${failed} de ${checks.length} comprobaciones fallaron.`);
process.exit(failed === 0 ? 0 : 1);
