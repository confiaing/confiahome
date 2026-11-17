import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { FORBIDDEN_IN_WORKFLOWS } from "./helpers/workflow-rules";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const raw = (path: string) => (existsSync(ROOT + path) ? readFileSync(ROOT + path, "utf8") : "");
type Workflow = {
  on?: { schedule?: { cron: string }[]; pull_request?: { paths?: string[] }; workflow_dispatch?: unknown };
  permissions?: unknown;
  concurrency?: unknown;
  jobs?: Record<string, { steps?: { run?: string }[] }>;
};
type Dependabot = {
  version?: number;
  updates?: {
    "package-ecosystem"?: string;
    directory?: string;
    schedule?: { interval?: string };
    "open-pull-requests-limit"?: number;
    groups?: Record<string, { patterns?: string[]; "update-types"?: string[] }>;
  }[];
};
type Protection = {
  required_status_checks?: { strict?: boolean; contexts?: string[] };
  required_pull_request_reviews?: { required_approving_review_count?: number };
  enforce_admins?: boolean;
  allow_force_pushes?: boolean;
  allow_deletions?: boolean;
};

// `yaml` sigue YAML 1.2: la clave `on` se lee como texto, no como booleano.
const yaml = <T,>(path: string) => (parse(raw(path)) ?? {}) as T;
const workflow = (path: string) => yaml<Workflow>(path);
const triggers = (path: string) => workflow(path).on ?? {};
const runs = (path: string) =>
  Object.values(workflow(path).jobs ?? {})
    .flatMap((job) => job.steps ?? [])
    .map((step) => step.run ?? "")
    .join("\n");

function readOnly(path: string) {
  it("existe", () => expect(existsSync(ROOT + path)).toBe(true));

  it("declara permisos de solo lectura", () => {
    expect(workflow(path).permissions).toEqual({ contents: "read" });
  });

  it.each(FORBIDDEN_IN_WORKFLOWS)("no contiene %s", (forbidden) => {
    expect(raw(path)).not.toContain(forbidden);
  });
}

// production-release · Vigilancia diaria de producción (L12)
describe("vigilancia diaria de producción", () => {
  const path = ".github/workflows/verify-production.yml";
  readOnly(path);

  it("se dispara cada día y a demanda, nunca por un push", () => {
    const on = triggers(path);
    expect(Object.keys(on).sort()).toEqual(["schedule", "workflow_dispatch"]);
    const crons = (on.schedule ?? []).map((entry) => entry.cron);
    expect(crons).toHaveLength(1);
    // Minuto y hora fijos, todos los días.
    expect(crons[0]).toMatch(/^\d{1,2} \d{1,2} \* \* \*$/);
  });

  it("ejecuta el verificador contra https://confia.ing", () => {
    expect(runs(path)).toMatch(/node scripts\/verify-production\.ts https:\/\/confia\.ing(\s|$)/);
  });

  it("no instala dependencias: el verificador solo usa fetch", () => {
    expect(runs(path)).not.toMatch(/npm (ci|install)/);
  });

  it("no se solapa consigo mismo", () => {
    expect(workflow(path).concurrency).toBeTruthy();
  });
});

// repository-and-ci · Dependencias vigiladas (L12)
describe("dependencias vigiladas: Dependabot", () => {
  const path = ".github/dependabot.yml";
  const updates = () => yaml<Dependabot>(path).updates ?? [];
  const ecosystem = (name: string) => updates().find((entry) => entry["package-ecosystem"] === name);

  it("vigila npm y github-actions en la raíz, una vez por semana", () => {
    expect(yaml<Dependabot>(path).version).toBe(2);
    expect(updates().map((entry) => entry["package-ecosystem"]).sort()).toEqual(["github-actions", "npm"]);
    for (const entry of updates()) {
      expect(entry.directory).toBe("/");
      expect(entry.schedule?.interval).toBe("weekly");
    }
  });

  it("agrupa las menores y de parche de npm en un solo pull request, y deja sueltas las mayores", () => {
    const groups = Object.values(ecosystem("npm")?.groups ?? {});
    expect(groups).toHaveLength(1);
    expect([...(groups[0]?.["update-types"] ?? [])].sort()).toEqual(["minor", "patch"]);
    expect(ecosystem("npm")?.["open-pull-requests-limit"]).toBe(5);
  });
});

describe("dependencias vigiladas: auditoría", () => {
  const path = ".github/workflows/audit.yml";
  readOnly(path);

  it("se dispara cada semana, a demanda y en cada pull request que cambia las dependencias", () => {
    const on = triggers(path);
    expect(Object.keys(on).sort()).toEqual(["pull_request", "schedule", "workflow_dispatch"]);
    const crons = (on.schedule ?? []).map((entry) => entry.cron);
    expect(crons).toHaveLength(1);
    // Un día de la semana concreto.
    expect(crons[0]).toMatch(/^\d{1,2} \d{1,2} \* \* [0-6]$/);
    expect([...(on.pull_request?.paths ?? [])].sort()).toEqual(["package-lock.json", "package.json"]);
  });

  it("ejecuta npm audit con nivel high tras npm ci", () => {
    const commands = runs(path);
    expect(commands).toMatch(/npm ci/);
    expect(commands).toMatch(/npm audit --audit-level=high(\s|$)/);
    expect(commands.indexOf("npm ci")).toBeLessThan(commands.indexOf("npm audit"));
  });
});

// repository-and-ci · Rama principal protegida (L12)
describe("protección de main", () => {
  const path = ".github/branch-protection.json";
  const protection = () => JSON.parse(raw(path) || "{}") as Protection;
  const ciJobs = Object.keys(workflow(".github/workflows/ci.yml").jobs ?? {});

  it("la CI tiene los cuatro trabajos que se exigen", () => {
    expect(ciJobs.sort()).toEqual(["contract", "e2e", "e2e-preview", "quality"]);
  });

  it("exige exactamente los trabajos de ci.yml, con la rama al día", () => {
    const checks = protection().required_status_checks;
    expect(checks?.strict).toBe(true);
    expect([...(checks?.contexts ?? [])].sort()).toEqual([...ciJobs].sort());
  });

  it("exige pull request, sin aprobaciones de otra persona", () => {
    expect(protection().required_pull_request_reviews?.required_approving_review_count).toBe(0);
  });

  it("se aplica también a los administradores", () => {
    expect(protection().enforce_admins).toBe(true);
  });

  it("prohíbe forzar el historial y borrar la rama", () => {
    expect(protection().allow_force_pushes).toBe(false);
    expect(protection().allow_deletions).toBe(false);
  });
});
