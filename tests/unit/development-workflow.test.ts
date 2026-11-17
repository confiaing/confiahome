import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(ROOT + path, "utf8");
const folders = (path: string) =>
  existsSync(ROOT + path) ? readdirSync(ROOT + path, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];

// Capacidades que declararon los cambios L0 a L10.
const V1_CAPABILITIES = [
  "analytics-events", "analytics-instrumentation", "app-shell", "architecture-guardrails", "brand-identity",
  "build-budgets", "contact-form", "contact-submission", "content-claims", "design-tokens", "environment-config",
  "home-page", "journey-navigation", "legal-pages", "locale-routing", "not-found-page", "production-release",
  "release-quality", "repository-and-ci", "scene-rendering", "scheduled-maintenance", "scheduling",
  "search-and-agent-discovery", "security-headers", "site-navigation", "translations", "typography", "ui-components",
];

// development-workflow · Especificaciones vigentes archivadas (L11)
describe("especificaciones vigentes", () => {
  it("no queda abierto ningún cambio de L0 a L10", () => {
    const open = folders("openspec/changes/").filter((name) => name !== "archive");
    expect(open.filter((name) => /^l(10|[0-9])-/.test(name))).toEqual([]);
  });

  it.each(V1_CAPABILITIES)("openspec/specs/%s está archivada, con propósito y exigencias", (capability) => {
    const path = `openspec/specs/${capability}/spec.md`;
    expect(existsSync(ROOT + path)).toBe(true);
    const spec = read(path);
    expect(spec).toMatch(/^## Purpose$/m);
    expect(spec).toMatch(/^### Requirement: /m);
  });
});

// development-workflow · Guía del agente al día (L11)
describe("CLAUDE.md", () => {
  const claude = read("CLAUDE.md");
  const howWeWork = claude.split("## Cómo trabajas")[1]?.split("\n## ")[0] ?? "";

  it("exige la revisión de código en local antes de cada push y enlaza D1", () => {
    expect(howWeWork).toMatch(/\/code-review[^\n]*antes de cada `push`/);
    expect(howWeWork).toMatch(/README\.md#revisión-de-código-antes-de-subir-cambios/);
  });

  it("describe el flujo por rama: lote/<nombre>, pull request con la CI en verde y fusión (L12)", () => {
    expect(howWeWork).toMatch(/`lote\/<nombre>`/);
    expect(howWeWork).toMatch(/rechaza el push directo, también del fundador/);
    expect(howWeWork).toMatch(/se funde en `main`/);
    // Con main protegida, cerrar un lote ya no es un commit en main.
    expect(howWeWork).not.toMatch(/uno local al cerrar cada lote/);
  });

  it("describe la v1.1: v1 en producción y lotes L11 a L16", () => {
    expect(claude).toMatch(/v1 en producción/);
    expect(claude).toMatch(/L11 a L16/);
    expect(claude).not.toMatch(/la v1 se sube completa al final/i);
  });
});

// development-workflow · Skill de revisión versionado (L11)
describe("skill de revisión", () => {
  // El nombre «code-reviewer» lo tiene también un plugin, que gana al invocarlo: este va con prefijo.
  it("está en .claude/skills/aitmpl-code-reviewer/ con su nombre propio y su procedencia", () => {
    const path = ".claude/skills/aitmpl-code-reviewer/SKILL.md";
    expect(existsSync(ROOT + path)).toBe(true);
    expect(read(path)).toMatch(/^name:\s*aitmpl-code-reviewer\s*$/m);
    expect(existsSync(`${ROOT}.claude/skills/aitmpl-code-reviewer/references/bug-patterns.md`)).toBe(true);
    expect(read(".claude/skills/aitmpl-code-reviewer/SOURCE.md")).toMatch(/0a684978913f9124b1a9fab352aac2d318b56103/);
  });

  it("CLAUDE.md lo nombra como el skill de revisión", () => {
    expect(read("CLAUDE.md")).toMatch(/`aitmpl-code-reviewer`/);
  });
});

// development-workflow · Configuración de OpenSpec válida (L11)
describe("openspec/config.yaml", () => {
  const config = parse(read("openspec/config.yaml")) as {
    context: string;
    rules: Record<string, unknown[]>;
    operations?: Record<string, { guidance?: unknown[] }>;
  };

  it.each(Object.keys(config.rules))("cada regla de %s es un texto", (artifact) => {
    for (const rule of config.rules[artifact]!) expect(typeof rule, String(JSON.stringify(rule))).toBe("string");
  });

  it("el contexto describe el plan vigente: lotes hasta L16 y ADR hasta el último", () => {
    expect(config.context).toMatch(/L16/);
    const adrs = readdirSync(`${ROOT}docs/architecture/adr/`).filter((name) => /^\d{4}-/.test(name)).sort();
    const last = adrs.at(-1)!.slice(0, 4);
    expect(config.context).toContain(`ADR-0001 a ${last}`);
  });

  it("ninguna regla dice que la v1 se sube completa al final", () => {
    expect(read("openspec/config.yaml")).not.toMatch(/la v1 se sube completa al final/i);
  });
});
