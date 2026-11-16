import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const workflow = readFileSync(`${ROOT}.github/workflows/ci.yml`, "utf8");
const claude = readFileSync(`${ROOT}CLAUDE.md`, "utf8");

// La línea «Puerta de cierre de lote» de CLAUDE.md lista los comandos entre comillas invertidas.
const gateLine = claude.split("\n").find((line) => line.includes("Puerta de cierre de lote")) ?? "";
const gateCommands = [...gateLine.split("todo en verde")[0]!.matchAll(/`([a-z0-9:-]+)`/g)].map((m) => m[1]!);

const runs = (command: string) => (command === "test" ? /npm test\b/ : new RegExp(`npm run ${command}\\b`)).test(workflow);

describe("integración continua", () => {
  it("la puerta de cierre de CLAUDE.md se lee completa", () => {
    expect(gateCommands).toEqual(["lint", "typecheck", "test", "e2e", "e2e:preview", "build:worker", "measure:js"]);
  });

  it.each(["lint", "typecheck", "test", "e2e", "e2e:preview", "build:worker", "measure:js"])("ejecuta %s", (command) => {
    expect(runs(command)).toBe(true);
  });

  it("todos los comandos de CLAUDE.md están en el workflow", () => {
    for (const command of gateCommands) expect(runs(command), command).toBe(true);
  });

  it("ejecuta también el contrato", () => {
    expect(workflow).toMatch(/npm run test:contract\b/);
  });

  it.each(["secrets.", "wrangler deploy", "supabase db push", "git push"])("no contiene %s", (forbidden) => {
    expect(workflow).not.toContain(forbidden);
  });

  it("declara permisos de solo lectura", () => {
    expect(workflow).toMatch(/^permissions:\s*\n\s+contents: read$/m);
  });
});
