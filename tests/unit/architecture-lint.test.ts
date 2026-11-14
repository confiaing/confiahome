import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// architecture-guardrails (docs/escenarios.md, L0-4).
// Cada archivo de tests/fixtures/lint/ se analiza como si viviera en la ruta indicada bajo src/.
const root = fileURLToPath(new URL("../..", import.meta.url));
const eslint = new ESLint({ cwd: root });

async function lintAs(fixture: string, virtualPath: string) {
  const code = readFileSync(`${root}/tests/fixtures/lint/${fixture}`, "utf8");
  const [result] = await eslint.lintText(code, { filePath: `${root}/${virtualPath}` });
  return (result?.messages ?? []).filter((m) => m.severity === 2);
}

type Messages = Awaited<ReturnType<typeof lintAs>>;
// Las reglas de arquitectura informan con dos reglas de ESLint; el mensaje distingue imports de colores.
const isColor = (m: Messages[number]) => /Color literal/.test(m.message);
const importErrors = (messages: Messages) =>
  messages.filter((m) => ["no-restricted-imports", "no-restricted-syntax"].includes(m.ruleId ?? "") && !isColor(m));
const colorErrors = (messages: Messages) => messages.filter(isColor);
const lines = (messages: Messages) => [...new Set(messages.map((m) => m.line))].sort((a, b) => a - b);

// scene-rendering · La escena 3D no retrasa la lectura: three no puede colarse en el JS inicial
describe("three solo en el módulo de la escena", () => {
  it.each([
    "src/components/sections/fixture.ts",
    "src/components/journey/scene/scene-controller.ts",
    "src/app/fixture.ts",
    "src/lib/fixture.ts",
  ])("rechaza importarlo desde %s, también con import() dinámico", async (path) => {
    const errors = importErrors(await lintAs("three-import.ts", path));
    expect(lines(errors)).toEqual([1, 2, 4]);
  });

  it("lo admite en three-scene.ts", async () => {
    const errors = importErrors(await lintAs("three-import.ts", "src/components/journey/scene/three-scene.ts"));
    expect(errors).toEqual([]);
  });
});

describe("dominio puro", () => {
  it("rechaza next, react, supabase, three y los adaptadores", async () => {
    const errors = importErrors(await lintAs("domain-forbidden.ts", "src/domain/contact/fixture.ts"));
    expect(lines(errors)).toEqual([2, 3, 4, 5, 6]);
  });

  it("admite zod, el propio dominio y los imports relativos", async () => {
    const errors = importErrors(await lintAs("domain-allowed.ts", "src/domain/contact/fixture.ts"));
    expect(errors).toEqual([]);
  });
});

describe("componentes aislados", () => {
  it("rechaza adaptadores y código de servidor", async () => {
    const errors = importErrors(await lintAs("component-forbidden.tsx", "src/components/contact/fixture.tsx"));
    expect(lines(errors)).toEqual([2, 3]);
  });

  it("admite dominio, i18n y lib pública", async () => {
    const errors = importErrors(await lintAs("component-allowed.tsx", "src/components/contact/fixture.tsx"));
    expect(errors).toEqual([]);
  });
});

describe("otras carpetas", () => {
  it("un adaptador no puede importar componentes ni lib", async () => {
    const errors = importErrors(await lintAs("component-allowed.tsx", "src/adapters/memory/fixture.ts"));
    // i18n y lib están prohibidos para un adaptador; domain está permitido.
    expect(lines(errors)).toEqual([1, 2]);
  });

  it("i18n no puede importar otras carpetas del proyecto", async () => {
    const errors = importErrors(await lintAs("component-allowed.tsx", "src/i18n/fixture.ts"));
    // Se admite el propio i18n (línea 1); lib y domain no.
    expect(lines(errors)).toEqual([2, 3]);
  });

  it("las rutas no pueden importar adaptadores directamente", async () => {
    const errors = importErrors(await lintAs("component-forbidden.tsx", "src/app/api/contact/route.ts"));
    // lib/server sí está permitido en app; adapters no.
    expect(lines(errors)).toEqual([2]);
  });
});

describe("sin colores literales", () => {
  it("rechaza hex, rgb y hsl", async () => {
    const errors = colorErrors(await lintAs("color-literals.tsx", "src/components/ui/fixture.tsx"));
    expect(lines(errors)).toEqual([2, 3, 4, 5]);
  });

  it("admite transparent, currentColor, inherit, anclas y variables", async () => {
    const errors = colorErrors(await lintAs("color-keywords.tsx", "src/components/ui/fixture.tsx"));
    expect(errors).toEqual([]);
  });
});

describe("formas de saltarse la tabla", () => {
  it("el dominio rechaza rutas relativas que escapan, import() dinámico, require y re-exportaciones", async () => {
    const errors = importErrors(await lintAs("escapes.ts", "src/domain/contact/fixture.ts"));
    expect(lines(errors)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("las rutas rechazan adaptadores por ruta relativa, dinámica o con segmentos «..»", async () => {
    const errors = importErrors(await lintAs("escapes.ts", "src/app/api/contact/route.ts"));
    // Línea 5 (@/lib/./server/env) se rechaza por el segmento «./»; línea 6 por salir a worker/.
    expect(lines(errors)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("lib/ no puede importar lib/server ni otras carpetas, tampoco de forma relativa o dinámica", async () => {
    const errors = importErrors(await lintAs("lib-forbidden.ts", "src/lib/fixture.ts"));
    expect(lines(errors)).toEqual([2, 3, 4, 5]);
  });

  it("lib/server no puede importar componentes; adaptadores e i18n sí", async () => {
    const errors = importErrors(await lintAs("server-forbidden.ts", "src/lib/server/fixture.ts"));
    expect(lines(errors)).toEqual([1]);
  });

  it("worker/ sigue las mismas reglas que lib/server", async () => {
    const errors = importErrors(await lintAs("server-forbidden.ts", "worker/fixture.ts"));
    expect(lines(errors)).toEqual([1]);
  });
});

describe("colores: variantes y falsos positivos", () => {
  it("rechaza hex numérico, funciones en mayúsculas y color()", async () => {
    const errors = colorErrors(await lintAs("color-variants.tsx", "src/components/journey/scene/fixture.tsx"));
    expect(lines(errors)).toEqual([2, 3, 4]);
  });

  it("no confunde con colores las anclas, entidades HTML, color-mix ni texto corriente", async () => {
    const errors = colorErrors(await lintAs("color-false-positives.tsx", "src/components/ui/fixture.tsx"));
    expect(errors).toEqual([]);
  });

  it("los diccionarios quedan exentos: su texto puede contener «#»", async () => {
    const errors = colorErrors(await lintAs("color-literals.tsx", "src/i18n/dictionaries/es.ts"));
    expect(errors).toEqual([]);
  });
});
